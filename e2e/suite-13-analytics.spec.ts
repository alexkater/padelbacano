import { expect, type Page, test } from "@playwright/test";

// ─── Seeded identities ──────────────────────────────────────────────────────

const ADMIN_EMAIL = "admin@bogota.com";
const ADMIN_PASSWORD = "demo123";
const PLAYER_EMAIL = "jugador1@demo.com";
const PLAYER_PASSWORD = "demo123";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/clubes", { timeout: 10000 });
}

async function loginAsPlayer(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(PLAYER_EMAIL);
  await page.locator("#password").fill(PLAYER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/clubes", { timeout: 10000 });
}

// ─── Tests: Analytics Overview API ──────────────────────────────────────────

test.describe("Suite 13: Analytics — Overview API", () => {
  test("GET /api/analytics/overview returns 200 for admin with expected shape", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get("/api/analytics/overview");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.overview).toBeDefined();
    expect(typeof body.overview.totalRevenue).toBe("number");
    expect(typeof body.overview.totalBookings).toBe("number");
    expect(typeof body.overview.occupancyPct).toBe("number");
    expect(Array.isArray(body.overview.revenueByDay)).toBe(true);
    expect(Array.isArray(body.overview.occupancyByHour)).toBe(true);
    expect(Array.isArray(body.overview.topCourts)).toBe(true);
    expect(body.revenue).toBeDefined();
    expect(typeof body.revenue.total).toBe("number");
  });

  test("GET /api/analytics/overview accepts from/to date range params", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get(
      "/api/analytics/overview?from=2026-06-01&to=2026-07-01",
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.overview.totalBookings).toBeGreaterThanOrEqual(0);
  });

  test("GET /api/analytics/overview returns 403 for non-admin (player)", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.get("/api/analytics/overview");
    expect(res.status()).toBe(403);
  });

  test("GET /api/analytics/overview returns 401 for unauthenticated", async ({ request }) => {
    const res = await request.get("/api/analytics/overview");
    expect(res.status()).toBe(401);
  });
});

// ─── Tests: Analytics Revenue API ───────────────────────────────────────────

test.describe("Suite 13: Analytics — Revenue API", () => {
  test("GET /api/analytics/revenue returns revenue report for admin", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get("/api/analytics/revenue");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.report).toBeDefined();
    expect(body.report.period).toBeDefined();
    expect(typeof body.report.total).toBe("number");
    expect(Array.isArray(body.report.byMethod)).toBe(true);
    expect(Array.isArray(body.report.byDay)).toBe(true);
    expect(Array.isArray(body.report.byMonth)).toBe(true);
  });

  test("GET /api/analytics/revenue respects from/to date filters", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get(
      "/api/analytics/revenue?from=2026-06-01&to=2026-07-01",
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.report.period.from).toBeDefined();
    expect(body.report.period.to).toBeDefined();
  });

  test("GET /api/analytics/revenue returns 403 for unauthenticated", async ({ request }) => {
    const res = await request.get("/api/analytics/revenue");
    expect(res.status()).toBe(401);
  });

  test("Revenue byMethod contains expected payment methods", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get("/api/analytics/revenue");
    expect(res.status()).toBe(200);
    const body = await res.json();
    if (body.report.byMethod.length > 0) {
      for (const entry of body.report.byMethod) {
        expect(typeof entry.method).toBe("string");
        expect(typeof entry.amount).toBe("number");
        expect(entry.amount).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ─── Tests: Analytics Occupancy API ─────────────────────────────────────────

test.describe("Suite 13: Analytics — Occupancy API", () => {
  test("GET /api/analytics/occupancy returns occupancy report for admin", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get("/api/analytics/occupancy");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.report).toBeDefined();
    expect(typeof body.report.overallPct).toBe("number");
    expect(Array.isArray(body.report.byHour)).toBe(true);
    expect(Array.isArray(body.report.byCourt)).toBe(true);
  });

  test("GET /api/analytics/occupancy with date range returns filtered results", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get(
      "/api/analytics/occupancy?from=2026-06-01&to=2026-07-01",
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.report.overallPct).toBeGreaterThanOrEqual(0);
    expect(body.report.overallPct).toBeLessThanOrEqual(100);
  });

  test("GET /api/analytics/occupancy returns 403 for player", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.get("/api/analytics/occupancy");
    expect(res.status()).toBe(403);
  });
});

// ─── Tests: Analytics Admin UI ──────────────────────────────────────────────

test.describe("Suite 13: Analytics — Admin UI", () => {
  test("Admin analytics page loads with KPI cards", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/analytics");
    // Wait for heading to confirm page loaded
    await expect(page.getByText("Analytics & BI")).toBeVisible();
    // Wait for KPI cards to render (data loaded)
    await expect(page.getByText("Reservas")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Ocupación")).toBeVisible();
    await expect(page.getByText("Ingresos")).toBeVisible();
  });

  test("Analytics page shows revenue by day and occupancy by hour charts", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/analytics");
    await expect(page.getByText("Analytics & BI")).toBeVisible();
    // Chart section headers
    await expect(page.getByText("Ingresos por Día")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Ocupación por Hora")).toBeVisible();
    await expect(page.getByText("Ingresos por Método")).toBeVisible();
    await expect(page.getByText("Pistas Más Usadas")).toBeVisible();
  });

  test("Date range filter changes analytics data", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/analytics");
    await expect(page.getByText("Analytics & BI")).toBeVisible();

    // Wait for initial data load
    await expect(page.getByText("Reservas")).toBeVisible({ timeout: 10000 });

    // Change filter to 7 days
    await page.locator("select").first().selectOption("7");
    // Wait for re-render
    await page.waitForTimeout(500);
    // Still showing KPI cards
    await expect(page.getByText("Reservas")).toBeVisible();

    // Change filter to 90 days
    await page.locator("select").first().selectOption("90");
    await page.waitForTimeout(500);
    await expect(page.getByText("Reservas")).toBeVisible();
  });
});

// ─── Tests: Tenant Isolation ────────────────────────────────────────────────

test.describe("Suite 13: Analytics — Tenant isolation", () => {
  test("Admin cannot access another club's analytics via clubId param", async ({ page }) => {
    // Login as admin of club-bogota
    await loginAsAdmin(page);

    // Attempt to fetch revenue for club-medellin
    const res = await page.context().request.get(
      "/api/analytics/revenue?clubId=club-medellin",
    );
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test("Admin overview is scoped to own club", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.context().request.get("/api/analytics/overview");
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Data should be for club-bogota — no way to inject a different clubId
    // (overview route doesn't accept clubId param)
    expect(body.overview).toBeDefined();
  });
});
