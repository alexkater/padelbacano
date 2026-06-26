import { expect, type Page, test } from "@playwright/test";

// ─── Invoice response shape ─────────────────────────────────────────────────

interface InvoiceItemResponse {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  prefix: string;
  consecutive: number;
  currency: string;
  status: string;
  customerName: string;
  customerDocument: string;
  customerDocumentType: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  items: InvoiceItemResponse[];
}

// ─── Seeded identities ──────────────────────────────────────────────────────

const ADMIN_EMAIL = "admin@bogota.com";
const ADMIN_PASSWORD = "demo123";

// ─── Invoice item factory ───────────────────────────────────────────────────

function invoicePayload() {
  return {
    items: [
      { description: "Alquiler cancha 1 hora", quantity: 1, unitPrice: 7000000 },
      { description: "Alquiler palas", quantity: 2, unitPrice: 500000 },
    ],
    customerName: "Carlos Pérez",
    customerDocument: "1234567890",
    customerDocumentType: "CC",
    customerEmail: "carlos@example.com",
    customerPhone: "+573001234567",
    paymentMethod: "transferencia",
    notes: "Factura de prueba E2E",
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/clubes", { timeout: 10000 });
}

async function createTestInvoice(page: Page): Promise<{ invoice: InvoiceResponse }> {
  const res = await page.context().request.post("/api/invoices", {
    data: invoicePayload(),
  });
  expect(res.status()).toBe(201);
  return res.json() as Promise<{ invoice: InvoiceResponse }>;
}

// ─── Tests: Invoice CRUD ────────────────────────────────────────────────────

test.describe("Suite 10: Invoice creation and listing", () => {
  test("POST /api/invoices creates invoice with correct shape", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    expect(invoice).toBeDefined();
    expect(typeof invoice.id).toBe("string");
    expect(typeof invoice.invoiceNumber).toBe("string");
    expect(invoice.invoiceNumber).toMatch(/^FE-\d{5}$/);
    expect(invoice.prefix).toBe("FE");
    expect(invoice.currency).toBe("COP");
    expect(invoice.status).toBe("draft");
    expect(invoice.customerName).toBe("Carlos Pérez");
    expect(invoice.subtotal).toBeGreaterThan(0);
    expect(invoice.taxAmount).toBeGreaterThan(0);
    expect(invoice.total).toBeGreaterThan(0);
    expect(invoice.total).toBe(invoice.subtotal + invoice.taxAmount);
  });

  test("POST /api/invoices calculates IVA at 19%", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    // subtotal = 7_000_000 + 2 * 500_000 = 8_000_000 cents
    // IVA 19% = 1_520_000 cents
    // total = 9_520_000 cents
    const expectedSubtotal = 7000000 + 2 * 500000;
    expect(invoice.subtotal).toBe(expectedSubtotal);
    expect(invoice.taxRate).toBe(1900);
    expect(invoice.taxAmount).toBe(1520000);
    expect(invoice.total).toBe(expectedSubtotal + 1520000);
  });

  test("GET /api/invoices returns invoice list", async ({ page }) => {
    await loginAsAdmin(page);

    // Create at least one invoice
    await createTestInvoice(page);

    const res = await page.context().request.get("/api/invoices");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.invoices)).toBe(true);
    expect(body.invoices.length).toBeGreaterThanOrEqual(1);

    // Verify invoice shape in list
    const inv = body.invoices[0];
    expect(inv.id).toBeDefined();
    expect(inv.invoiceNumber).toBeDefined();
    expect(inv.status).toBeDefined();
    expect(inv.subtotal).toBeDefined();
    expect(inv.taxAmount).toBeDefined();
    expect(inv.total).toBeDefined();
    expect(inv.items).toBeDefined();
    expect(Array.isArray(inv.items)).toBe(true);
  });

  test("invoice response includes line items", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    expect(Array.isArray(invoice.items)).toBe(true);
    expect(invoice.items.length).toBe(2);
    expect(invoice.items[0].description).toBe("Alquiler cancha 1 hora");
    expect(invoice.items[0].unitPrice).toBe(7000000);
    expect(invoice.items[1].description).toBe("Alquiler palas");
    expect(invoice.items[1].quantity).toBe(2);
  });

  test("invoice status field is present in list", async ({ page }) => {
    await loginAsAdmin(page);
    await createTestInvoice(page);

    const res = await page.context().request.get("/api/invoices");
    expect(res.status()).toBe(200);
    const body = await res.json() as { invoices: Array<Record<string, unknown>> };
    expect(body.invoices.length).toBeGreaterThan(0);

    // All invoices should have a status field
    const statuses = body.invoices.map((inv: Record<string, unknown>) => inv.status);
    expect(statuses.every((s: unknown) => typeof s === "string")).toBe(true);
    expect(statuses).toContain("draft");
  });

  test("invoice consecutive numbers increment", async ({ page }) => {
    await loginAsAdmin(page);

    const first = await createTestInvoice(page);
    const second = await createTestInvoice(page);

    const firstCons = (first.invoice.consecutive as number);
    const secondCons = (second.invoice.consecutive as number);
    expect(secondCons).toBe(firstCons + 1);
  });
});

// ─── Tests: PDF download ────────────────────────────────────────────────────

