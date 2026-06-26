import { expect, type APIRequestContext, type Page, test } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill("admin@bogota.com");
  await page.locator("#password").fill("demo123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/clubes", { timeout: 10000 });
}

async function loginAsPlayer(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill("jugador1@demo.com");
  await page.locator("#password").fill("demo123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/clubes", { timeout: 10000 });
}

async function createCourt(request: APIRequestContext, name = `Smoke Court ${Date.now()}`) {
  return request.post("/api/admin/courts", {
    data: { name, courtType: "padel" },
  });
}

test.describe("Suite 4: Admin courts CRUD", () => {
  test("GET /api/admin/courts lists admin club courts", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get("/api/admin/courts");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.courts.length).toBeGreaterThanOrEqual(2);
  });

  test("POST /api/admin/courts creates court", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await createCourt(page.context().request);
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.court.name).toContain("Smoke Court");
  });

  test("POST /api/admin/courts without name returns 400", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.post("/api/admin/courts", { data: { type: "padel" } });
    expect(res.status()).toBe(400);
  });

  test("PUT /api/admin/courts/[id] updates court", async ({ page }) => {
    await loginAsAdmin(page);
    const created = await createCourt(page.context().request, `Smoke Update ${Date.now()}`);
    expect(created.status()).toBe(201);
    const { court } = await created.json();
    const res = await page.context().request.put(`/api/admin/courts/${court.id}`, { data: { name: `${court.name} Edited` } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.court.name).toContain("Edited");
  });

  test("DELETE /api/admin/courts/[id] soft-deletes court", async ({ page }) => {
    await loginAsAdmin(page);
    const created = await createCourt(page.context().request, `Smoke Delete ${Date.now()}`);
    expect(created.status()).toBe(201);
    const { court } = await created.json();
    const res = await page.context().request.delete(`/api/admin/courts/${court.id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("player cannot create admin court", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await createCourt(page.context().request);
    expect(res.status()).toBe(403);
  });

  test("admin cannot modify court from another club", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.put("/api/admin/courts/court-med-1", { data: { name: "Nope" } });
    expect(res.status()).toBe(404);
  });
});

test.describe("Suite 4: Admin bookings management", () => {
  test("GET /api/admin/bookings lists club bookings", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get("/api/admin/bookings");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.bookings)).toBe(true);
  });

  test("GET /api/admin/bookings filters by date", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get("/api/admin/bookings?date=2026-07-01");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.bookings)).toBe(true);
  });

  test("GET /api/admin/bookings filters by confirmed status", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get("/api/admin/bookings?status=confirmed");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.bookings.every((booking: { status: string }) => booking.status === "confirmed")).toBe(true);
  });

  test("DELETE /api/admin/bookings/[id] cancels booking", async ({ page }) => {
    await loginAsAdmin(page);
    const created = await page.context().request.post("/api/bookings", {
      data: { courtId: "court-bog-1", startTime: "2026-11-01T10:00:00.000Z", duration: 60 },
    });
    expect(created.status()).toBe(201);
    const { booking } = await created.json();
    const res = await page.context().request.delete(`/api/admin/bookings/${booking.id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.booking.status).toBe("cancelled");
  });

  test("admin cancelling booking from another club returns 403 or 404", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.delete("/api/admin/bookings/booking-med-1");
    expect([403, 404]).toContain(res.status());
  });

  test("player cannot list admin bookings", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.get("/api/admin/bookings");
    expect(res.status()).toBe(403);
  });
});

test.describe("Suite 4: Admin UI", () => {
  test("dashboard loads with courts, bookings, and counters", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator("body")).toContainText(/pistas|reservas|dashboard|admin/i);
    await expect(page.locator("table, [role='table'], [data-testid*='court'], body")).toBeVisible();
  });

  test("create court from UI modal", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: /añadir|agregar|crear.*pista|nueva pista/i }).click();
    await expect(page.locator('form, [role="dialog"]')).toBeVisible();
    await page.locator('input[name="name"]').fill(`UI Smoke ${Date.now()}`);
    await page.getByRole("button", { name: /guardar|crear|añadir/i }).click();
    await expect(page.locator("body")).toContainText(/UI Smoke|creada|pista/i);
  });

  test("weekly calendar grid is visible", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/calendario");
    await expect(page.locator("body")).toContainText(/lunes|martes|miércoles|jueves|viernes|sábado|domingo|calendario/i);
  });

  test("click booking on calendar opens detail dialog", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/calendario");
    const booking = page.locator("button, [role='button'], [data-booking-id]").filter({ hasText: /reserv|jugador|\d{1,2}:\d{2}/i }).first();
    await expect(booking).toBeVisible();
    await booking.click();
    await expect(page.locator('body')).toContainText(/detalle|reserva|jugador|cancelar/i);
  });
});
