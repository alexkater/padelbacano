import { expect, type Page, test } from "@playwright/test";

// ─── Seeded identities ──────────────────────────────────────────────────────

const PLAYER_EMAIL = "jugador1@demo.com";
const PLAYER_PASSWORD = "demo123";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loginAsPlayer(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(PLAYER_EMAIL);
  await page.locator("#password").fill(PLAYER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/clubes", { timeout: 10000 });
}

// ─── Tests: Service Worker ──────────────────────────────────────────────────

test.describe("Suite 12: PWA — Service Worker", () => {
  test("SW is registered after navigating to public page", async ({ page }) => {
    await page.goto("/clubes");
    const registered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });
    expect(registered).toBe(true);
  });

  test("SW controller is active after navigation", async ({ page }) => {
    await page.goto("/clubes");
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    const swScriptUrl = await page.evaluate(() => (navigator.serviceWorker.controller as unknown as { scriptURL: string })?.scriptURL ?? "");
    expect(swScriptUrl).toContain("/sw.js");
  });

  test("SW registration scope is root (/)", async ({ page }) => {
    await page.goto("/clubes");
    const scope = await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations[0]?.scope ?? "";
    });
    expect(scope).toBe("http://localhost:3101/");
  });

  test("SW precaches shell assets on install", async ({ page }) => {
    await page.goto("/clubes");
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    const shellCached = await page.evaluate(async () => {
      const cache = await caches.open("padelbacano-shell-v2");
      const urls = ["/offline.html", "/manifest.json", "/icon.png"];
      const results = await Promise.all(urls.map((url) => cache.match(url)));
      return results.every((r) => r !== undefined);
    });
    expect(shellCached).toBe(true);
  });

  test("Static asset cache is created by SW", async ({ page }) => {
    await page.goto("/clubes");
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    const staticCache = await page.evaluate(async () => {
      const keys = await caches.keys();
      return keys.includes("padelbacano-static-v1");
    });
    expect(staticCache).toBe(true);
  });
});

// ─── Tests: Web App Manifest ───────────────────────────────────────────────

test.describe("Suite 12: PWA — Web App Manifest", () => {
  test("Manifest link element exists in document head", async ({ page }) => {
    await page.goto("/clubes");
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(href).toBe("/manifest.json");
  });

  test("Manifest JSON is served with 200", async ({ page }) => {
    const res = await page.request.get("/manifest.json");
    expect(res.status()).toBe(200);
  });

  test("Manifest contains required PWA fields", async ({ page }) => {
    const res = await page.request.get("/manifest.json");
    const manifest = await res.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe("standalone");
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    expect(manifest.icons.some((icon: { sizes: string }) => icon.sizes === "512x512")).toBe(true);
  });

  test("Manifest has locale and categories set", async ({ page }) => {
    const res = await page.request.get("/manifest.json");
    const manifest = await res.json();
    expect(manifest.lang).toBe("es-CO");
    expect(manifest.categories).toContain("sports");
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.theme_color).toBeTruthy();
  });
});

// ─── Tests: Offline Shell ───────────────────────────────────────────────────

test.describe("Suite 12: PWA — Offline shell", () => {
  test("Offline.html is accessible and contains branded offline message", async ({ page }) => {
    const res = await page.request.get("/offline.html");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("Sin conexión");
    expect(text).toContain("PádelBacano");
    expect(text).toContain("Reintentar");
  });

  test("Offline shell is precached in SW cache", async ({ page }) => {
    await page.goto("/clubes");
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    const cached = await page.evaluate(async () => {
      const cache = await caches.open("padelbacano-shell-v2");
      const match = await cache.match("/offline.html");
      return match !== undefined && match.ok;
    });
    expect(cached).toBe(true);
  });

  test("Sensitive paths are not cached by SW", async ({ page }) => {
    await page.goto("/clubes");
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    const sensitiveCached = await page.evaluate(async () => {
      const pageCache = await caches.open("padelbacano-pages-v1");
      const apiMatch = await pageCache.match("http://localhost:3101/api/clubs");
      const shellCache = await caches.open("padelbacano-shell-v2");
      const adminMatch = await shellCache.match("/admin");
      return apiMatch !== undefined || adminMatch !== undefined;
    });
    expect(sensitiveCached).toBe(false);
  });
});

// ─── Tests: Push notification preferences ───────────────────────────────────

test.describe("Suite 12: PWA — Push notification preferences", () => {
  test("pushEnabled preference defaults to true", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.get("/api/user/notifications");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.preferences.pushEnabled).toBe(true);
  });

  test("pushEnabled can be toggled off and on (round-trip)", async ({ page }) => {
    await loginAsPlayer(page);

    const offRes = await page.context().request.put("/api/user/notifications", {
      data: { pushEnabled: false },
    });
    expect(offRes.status()).toBe(200);
    let body = await offRes.json();
    expect(body.preferences.pushEnabled).toBe(false);

    const getRes = await page.context().request.get("/api/user/notifications");
    expect(getRes.status()).toBe(200);
    body = await getRes.json();
    expect(body.preferences.pushEnabled).toBe(false);

    await page.context().request.put("/api/user/notifications", {
      data: { pushEnabled: true },
    });
  });
});
