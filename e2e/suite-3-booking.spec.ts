import { expect, type APIRequestContext, type Page, test } from "@playwright/test";

async function loginAsPlayer(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill("jugador1@demo.com");
  await page.locator("#password").fill("demo123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/clubes", { timeout: 10000 });
}

function bookingPayload(slot: string, courtId = "court-bog-1", duration = 60) {
  return { courtId, startTime: slot, duration };
}

function slot(day: number, hour: number, minute = 0) {
  return `2026-10-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
}

async function createBooking(request: APIRequestContext, startTime: string, courtId = "court-bog-1", duration = 60) {
  return request.post("/api/bookings", { data: bookingPayload(startTime, courtId, duration) });
}

test.describe("Suite 3: Create booking", () => {
  test("creates a valid booking", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await createBooking(page.context().request, slot(1, 10));
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.booking.status).toBe("confirmed");
  });

  test("creating booking without auth returns 401", async ({ request }) => {
    const res = await createBooking(request, slot(1, 11));
    expect(res.status()).toBe(401);
  });

  test("creating booking with invalid courtId returns 404", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await createBooking(page.context().request, slot(1, 12), "no-existe");
    expect(res.status()).toBe(404);
  });

  test("creating booking without courtId returns 400", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.post("/api/bookings", { data: { startTime: slot(1, 13), duration: 60 } });
    expect(res.status()).toBe(400);
  });

  test("creating booking in the past returns 400", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await createBooking(page.context().request, "2025-01-01T10:00:00.000Z");
    expect(res.status()).toBe(400);
  });

  test("creating booking with invalid duration returns 400", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await createBooking(page.context().request, slot(1, 14), "court-bog-1", 45);
    expect(res.status()).toBe(400);
  });
});

test.describe("Suite 3: Booking conflicts", () => {
  test("double booking same court and time returns 409", async ({ page }) => {
    await loginAsPlayer(page);
    const first = await createBooking(page.context().request, slot(2, 10));
    expect(first.status()).toBe(201);
    const second = await createBooking(page.context().request, slot(2, 10));
    expect(second.status()).toBe(409);
  });

  test("back-to-back bookings both succeed", async ({ page }) => {
    await loginAsPlayer(page);
    const first = await createBooking(page.context().request, slot(2, 12));
    const second = await createBooking(page.context().request, slot(2, 13));
    expect(first.status()).toBe(201);
    expect(second.status()).toBe(201);
  });

  test("same time on different courts succeeds", async ({ page }) => {
    await loginAsPlayer(page);
    const first = await createBooking(page.context().request, slot(2, 15), "court-bog-1");
    const second = await createBooking(page.context().request, slot(2, 15), "court-bog-2");
    expect(first.status()).toBe(201);
    expect(second.status()).toBe(201);
  });

  test("partial overlap returns 409", async ({ page }) => {
    await loginAsPlayer(page);
    const first = await createBooking(page.context().request, slot(3, 17), "court-bog-1", 60);
    expect(first.status()).toBe(201);
    const second = await createBooking(page.context().request, slot(3, 17, 30), "court-bog-1", 60);
    expect(second.status()).toBe(409);
  });
});

test.describe("Suite 3: List and cancel", () => {
  test("GET /api/bookings returns authenticated user bookings", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.get("/api/bookings");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.bookings)).toBe(true);
  });

  test("GET /api/bookings filters confirmed status", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.get("/api/bookings?status=confirmed");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.bookings.every((booking: { status: string }) => booking.status === "confirmed")).toBe(true);
  });

  test("GET /api/bookings filters upcoming", async ({ page }) => {
    await loginAsPlayer(page);
    const res = await page.context().request.get("/api/bookings?upcoming=true");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.bookings)).toBe(true);
  });

  test("cancel own booking then cancelling again returns 409", async ({ page }) => {
    await loginAsPlayer(page);
    const created = await createBooking(page.context().request, slot(4, 10));
    expect(created.status()).toBe(201);
    const { booking } = await created.json();
    const cancelled = await page.context().request.delete(`/api/bookings/${booking.id}`);
    expect(cancelled.status()).toBe(200);
    const body = await cancelled.json();
    expect(body.booking.status).toBe("cancelled");
    const again = await page.context().request.delete(`/api/bookings/${booking.id}`);
    expect(again.status()).toBe(409);
  });

  test("cancel other user's booking returns 403", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("admin@bogota.com");
    await page.locator("#password").fill("demo123");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/clubes", { timeout: 10000 });
    const created = await createBooking(page.context().request, slot(4, 12));
    expect(created.status()).toBe(201);
    const { booking } = await created.json();

    await page.context().clearCookies();
    await loginAsPlayer(page);
    const res = await page.context().request.delete(`/api/bookings/${booking.id}`);
    expect(res.status()).toBe(403);
  });

  test("slot is freed after cancel", async ({ page }) => {
    await loginAsPlayer(page);
    const startTime = slot(4, 14);
    const created = await createBooking(page.context().request, startTime);
    expect(created.status()).toBe(201);
    const { booking } = await created.json();
    await page.context().request.delete(`/api/bookings/${booking.id}`);
    const availability = await page.context().request.get("/api/courts/availability?courtId=court-bog-1&date=2026-10-04");
    expect(availability.status()).toBe(200);
    const body = await availability.json();
    const freed = body.slots.find((s: { startTime: string; time?: string }) => (s.startTime ?? s.time).includes("14:00"));
    expect(freed?.available).toBe(true);
  });
});

test.describe("Suite 3: Booking UI", () => {
  test("complete booking flow from clubs to my bookings and cancel", async ({ page }) => {
    await loginAsPlayer(page);
    await page.goto("/clubes");
    await page.getByText("Club Pádel Bogotá").first().click();
    await expect(page).toHaveURL(/\/reservar/);
    await page.locator('input[type="date"]').fill("2026-10-05");
    const availableSlot = page.getByRole("button", { name: /10:00|11:00|disponible/i }).first();
    await expect(availableSlot).toBeVisible();
    await availableSlot.click();
    await page.getByRole("button", { name: /confirm|reservar/i }).click();
    await expect(page.locator("body")).toContainText(/confirm|reservada|mis reservas/i);
    await page.goto("/perfil");
    await expect(page.locator("body")).toContainText(/reservas|Club Pádel Bogotá|Pista/i);
    const cancel = page.getByRole("button", { name: /cancel/i }).first();
    if (await cancel.isVisible()) await cancel.click();
  });

  test("booked slots appear disabled", async ({ page }) => {
    await loginAsPlayer(page);
    await page.goto("/reservar?clubId=club-bogota");
    await page.locator('input[type="date"]').fill("2026-07-01");
    await expect(page.locator("button:disabled").filter({ hasText: /reserv|ocup|\d{1,2}:\d{2}/i }).first()).toBeVisible();
  });
});
