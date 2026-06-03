import { eq, and, desc, sql } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IInvoiceRepository } from "@/core/ports/invoice-repository";
import type { Invoice, InvoiceItem } from "@/core/entities/invoice";

function invRow(r: typeof schema.invoices.$inferSelect): Invoice {
  return { ...r, createdAt: r.createdAt, updatedAt: r.updatedAt };
}
function itemRow(r: typeof schema.invoiceItems.$inferSelect): InvoiceItem {
  return { ...r };
}

export const invoiceRepo: IInvoiceRepository = {
  async listByClub(clubId) {
    const rows = db.select().from(schema.invoices).where(eq(schema.invoices.clubId, clubId)).orderBy(desc(schema.invoices.issueDate)).all();
    return Promise.all(rows.map(async r => {
      const items = db.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, r.id)).all().map(itemRow);
      return { ...invRow(r), items };
    }));
  },
  async findById(id) {
    const r = db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).get();
    if (!r) return null;
    const items = db.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, id)).all().map(itemRow);
    return { ...invRow(r), items };
  },
  async create(input, items) {
    const id = uuid(); const now = new Date();
    db.insert(schema.invoices).values({
      dianCufe: null, dianXml: null, dianStatus: null,
      id, clubId: input.clubId, userId: input.userId, invoiceNumber: input.invoiceNumber, prefix: input.prefix,
      consecutive: input.consecutive, issueDate: input.issueDate, dueDate: input.dueDate,
      subtotal: input.subtotal, taxRate: input.taxRate, taxAmount: input.taxAmount, total: input.total,
      currency: input.currency, status: "draft",
      customerName: input.customerName, customerDocument: input.customerDocument,
      customerDocumentType: input.customerDocumentType, customerEmail: input.customerEmail,
      customerPhone: input.customerPhone, customerAddress: input.customerAddress,
      paymentMethod: input.paymentMethod, notes: input.notes,
      createdAt: now, updatedAt: now,
    }).run();

    for (const item of items) {
      db.insert(schema.invoiceItems).values({
        id: uuid(), invoiceId: id, description: item.description,
        quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal,
        bookingId: item.bookingId ?? null,
      }).run();
    }

    return (await this.findById(id))!;
  },
  async updateStatus(id, status, dianInfo) {
    const now = new Date();
    const updates: Record<string, unknown> = { status, updatedAt: now };
    if (dianInfo?.cufe) updates.dianCufe = dianInfo.cufe;
    if (dianInfo?.xml) updates.dianXml = dianInfo.xml;
    if (dianInfo?.dianStatus) updates.dianStatus = dianInfo.dianStatus;
    db.update(schema.invoices).set(updates as any).where(eq(schema.invoices.id, id)).run();
    return (await this.findById(id))!;
  },
  async getNextConsecutive(clubId, prefix) {
    const r = db.select({ max: sql<number>`COALESCE(MAX(${schema.invoices.consecutive}), 0)` }).from(schema.invoices).where(and(eq(schema.invoices.clubId, clubId), eq(schema.invoices.prefix, prefix))).get();
    return (r?.max ?? 0) + 1;
  },
  async generatePDF(invoice) {
    // Simple HTML-based invoice PDF generation
    const items = invoice.items || [];
    const rows = items.map(i =>
      `<tr><td>${i.description}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${(i.unitPrice / 100).toLocaleString("es-CO")}</td><td style="text-align:right">${(i.subtotal / 100).toLocaleString("es-CO")}</td></tr>`
    ).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;margin:40px;color:#1a1a1a}h1{color:#1a3a2a}.header{display:flex;justify-content:space-between;margin-bottom:30px}.info{margin-bottom:20px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.totals{text-align:right;margin-top:20px}.footer{margin-top:40px;font-size:12px;color:#666}</style></head><body><div class="header"><div><h1>FACTURA ELECTRÓNICA</h1><p>${invoice.invoiceNumber}</p></div><div><p><strong>Fecha:</strong> ${invoice.issueDate.toLocaleDateString("es-CO")}</p><p><strong>Vence:</strong> ${invoice.dueDate?.toLocaleDateString("es-CO") || "—"}</p></div></div><div class="info"><p><strong>Cliente:</strong> ${invoice.customerName}</p><p><strong>Documento:</strong> ${invoice.customerDocumentType || ""} ${invoice.customerDocument || ""}</p><p><strong>Email:</strong> ${invoice.customerEmail || "—"}</p><p><strong>Tel:</strong> ${invoice.customerPhone || "—"}</p></div><table><thead><tr><th>Descripción</th><th>Cant</th><th>Valor Unit.</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><p><strong>Subtotal:</strong> $${(invoice.subtotal / 100).toLocaleString("es-CO")} COP</p><p><strong>IVA (19%):</strong> $${(invoice.taxAmount / 100).toLocaleString("es-CO")} COP</p><p><strong>TOTAL:</strong> $${(invoice.total / 100).toLocaleString("es-CO")} COP</p></div>${invoice.dianCufe ? `<div class="footer"><p><strong>CUFE:</strong> ${invoice.dianCufe}</p><p>Factura electrónica validada por la DIAN</p></div>` : ""}</body></html>`;

    return Buffer.from(html, "utf-8");
  },
};
