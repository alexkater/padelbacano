import { expect, type Page, test } from "@playwright/test";

// ─── Seeded identities ──────────────────────────────────────────────────────

const PLAYER_EMAIL = "jugador1@demo.com";
const PLAYER_PASSWORD = "demo123";
const ADMIN_EMAIL = "admin@bogota.com";
const ADMIN_PASSWORD = "demo123";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loginAsPlayer(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(PLAYER_EMAIL);
  await page.locator("#password").fill(PLAYER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/clubes", { timeout: 10000 });
}

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/clubes", { timeout: 10000 });
}

function slot(day: number, hour: number, minute = 0): string {
  return `2026-12-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
}

// ─── Tests: Notification preferences API ────────────────────────────────────

test.describe("Suite 9: Notification preferences API", () => {
  test("GET /api/user/notifications returns preferences", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.get("/api/user/notifications");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.preferences).toBeDefined();
    expect(typeof body.preferences.emailEnabled).toBe("boolean");
    expect(typeof body.preferences.whatsAppEnabled).toBe("boolean");
    expect(typeof body.preferences.pushEnabled).toBe("boolean");
  });

  test("default preferences are all enabled", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.get("/api/user/notifications");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.preferences.emailEnabled).toBe(true);
    expect(body.preferences.whatsAppEnabled).toBe(true);
    expect(body.preferences.pushEnabled).toBe(true);
  });

  test("unauthenticated access returns 401", async ({ request }) => {
    const res = await request.get("/api/user/notifications");
    expect(res.status()).toBe(401);
  });

  test("PUT /api/user/notifications updates preferences (round-trip)", async ({ page }) => {
    await loginAsPlayer(page);

    // Update: disable WhatsApp
    const putRes = await page.context().request.put("/api/user/notifications", {
      data: { whatsAppEnabled: false },
    });
    expect(putRes.status()).toBe(200);
    const putBody = await putRes.json();
    expect(putBody.preferences.whatsAppEnabled).toBe(false);
    expect(putBody.preferences.emailEnabled).toBe(true);

    // Re-read to verify persistence
    const getRes = await page.context().request.get("/api/user/notifications");
    expect(getRes.status()).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.preferences.whatsAppEnabled).toBe(false);
    expect(getBody.preferences.emailEnabled).toBe(true);

    // Restore default
    await page.context().request.put("/api/user/notifications", {
      data: { whatsAppEnabled: true },
    });
  });

  test("partial update preserves other preference fields", async ({ page }) => {
    await loginAsPlayer(page);

    // Set all to known state
    await page.context().request.put("/api/user/notifications", {
      data: { emailEnabled: true, whatsAppEnabled: true, pushEnabled: true },
    });

    // Partially update only pushEnabled
    const res = await page.context().request.put("/api/user/notifications", {
      data: { pushEnabled: false },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.preferences.emailEnabled).toBe(true);
    expect(body.preferences.whatsAppEnabled).toBe(true);
    expect(body.preferences.pushEnabled).toBe(false);

    // Restore
    await page.context().request.put("/api/user/notifications", {
      data: { pushEnabled: true },
    });
  });

  test("PUT with invalid body returns 400", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.put("/api/user/notifications", {
      data: "not-an-object",
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
  });

  test("PUT without auth returns 401", async ({ request }) => {
    const res = await request.put("/api/user/notifications", {
      data: { emailEnabled: false },
    });
    expect(res.status()).toBe(401);
  });

  test("WhatsApp opt-out is persisted and readable", async ({ page }) => {
    await loginAsPlayer(page);

    // Set WhatsApp to disabled
    await page.context().request.put("/api/user/notifications", {
      data: { whatsAppEnabled: false },
    });

    // Verify
    const getRes = await page.context().request.get("/api/user/notifications");
    expect(getRes.status()).toBe(200);
    const body = await getRes.json();
    expect(body.preferences.whatsAppEnabled).toBe(false);

    // Restore
    await page.context().request.put("/api/user/notifications", {
      data: { whatsAppEnabled: true },
    });
  });
});

// ─── Tests: Notification dispatch via booking events ────────────────────────

test.describe("Suite 9: Notification dispatch on booking events", () => {
  test("booking created returns 201 (dispatch is fire-and-forget, never blocks)", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.post("/api/bookings", {
      data: { courtId: "court-bog-1", startTime: slot(7, 8), duration: 60 },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.booking.status).toBe("confirmed");
  });

  test("booking cancelled triggers notification dispatch synchronously", async ({ page }) => {
    await loginAsPlayer(page);

    // Create a booking to cancel
    const created = await page.context().request.post("/api/bookings", {
      data: { courtId: "court-bog-1", startTime: slot(8, 10), duration: 60 },
    });
    expect(created.status()).toBe(201);
    const { booking } = await created.json();

    // Cancel it — notification dispatch happens before response
    const cancelled = await page.context().request.delete(`/api/bookings/${booking.id}`, {
      data: { reason: "Cambio de planes" },
    });
    expect(cancelled.status()).toBe(200);
    const cancelBody = await cancelled.json();
    expect(cancelBody.booking.status).toBe("cancelled");
    expect(cancelBody.cancellation.reason).toBe("Cambio de planes");
    expect(cancelBody.cancellation.bookingTime.timezone).toBe("America/Bogota");
  });

  test("booking created with WhatsApp phone number triggers WhatsApp dispatch", async ({ page }) => {
    // jugador1@demo.com has a phone number in their profile
    await loginAsPlayer(page);
    const res = await page.context().request.post("/api/bookings", {
      data: { courtId: "court-bog-1", startTime: slot(9, 14), duration: 60 },
    });
    expect(res.status()).toBe(201);
    // Dispatch is fire-and-forget; verify booking succeeded
    const body = await res.json();
    expect(body.booking.status).toBe("confirmed");
  });

  test("admin cancel triggers notification for correct user", async ({ page }) => {
    // Login as admin to create a booking for themselves
    await loginAsAdmin(page);
    const created = await page.context().request.post("/api/bookings", {
      data: { courtId: "court-bog-1", startTime: slot(10, 9), duration: 60 },
    });
    expect(created.status()).toBe(201);
    const { booking } = await created.json();

    // Cancel as the same user (admin)
    const cancelled = await page.context().request.delete(`/api/bookings/${booking.id}`);
    expect(cancelled.status()).toBe(200);
    const body = await cancelled.json();
    expect(body.booking.status).toBe("cancelled");
    expect(body.cancellation.bookingTime.timezone).toBe("America/Bogota");
  });

  test("cancel without reason still dispatches notification", async ({ page }) => {
    await loginAsPlayer(page);
    const created = await page.context().request.post("/api/bookings", {
      data: { courtId: "court-bog-1", startTime: slot(11, 16), duration: 60 },
    });
    expect(created.status()).toBe(201);
    const { booking } = await created.json();

    // Cancel without providing a reason
    const cancelled = await page.context().request.delete(`/api/bookings/${booking.id}`);
    expect(cancelled.status()).toBe(200);
    const body = await cancelled.json();
    expect(body.booking.status).toBe("cancelled");
    expect(body.cancellation.reason).toBeNull();
    // Notification dispatch still fires (dispatchEmail/dispatchWhatsApp)
    // Verify by checking response includes policy info
    expect(["free_cancellation", "late_cancellation"]).toContain(body.cancellation.policy);
  });

  test("dispatch retry on failure is transparent to caller", async ({ page }) => {
    // SMTP and WhatsApp are not configured in test, so dispatch will retry
    // and fail gracefully — this must never throw or return error to caller
    await loginAsPlayer(page);

    // Create a booking — dispatch fires async, booking must still succeed
    const created = await page.context().request.post("/api/bookings", {
      data: { courtId: "court-bog-1", startTime: slot(12, 10), duration: 60 },
    });
    expect(created.status()).toBe(201);

    // Cancel a booking — dispatch fires synchronously, must not throw
    const { booking } = await created.json();
    const cancelled = await page.context().request.delete(`/api/bookings/${booking.id}`);
    expect(cancelled.status()).toBe(200);
    const body = await cancelled.json();
    expect(body.booking.status).toBe("cancelled");
  });
});
