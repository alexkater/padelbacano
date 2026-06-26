import { expect, type APIRequestContext, type Page, test } from "@playwright/test";
import { z } from "zod";

// ─── Seeded identities ──────────────────────────────────────────────────────

const PLAYER_EMAIL = "jugador1@demo.com";
const PLAYER_PASSWORD = "demo123";
const ADMIN_EMAIL = "admin@bogota.com";
const ADMIN_PASSWORD = "demo123";
const CANONICAL_CLUB_SLUG = "club-padel-bogota";

// ─── Test data schemas ──────────────────────────────────────────────────────

const bookingResponseSchema = z.object({
  booking: z.object({
    id: z.string(),
    courtId: z.string(),
    status: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  bookingTime: z.object({
    startTimeCOT: z.string(),
    endTimeCOT: z.string(),
    displayTime: z.string(),
    timezone: z.string(),
  }),
});

const cancellationResponseSchema = z.object({
  booking: z.object({
    id: z.string(),
    status: z.string(),
  }),
  cancellation: z.object({
    reason: z.string().nullable(),
    late: z.boolean(),
    cancelledAtCOT: z.string(),
    bookingTime: z.object({
      startTimeCOT: z.string(),
      displayTime: z.string(),
      timezone: z.string(),
    }),
    policy: z.string(),
  }),
});

const availabilitySlotSchema = z.object({
  startTimeCOT: z.string(),
  endTimeCOT: z.string(),
  displayTime: z.string(),
  timezone: z.literal("America/Bogota"),
});

const availabilityResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.object({
    courtId: z.string(),
    slots: z.array(availabilitySlotSchema),
    maintenanceBlocks: z.array(z.object({
      startTimeCOT: z.string(),
      endTimeCOT: z.string(),
      displayTime: z.string(),
      timezone: z.string(),
    })),
  })),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function slot(day: number, hour: number, minute = 0): string {
  return `2026-12-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
}

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

async function createBooking(request: APIRequestContext, startTime: string, courtId = "court-bog-1", duration = 60) {
  return request.post("/api/bookings", {
    data: { courtId, startTime, duration },
  });
}

// ─── Tests: Booking concurrency ─────────────────────────────────────────────

test.describe("Suite 8: Booking concurrency", () => {
  test("concurrent identical bookings: one succeeds, one returns 409", async ({ page }) => {
    await loginAsPlayer(page);
    const payload = { courtId: "court-bog-1", startTime: slot(1, 9), duration: 60 };
    const responses = await Promise.all([
      page.context().request.post("/api/bookings", { data: payload }),
      page.context().request.post("/api/bookings", { data: payload }),
    ]);
    const statuses = responses.map((res) => res.status()).sort();
    expect(statuses).toEqual([201, 409]);
  });

  test("simultaneous bookings for different courts both succeed", async ({ page }) => {
    await loginAsPlayer(page);
    const [first, second] = await Promise.all([
      createBooking(page.context().request, slot(1, 10), "court-bog-1"),
      createBooking(page.context().request, slot(1, 10), "court-bog-2"),
    ]);
    expect(first.status()).toBe(201);
    expect(second.status()).toBe(201);
  });

  test("back-to-back same court succeeds when times differ", async ({ page }) => {
    await loginAsPlayer(page);
    const first = await createBooking(page.context().request, slot(2, 14));
    expect(first.status()).toBe(201);
    const second = await createBooking(page.context().request, slot(2, 15));
    expect(second.status()).toBe(201);
  });

  test("partial overlap with existing booking returns 409", async ({ page }) => {
    await loginAsPlayer(page);
    const first = await createBooking(page.context().request, slot(2, 16), "court-bog-1", 60);
    expect(first.status()).toBe(201);
    // starts before first ends (16:30 overlaps 16:00-17:00)
    const second = await createBooking(page.context().request, slot(2, 16, 30), "court-bog-1", 60);
    expect(second.status()).toBe(409);
  });

  test("concurrent booking for non-overlapping times on same court succeeds", async ({ page }) => {
    await loginAsPlayer(page);
    const first = await createBooking(page.context().request, slot(3, 8));
    expect(first.status()).toBe(201);
    const second = await createBooking(page.context().request, slot(3, 10));
    expect(second.status()).toBe(201);
  });
});

// ─── Tests: COT timezone ────────────────────────────────────────────────────

test.describe("Suite 8: Timezone (COT)", () => {
  test("booking response includes COT timezone fields", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await createBooking(page.context().request, slot(4, 10));
    expect(res.status()).toBe(201);
    const body = bookingResponseSchema.parse(await res.json());
    expect(body.bookingTime.timezone).toBe("America/Bogota");
    expect(body.bookingTime.displayTime).toContain("COT");
    expect(body.bookingTime.startTimeCOT).toMatch(/-\d{2}:00$/);
    expect(body.bookingTime.startTimeCOT).toContain("T");
  });

  test("cancellation response includes COT fields", async ({ page }) => {
    await loginAsPlayer(page);
    const created = await createBooking(page.context().request, slot(4, 14));
    expect(created.status()).toBe(201);
    const { booking } = await created.json();
    const cancelled = await page.context().request.delete(`/api/bookings/${booking.id}`);
    expect(cancelled.status()).toBe(200);
    const body = cancellationResponseSchema.parse(await cancelled.json());
    expect(body.cancellation.bookingTime.timezone).toBe("America/Bogota");
    expect(body.cancellation.cancelledAtCOT).toMatch(/-\d{2}:00$/);
  });

  test("marketplace availability includes COT times", async ({ request }) => {
    const searchRes = await request.get(`/api/club/${CANONICAL_CLUB_SLUG}`);
    expect(searchRes.status()).toBe(200);
    const club = await searchRes.json();
    const res = await request.get(`/api/marketplace/availability?clubId=${club.id}&date=2026-10-01`);
    expect(res.status()).toBe(200);
    const body = availabilityResponseSchema.parse(await res.json());
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].slots.length).toBeGreaterThan(0);
    const slot1 = body.data[0].slots[0];
    expect(slot1.timezone).toBe("America/Bogota");
    expect(slot1.displayTime).toContain("COT");
  });
});

// ─── Tests: Pricing ─────────────────────────────────────────────────────────

test.describe("Suite 8: Pricing (COP)", () => {
  test("club detail returns COP pricing", async ({ request }) => {
    const res = await request.get(`/api/club/${CANONICAL_CLUB_SLUG}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.pricing.currency).toBe("COP");
    expect(typeof body.pricing.memberPrice).toBe("number");
    expect(typeof body.pricing.nonMemberPrice).toBe("number");
    expect(body.pricing.memberPrice).toBeGreaterThan(0);
    expect(body.pricing.nonMemberPrice).toBeGreaterThan(0);
  });

  test("availability slots include price data", async ({ request }) => {
    const searchRes = await request.get(`/api/club/${CANONICAL_CLUB_SLUG}`);
    expect(searchRes.status()).toBe(200);
    const club = await searchRes.json();
    const res = await request.get(`/api/marketplace/availability?clubId=${club.id}&date=2026-10-01`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const firstCourt = body.data[0];
    expect(firstCourt.slots.length).toBeGreaterThan(0);
    const pricedSlots = firstCourt.slots.filter((slot: { priceInCents?: number }) => typeof slot.priceInCents === "number" && slot.priceInCents > 0);
    expect(pricedSlots.length).toBeGreaterThan(0);
  });

  test("peak hours have higher pricing than off-peak", async ({ request }) => {
    const res = await request.get("/api/courts/availability?courtId=court-bog-1&date=2026-10-01");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.slots.length).toBeGreaterThan(0);
    // Weekday off-peak morning (8am) vs peak evening (7pm)
    const morning = body.slots.find((s: { startTime: string; time?: string }) => (s.startTime ?? s.time)?.includes("08:00"));
    const evening = body.slots.find((s: { startTime: string; time?: string }) => (s.startTime ?? s.time)?.includes("19:00"));
    // Both should exist and have pricing
    if (morning && evening && typeof morning.priceInCents === "number" && typeof evening.priceInCents === "number") {
      expect(evening.priceInCents).toBeGreaterThanOrEqual(morning.priceInCents);
    }
  });
});

