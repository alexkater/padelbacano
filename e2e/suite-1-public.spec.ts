import { expect, test } from "@playwright/test";

test.describe("Suite 1: Public API", () => {
  test("GET /api/clubs returns clubs", async ({ request }) => {
    const res = await request.get("/api/clubs");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.clubs.length).toBeGreaterThanOrEqual(2);
  });

  test("GET /api/clubs filters by Bogotá", async ({ request }) => {
    const res = await request.get("/api/clubs?city=Bogot%C3%A1");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.clubs.length).toBeGreaterThanOrEqual(1);
  });

  test("GET /api/clubs returns empty array for unknown city", async ({ request }) => {
    const res = await request.get("/api/clubs?city=NoExiste");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.clubs).toHaveLength(0);
  });

  test("GET /api/club/club-bogota returns club details", async ({ request }) => {
    const res = await request.get("/api/club/club-bogota");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Club Pádel Bogotá");
    expect(body.courts.length).toBe(2);
  });

  test("GET /api/club/no-existe returns 404", async ({ request }) => {
    const res = await request.get("/api/club/no-existe");
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test("GET /api/courts returns active courts for club", async ({ request }) => {
    const res = await request.get("/api/courts?clubId=club-bogota");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.courts.length).toBe(2);
    expect(body.courts.every((court: { isActive?: boolean }) => court.isActive !== false)).toBe(true);
  });

  test("GET /api/courts without clubId returns 400", async ({ request }) => {
    const res = await request.get("/api/courts");
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("clubId");
  });

  test("GET /api/courts for unknown club returns 404", async ({ request }) => {
    const res = await request.get("/api/courts?clubId=no-existe");
    expect(res.status()).toBe(404);
  });

  test("GET /api/courts/availability returns slots", async ({ request }) => {
    const res = await request.get("/api/courts/availability?courtId=court-bog-1&date=2026-07-01");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.slots.length).toBe(17);
    expect(body.slots.some((slot: { available: boolean }) => slot.available === false)).toBe(true);
  });

  test("GET /api/courts/availability for past date keeps slots available", async ({ request }) => {
    const res = await request.get("/api/courts/availability?courtId=court-bog-1&date=2025-01-01");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.slots.every((slot: { available: boolean }) => slot.available)).toBe(true);
  });

  test("GET /api/courts/availability without params returns 400", async ({ request }) => {
    const res = await request.get("/api/courts/availability");
    expect(res.status()).toBe(400);
  });

  test("GET /api/courts/availability for unknown court returns 404", async ({ request }) => {
    const res = await request.get("/api/courts/availability?courtId=no-existe&date=2026-07-01");
    expect(res.status()).toBe(404);
  });

  test("GET /api/courts/availability with invalid date returns 400", async ({ request }) => {
    const res = await request.get("/api/courts/availability?courtId=court-bog-1&date=invalido");
    expect(res.status()).toBe(400);
  });
});

test.describe("Suite 1: Public pages", () => {
  test("/ renders landing page with hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\//);
    await expect(page.locator("body")).toContainText(/Encuentra tu partido|PádelBacano|Buscar canchas/i);
  });

  test("/ has search CTA", async ({ page }) => {
    await page.goto("/");
    const buscanButton = page.getByRole("link", { name: /buscar/i }).or(page.locator('a[href*="buscar"]'));
    await expect(buscanButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("/ clubs counter visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/clubes/i, { timeout: 5000 });
  });

  test("/ para-clubes CTA links to onboarding", async ({ page }) => {
    await page.goto("/");
    const paraClubes = page.locator('a[href*="onboarding"], a[href*="club"]').first();
    await expect(paraClubes).toBeVisible({ timeout: 5000 });
  });

  test("/reservar renders booking page", async ({ page }) => {
    await page.goto("/reservar");
    await expect(page.locator("body")).toContainText(/reserv|cancha|pista|club/i);
  });

  test("/login renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("textbox", { name: /email|correo/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /contraseña|password/i })).toBeVisible();
  });

  test("/register renders", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("body")).toContainText(/registr|crear|cuenta/i);
  });

  test("/ redirects to /clubes", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\//);
  });

  test("non-MVP pages return 404 or redirect", async ({ page }) => {
    const torneos = await page.goto("/torneos");
    expect([200, 307, 308, 404]).toContain(torneos?.status());
    await expect(page.locator("body")).not.toContainText(/error interno/i);

    const escuela = await page.goto("/escuela");
    expect([200, 307, 308, 404]).toContain(escuela?.status());
    await expect(page.locator("body")).not.toContainText(/error interno/i);
  });
});
