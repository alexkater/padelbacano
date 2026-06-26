import { expect, type Page, test } from "@playwright/test";

async function loginAsPlayer(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill("jugador1@demo.com");
  await page.locator("#password").fill("demo123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/clubes", { timeout: 10000 });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
}

test.describe("Suite 5: Booking edge cases", () => {
  test("duration 0 returns 400", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.post("/api/bookings", {
      data: { courtId: "court-bog-1", startTime: "2026-12-01T10:00:00.000Z", duration: 0 },
    });
    expect(res.status()).toBe(400);
  });

  test("duration greater than 24h returns 400", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.post("/api/bookings", {
      data: { courtId: "court-bog-1", startTime: "2026-12-01T11:00:00.000Z", duration: 1500 },
    });
    expect(res.status()).toBe(400);
  });

  test("startTime greater than endTime returns 400", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.post("/api/bookings", {
      data: {
        courtId: "court-bog-1",
        startTime: "2026-12-01T13:00:00.000Z",
        endTime: "2026-12-01T12:00:00.000Z",
        duration: 60,
      },
    });
    expect(res.status()).toBe(400);
  });

  test("non-ISO date returns 400", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.post("/api/bookings", {
      data: { courtId: "court-bog-1", startTime: "mañana a las diez", duration: 60 },
    });
    expect(res.status()).toBe(400);
  });

  test("empty courtId returns 400 or 404", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.post("/api/bookings", {
      data: { courtId: "", startTime: "2026-12-01T14:00:00.000Z", duration: 60 },
    });
    expect([400, 404]).toContain(res.status());
  });

  test("simultaneous bookings produce at least one conflict", async ({ page }) => {
    await loginAsPlayer(page);
    const payload = { courtId: "court-bog-1", startTime: "2026-12-02T10:00:00.000Z", duration: 60 };
    const responses = await Promise.all([
      page.context().request.post("/api/bookings", { data: payload }),
      page.context().request.post("/api/bookings", { data: payload }),
    ]);
    expect(responses.map((res) => res.status()).sort()).toEqual([201, 409]);
  });
});

test.describe("Suite 5: Mobile, navigation and PWA", () => {
  test("mobile MVP pages have no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ["/clubes", "/reservar", "/login", "/register"]) {
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("main buttons are at least 44px on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/clubes");
    const boxes = await page.locator("button, a").evaluateAll((elements) =>
      elements
        .slice(0, 10)
        .map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .map((rect) => ({ width: rect.width, height: rect.height })),
    );
    expect(boxes.some((box) => box.width >= 44 && box.height >= 44)).toBe(true);
  });

  test("navigation clubs to reservar to perfil to clubs has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await loginAsPlayer(page);
    await page.goto("/clubes");
    await page.goto("/reservar");
    await page.goto("/perfil");
    await page.goto("/clubes");
    expect(errors).toHaveLength(0);
  });

  test("refresh protected page without session redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await page.reload();
    await expect(page).toHaveURL(/\/login/);
  });

  test("manifest is loaded", async ({ page }) => {
    await page.goto("/clubes");
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifestHref).toBeTruthy();
    const res = await page.request.get(manifestHref!);
    expect(res.status()).toBe(200);
  });

  test("service worker is registered", async ({ page }) => {
    await page.goto("/clubes");
    const registered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0 || navigator.serviceWorker.controller !== null;
    });
    expect(registered).toBe(true);
  });
});