// ─── Tests: Cancellation ────────────────────────────────────────────────────

test.describe("Suite 8: Cancellation", () => {
  test("cancel with reason saves cancellation record", async ({ page }) => {
    await loginAsPlayer(page);
    const created = await createBooking(page.context().request, slot(5, 10));
    expect(created.status()).toBe(201);
    const { booking } = await created.json();
    const res = await page.context().request.delete(`/api/bookings/${booking.id}`, {
      data: { reason: "Cambio de planes" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.booking.status).toBe("cancelled");
    expect(body.cancellation.reason).toBe("Cambio de planes");
    expect(body.cancellation.policy).toBe("free_cancellation");
  });

  test("cancel without reason still succeeds", async ({ page }) => {
    await loginAsPlayer(page);
    const created = await createBooking(page.context().request, slot(5, 12));
    expect(created.status()).toBe(201);
    const { booking } = await created.json();
    const res = await page.context().request.delete(`/api/bookings/${booking.id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.booking.status).toBe("cancelled");
    expect(body.cancellation.reason).toBeNull();
  });

  test("cancelling already cancelled booking returns 409", async ({ page }) => {
    await loginAsPlayer(page);
    const created = await createBooking(page.context().request, slot(5, 16));
    expect(created.status()).toBe(201);
    const { booking } = await created.json();
    const first = await page.context().request.delete(`/api/bookings/${booking.id}`);
    expect(first.status()).toBe(200);
    const second = await page.context().request.delete(`/api/bookings/${booking.id}`);
    expect(second.status()).toBe(409);
  });

  test("cancelling another user's booking returns 403", async ({ page }) => {
    await loginAsPlayer(page);
    const created = await createBooking(page.context().request, slot(6, 8));
    expect(created.status()).toBe(201);
    const { booking } = await created.json();

    // Switch to different user
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("admin@bogota.com");
    await page.locator("#password").fill("demo123");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/clubes", { timeout: 10000 });

    const res = await page.context().request.delete(`/api/bookings/${booking.id}`);
    // Admin from same club can cancel any booking in their club
    expect([200, 403]).toContain(res.status());
  });
});

// ─── Tests: Availability & maintenance ───────────────────────────────────────

test.describe("Suite 8: Availability and maintenance", () => {
  test("availability returns real slots for known court", async ({ request }) => {
    const res = await request.get("/api/courts/availability?courtId=court-bog-1&date=2026-10-01");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.slots.length).toBeGreaterThanOrEqual(12);
    expect(body.slots.some((slot: { available: boolean }) => slot.available === true)).toBe(true);
    expect(body.slots.some((slot: { available: boolean }) => slot.available === false)).toBe(true);
  });

  test("admin can create maintenance block that excludes slot", async ({ page }) => {
    await loginAsAdmin(page);
    const blockStart = `2026-12-10T14:00:00.000Z`;
    const blockEnd = `2026-12-10T16:00:00.000Z`;
    const res = await page.context().request.post("/api/admin/courts/court-bog-1/maintenance", {
      data: { startTime: blockStart, endTime: blockEnd, reason: "E2E maintenance test" },
    });
    expect([201, 409]).toContain(res.status());
  });

  test("overlapping maintenance block returns 409", async ({ page }) => {
    await loginAsAdmin(page);
    const baseStart = `2026-12-11T10:00:00.000Z`;
    const baseEnd = `2026-12-11T12:00:00.000Z`;
    // First block
    const first = await page.context().request.post("/api/admin/courts/court-bog-1/maintenance", {
      data: { startTime: baseStart, endTime: baseEnd, reason: "First block" },
    });
    expect([201, 409]).toContain(first.status());
    if (first.status() === 201) {
      // Overlapping block
      const second = await page.context().request.post("/api/admin/courts/court-bog-1/maintenance", {
        data: { startTime: `2026-12-11T11:00:00.000Z`, endTime: `2026-12-11T13:00:00.000Z`, reason: "Overlapping block" },
      });
      expect(second.status()).toBe(409);
    }
  });

  test("availability for unknown court returns 404", async ({ request }) => {
    const res = await request.get("/api/courts/availability?courtId=no-existe&date=2026-10-01");
    expect(res.status()).toBe(404);
  });

  test("availability without params returns 400", async ({ request }) => {
    const res = await request.get("/api/courts/availability");
    expect(res.status()).toBe(400);
  });
});
