import { expect, type Page, test } from "@playwright/test";

const UNIQUE_ID = Date.now().toString(36);
const TEST_SLUG = `test-club-${UNIQUE_ID}`;
const EXISTING_SLUG = "club-padel-bogota";

async function fillStep1(page: Page) {
  await page.goto("/onboarding");
  await page.waitForSelector("h1");
  await page.locator("#clubName").fill("Club E2E Test");
  // slug is read-only, auto-generated from clubName
  await page.locator("#city").fill("Bogotá");
  await page.locator("#department").fill("Cundinamarca");
  await page.locator("#nit").fill("901.123.456-7");
  await page.locator("#contactName").fill("Test Contact");
  await page.locator("#contactPhone").fill("+57 300 123 4567");
  await page.locator("#contactEmail").fill(`test-${UNIQUE_ID}@e2e.test`);
}

test.describe("Suite 7: Onboarding wizard UI", () => {
  test("onboarding page loads with all 6 steps visible", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: /registra tu club/i })).toBeVisible();
    await expect(page.locator("text=1. Perfil")).toBeVisible();
    await expect(page.locator("text=2. Canchas")).toBeVisible();
    await expect(page.locator("text=3. Precios")).toBeVisible();
    await expect(page.locator("text=4. Horarios")).toBeVisible();
    await expect(page.locator("text=5. Staff")).toBeVisible();
    await expect(page.locator("text=6. Revisión")).toBeVisible();
    await expect(page.getByRole("button", { name: /siguiente/i })).toBeDisabled();
  });

  test("fill step 1 (Perfil) enables Next button", async ({ page }) => {
    await page.goto("/onboarding");
    await page.locator("#clubName").fill("Club E2E Perfil");
    await page.locator("#city").fill("Medellín");
    await page.locator("#department").fill("Antioquia");
    await page.locator("#nit").fill("901.123.456-7");
    await page.locator("#contactName").fill("Ana Prueba");
    await page.locator("#contactPhone").fill("+57 300 987 6543");
    await page.locator("#contactEmail").fill("ana@e2e.test");
    await expect(page.getByRole("button", { name: /siguiente/i })).toBeEnabled();
  });

  test("navigate step 1 to step 2 (Canchas) shows court form", async ({ page }) => {
    await fillStep1(page);
    await page.getByRole("button", { name: /siguiente/i }).click();
    await expect(page.locator("text=2. Canchas")).toBeVisible();
    await expect(page.locator("text=Agregar cancha")).toBeVisible();
    await expect(page.locator("text=Quitar")).toBeVisible();
  });

  test("add a second court in step 2", async ({ page }) => {
    await fillStep1(page);
    await page.getByRole("button", { name: /siguiente/i }).click();
    await page.getByRole("button", { name: /agregar cancha/i }).click();
    await expect(page.locator("input[id='court-name-1']")).toBeVisible();
    await expect(page.locator("input[id='court-name-1']")).toHaveValue(/cancha 2/i);
  });

  test("remove court in step 2 reduces court count", async ({ page }) => {
    await fillStep1(page);
    await page.getByRole("button", { name: /siguiente/i }).click();
    const removeButtons = page.getByRole("button", { name: /quitar/i });
    const initialCount = await removeButtons.count();
    await removeButtons.first().click();
    const afterCount = await page.getByRole("button", { name: /quitar/i }).count();
    expect(afterCount).toBeLessThan(initialCount);
  });

  test("navigate to step 3 (Precios) and see pricing fields", async ({ page }) => {
    await fillStep1(page);
    await page.getByRole("button", { name: /siguiente/i }).click();
    // step 2 — skip court config, just go
    await page.getByRole("button", { name: /siguiente/i }).click();
    await expect(page.locator("text=3. Precios")).toBeVisible();
    await expect(page.locator("text=Punta COP")).toBeVisible();
    await expect(page.locator("text=Valle COP")).toBeVisible();
  });

  test("navigate to step 4 (Horarios) shows time inputs", async ({ page }) => {
    await fillStep1(page);
    // step 2
    await page.getByRole("button", { name: /siguiente/i }).click();
    // step 3 — pricing defaults are valid
    await page.getByRole("button", { name: /siguiente/i }).click();
    await expect(page.locator("text=4. Horarios")).toBeVisible();
    await expect(page.locator("#opening")).toBeVisible();
    await expect(page.locator("#closing")).toBeVisible();
    await expect(page.locator("#duration")).toBeVisible();
  });

  test("navigate to step 5 (Staff) shows staff fields", async ({ page }) => {
    await fillStep1(page);
    await page.getByRole("button", { name: /siguiente/i }).click();
    await page.getByRole("button", { name: /siguiente/i }).click();
    await page.getByRole("button", { name: /siguiente/i }).click();
    await expect(page.locator("text=5. Staff")).toBeVisible();
    await expect(page.locator("text=Agregar staff")).toBeVisible();
  });

  test("navigate to step 6 (Revisión) shows summary", async ({ page }) => {
    await fillStep1(page);
    await page.getByRole("button", { name: /siguiente/i }).click();
    await page.getByRole("button", { name: /siguiente/i }).click();
    await page.getByRole("button", { name: /siguiente/i }).click();
    await page.getByRole("button", { name: /siguiente/i }).click();
    await expect(page.locator("text=6. Revisión")).toBeVisible();
    await expect(page.locator("text=Club E2E Test")).toBeVisible();
    await expect(page.locator("text=Bogotá")).toBeVisible();
  });

  test("step 6 submit button disabled until terms accepted", async ({ page }) => {
    await fillStep1(page);
    await page.getByRole("button", { name: /siguiente/i }).click();
    await page.getByRole("button", { name: /siguiente/i }).click();
    await page.getByRole("button", { name: /siguiente/i }).click();
    await page.getByRole("button", { name: /siguiente/i }).click();
    await expect(page.getByRole("button", { name: /enviar solicitud/i })).toBeDisabled();
  });

  test("mobile viewport onboarding renders all steps", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: /registra tu club/i })).toBeVisible();
    await expect(page.locator("text=1. Perfil")).toBeVisible();
    await expect(page.locator("#clubName")).toBeVisible();
    await page.locator("#clubName").fill("Mobile Club");
    await page.locator("#city").fill("Cali");
    await page.locator("#department").fill("Valle del Cauca");
    await page.locator("#nit").fill("901.123.456-7");
    await page.locator("#contactName").fill("Móvil Test");
    await page.locator("#contactPhone").fill("+57 300 111 2233");
    await page.locator("#contactEmail").fill("movil@e2e.test");
    await expect(page.getByRole("button", { name: /siguiente/i })).toBeEnabled();
  });
});