test.describe("Suite 10: Invoice PDF download", () => {
  test("GET /api/invoices/[id]/pdf returns application/pdf", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    const res = await page.context().request.get(`/api/invoices/${invoice.id}/pdf`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("application/pdf");
    expect(res.headers()["content-disposition"]).toContain("attachment");
    expect(res.headers()["content-disposition"]).toContain(`factura-${invoice.invoiceNumber}.pdf`);

    // Verify it's a valid PDF (starts with %PDF-)
    const pdfBuffer = await res.body();
    expect(pdfBuffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });

  test("PDF content includes NIT, IVA, and total", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    const res = await page.context().request.get(`/api/invoices/${invoice.id}/pdf`);
    expect(res.status()).toBe(200);

    const pdfBuffer = await res.body();
    const pdfText = pdfBuffer.toString("latin1");

    // Look for required Colombian invoice fields in the PDF content
    expect(pdfText).toContain("FACTURA ELECTRÓNICA");
    expect(pdfText).toContain(invoice.invoiceNumber as string);
    expect(pdfText).toContain("IVA");
    expect(pdfText).toContain("TOTAL");
    expect(pdfText).toContain("COP");
    expect(pdfText).toContain("NIT");
    expect(pdfText).toContain(invoice.customerName as string);
  });

  test("unauthorized PDF access returns 401", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    // Clear session and try to download
    await page.context().clearCookies();
    const res = await page.context().request.get(`/api/invoices/${invoice.id}/pdf`);
    expect(res.status()).toBe(401);
  });

  test("PDF for non-existent invoice returns 404", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get("/api/invoices/non-existent-id/pdf");
    expect(res.status()).toBe(404);
  });
});

// ─── Tests: XML download ────────────────────────────────────────────────────

test.describe("Suite 10: Invoice XML download", () => {
  test("GET /api/invoices/[id]/xml returns valid UBL 2.1 XML", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    const res = await page.context().request.get(`/api/invoices/${invoice.id}/xml`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/application\/xml|text\/xml/);
    expect(res.headers()["content-disposition"]).toContain(`${invoice.invoiceNumber}.xml`);

    const xml = await res.text();

    // Verify UBL 2.1 namespace
    expect(xml).toContain("urn:oasis:names:specification:ubl:schema:xsd:Invoice-2");
    expect(xml).toContain("UBLVersionID>2.1");
    expect(xml).toContain("CustomizationID>10");
    expect(xml).toContain("ProfileID>DIAN 2.1");
  });

  test("XML contains required DIAN fields", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    const res = await page.context().request.get(`/api/invoices/${invoice.id}/xml`);
    expect(res.status()).toBe(200);

    const xml = await res.text();

    // Required DIAN fields
    expect(xml).toContain("cbc:InvoiceTypeCode>01");
    expect(xml).toContain("DocumentCurrencyCode>COP");
    expect(xml).toContain("AccountingSupplierParty");
    expect(xml).toContain("AccountingCustomerParty");
    expect(xml).toContain("TaxTotal");
    expect(xml).toContain("LegalMonetaryTotal");
    expect(xml).toContain("cbc:ID>");

    // Tax details
    expect(xml).toContain("IVA");
    expect(xml).toContain("19.00");
    expect(xml).toContain("InvoiceLine");

    // Customer info
    expect(xml).toContain(invoice.customerName as string);
    expect(xml).toContain(invoice.customerDocument as string);
  });

  test("XML total matches invoice total", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    const res = await page.context().request.get(`/api/invoices/${invoice.id}/xml`);
    expect(res.status()).toBe(200);

    const xml = await res.text();
    const totalPesos = ((invoice.total as number) / 100).toFixed(2);

    // Find the PayableAmount element (total)
    expect(xml).toContain(`PayableAmount currencyID="COP">${totalPesos}`);
    expect(xml).toContain(`TaxInclusiveAmount currencyID="COP">${totalPesos}`);
  });

  test("unauthorized XML access returns 401", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    await page.context().clearCookies();
    const res = await page.context().request.get(`/api/invoices/${invoice.id}/xml`);
    expect(res.status()).toBe(401);
  });

  test("XML for non-existent invoice returns 404", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get("/api/invoices/non-existent-id/xml");
    expect(res.status()).toBe(404);
  });
});

// ─── Tests: Invoice status ──────────────────────────────────────────────────

test.describe("Suite 10: Invoice status management", () => {
  test("PUT /api/invoices/[id]/status updates invoice status", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    const res = await page.context().request.put(`/api/invoices/${invoice.id}/status`, {
      data: { status: "issued" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.invoice.status).toBe("issued");
  });

  test("status transitions to paid and cancelled", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    // Draft → issued
    await page.context().request.put(`/api/invoices/${invoice.id}/status`, {
      data: { status: "issued" },
    });

    // issued → paid
    const paidRes = await page.context().request.put(`/api/invoices/${invoice.id}/status`, {
      data: { status: "paid" },
    });
    expect(paidRes.status()).toBe(200);
    const paidBody = await paidRes.json();
    expect(paidBody.invoice.status).toBe("paid");

    // paid → cancelled
    const cancelledRes = await page.context().request.put(`/api/invoices/${invoice.id}/status`, {
      data: { status: "cancelled" },
    });
    expect(cancelledRes.status()).toBe(200);
    const cancelledBody = await cancelledRes.json();
    expect(cancelledBody.invoice.status).toBe("cancelled");
  });

  test("PUT status with CUFE metadata works", async ({ page }) => {
    await loginAsAdmin(page);
    const { invoice } = await createTestInvoice(page);

    const res = await page.context().request.put(`/api/invoices/${invoice.id}/status`, {
      data: {
        status: "issued",
        cufe: "abc123cufe",
        dianStatus: "accepted",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.invoice.status).toBe("issued");
  });
});