test.describe("Suite 7: Onboarding API", () => {
  const onboardingPayload = () => ({
    step1: {
      clubName: `E2E Club ${UNIQUE_ID}`,
      slug: TEST_SLUG,
      city: "Bogotá",
      department: "Cundinamarca",
      nit: "901.123.456-7",
      contactName: "Test Contact",
      contactPhone: "+573001234567",
      contactEmail: `test-${UNIQUE_ID}@e2e.test`,
    },
    step2: {
      courts: [{ name: "Cancha 1", sport: "padel" as const, surface: "glass", indoor: true, lighting: true }],
    },
    step3: {
      pricing: [
        { courtIndex: 0, dayOfWeek: 1, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 },
        { courtIndex: 0, dayOfWeek: 2, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 },
        { courtIndex: 0, dayOfWeek: 3, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 },
        { courtIndex: 0, dayOfWeek: 4, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 },
        { courtIndex: 0, dayOfWeek: 5, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 },
        { courtIndex: 0, dayOfWeek: 6, startTime: "06:00", endTime: "22:00", peakPriceCents: 14000000, offPeakPriceCents: 9000000 },
        { courtIndex: 0, dayOfWeek: 0, startTime: "08:00", endTime: "20:00", peakPriceCents: 14000000, offPeakPriceCents: 9000000 },
      ],
    },
    step4: { openingTime: "06:00", closingTime: "22:00", slotDuration: 60 as const },
    step5: { staffMembers: [{ name: "Admin E2E", role: "admin", email: "admin@e2e.test", phone: "+573001234568" }] },
    step6: {
      profile: {
        clubName: `E2E Club ${UNIQUE_ID}`,
        slug: TEST_SLUG,
        city: "Bogotá",
        department: "Cundinamarca",
        nit: "901.123.456-7",
        contactName: "Test Contact",
        contactPhone: "+573001234567",
        contactEmail: `test-${UNIQUE_ID}@e2e.test`,
      },
      courts: { courts: [{ name: "Cancha 1", sport: "padel" as const, surface: "glass", indoor: true, lighting: true }] },
      pricing: {
        pricing: [
          { courtIndex: 0, dayOfWeek: 1, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 },
          { courtIndex: 0, dayOfWeek: 2, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 },
          { courtIndex: 0, dayOfWeek: 3, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 },
          { courtIndex: 0, dayOfWeek: 4, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 },
          { courtIndex: 0, dayOfWeek: 5, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 },
          { courtIndex: 0, dayOfWeek: 6, startTime: "06:00", endTime: "22:00", peakPriceCents: 14000000, offPeakPriceCents: 9000000 },
          { courtIndex: 0, dayOfWeek: 0, startTime: "08:00", endTime: "20:00", peakPriceCents: 14000000, offPeakPriceCents: 9000000 },
        ],
      },
      schedule: { openingTime: "06:00", closingTime: "22:00", slotDuration: 60 as const },
      staff: { staffMembers: [{ name: "Admin E2E", role: "admin", email: "admin@e2e.test", phone: "+573001234568" }] },
      termsAccepted: true,
    },
  });

  test("POST /api/onboarding with valid payload returns 201 and pending_approval", async ({ request }) => {
    const res = await request.post("/api/onboarding", {
      data: onboardingPayload(),
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("pending_approval");
    expect(body.data.slug).toBe(TEST_SLUG);
    expect(typeof body.data.clubId).toBe("string");
  });

  test("POST /api/onboarding with duplicate slug returns 409", async ({ request }) => {
    const res = await request.post("/api/onboarding", {
      data: { ...onboardingPayload(), step1: { ...onboardingPayload().step1, slug: EXISTING_SLUG } },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("slug");
  });

  test("POST /api/onboarding with missing fields returns 400", async ({ request }) => {
    const res = await request.post("/api/onboarding", {
      data: { step1: { clubName: "" }, step2: { courts: [] } },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.details).toBeDefined();
    expect(Array.isArray(body.details)).toBe(true);
  });

  test("POST /api/onboarding with invalid NIT returns 400", async ({ request }) => {
    const payload = onboardingPayload();
    payload.step1.nit = "123";
    payload.step6.profile.nit = "123";
    const res = await request.post("/api/onboarding", { data: payload });
    expect(res.status()).toBe(400);
  });

  test("POST /api/onboarding with invalid phone returns 400", async ({ request }) => {
    const payload = onboardingPayload();
    payload.step1.contactPhone = "12345";
    payload.step6.profile.contactPhone = "12345";
    const res = await request.post("/api/onboarding", { data: payload });
    expect(res.status()).toBe(400);
  });

  test("POST /api/onboarding with invalid JSON returns 400", async ({ request }) => {
    const res = await request.post("/api/onboarding", {
      data: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
  });
});
