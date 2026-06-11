import { describe, expect, it } from "vitest";

import type { Booking } from "@/core/entities/booking";
import type { IBookingRepository } from "@/core/ports/booking-repository";
import type { IEmailService } from "@/core/ports/email-service";
import {
  BookingConflictError,
  createBooking,
} from "@/core/use-cases/bookings";

const now = new Date("2030-01-01T10:00:00.000Z");

function booking(overrides: Partial<Booking> = {}): Booking {
  const startTime = overrides.startTime ?? now;
  const endTime =
    overrides.endTime ?? new Date(startTime.getTime() + 60 * 60 * 1000);

  return {
    id: overrides.id ?? "booking-1",
    courtId: overrides.courtId ?? "court-1",
    userId: overrides.userId ?? "user-1",
    startTime,
    endTime,
    duration: overrides.duration ?? 60,
    status: overrides.status ?? "confirmed",
    notes: overrides.notes ?? null,
    createdAt: overrides.createdAt ?? new Date("2030-01-01T09:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2030-01-01T09:00:00.000Z"),
    court: overrides.court,
    user: overrides.user,
  };
}

function createDeps(existingBookings: Booking[] = []): {
  bookingRepo: IBookingRepository;
  emailService: IEmailService;
  createdBookings: Booking[];
} {
  const createdBookings: Booking[] = [];

  const bookingRepo: IBookingRepository = {
    async findById() {
      return null;
    },
    async list(filters) {
      return existingBookings.filter((existingBooking) => {
        if (filters.courtId && existingBooking.courtId !== filters.courtId) {
          return false;
        }
        if (filters.status && existingBooking.status !== filters.status) {
          return false;
        }
        return true;
      });
    },
    async getAvailableSlots() {
      return [];
    },
    async isSlotAvailable() {
      return true;
    },
    async create(input) {
      const created = booking({
        ...input,
        id: `created-${createdBookings.length + 1}`,
        createdAt: new Date("2030-01-01T09:30:00.000Z"),
        updatedAt: new Date("2030-01-01T09:30:00.000Z"),
      });
      createdBookings.push(created);
      return created;
    },
    async updateStatus() {
      throw new Error("updateStatus not used by createBooking tests");
    },
    async countByDateRange() {
      return 0;
    },
    async listByDate() {
      return [];
    },
  };

  const emailService: IEmailService = {
    async send() {
      return true;
    },
    async sendBookingConfirmation() {
      return true;
    },
    async sendCancellationNotice() {
      return true;
    },
  };

  return { bookingRepo, emailService, createdBookings };
}

describe("createBooking conflict detection", () => {
  it("creates a normal booking when there is no conflict", async () => {
    const deps = createDeps();

    const result = await createBooking(deps, {
      courtId: "court-1",
      userId: "user-2",
      startTime: now,
      duration: 60,
    });

    expect(result.id).toBe("created-1");
    expect(deps.createdBookings).toHaveLength(1);
  });

  it("throws a conflict error for a partial overlap when the new start is inside an existing booking", async () => {
    const deps = createDeps([
      booking({
        startTime: new Date("2030-01-01T10:00:00.000Z"),
        endTime: new Date("2030-01-01T11:00:00.000Z"),
      }),
    ]);

    await expect(
      createBooking(deps, {
        courtId: "court-1",
        userId: "user-2",
        startTime: new Date("2030-01-01T10:30:00.000Z"),
        duration: 60,
      })
    ).rejects.toBeInstanceOf(BookingConflictError);

    expect(deps.createdBookings).toHaveLength(0);
  });

  it("throws a conflict error when the new booking is completely inside an existing booking", async () => {
    const deps = createDeps([
      booking({
        startTime: new Date("2030-01-01T10:00:00.000Z"),
        endTime: new Date("2030-01-01T11:30:00.000Z"),
        duration: 90,
      }),
    ]);

    await expect(
      createBooking(deps, {
        courtId: "court-1",
        userId: "user-2",
        startTime: new Date("2030-01-01T10:15:00.000Z"),
        duration: 60,
      })
    ).rejects.toBeInstanceOf(BookingConflictError);

    expect(deps.createdBookings).toHaveLength(0);
  });

  it("allows back-to-back bookings when the first end equals the second start", async () => {
    const deps = createDeps([
      booking({
        startTime: new Date("2030-01-01T10:00:00.000Z"),
        endTime: new Date("2030-01-01T11:00:00.000Z"),
      }),
    ]);

    const result = await createBooking(deps, {
      courtId: "court-1",
      userId: "user-2",
      startTime: new Date("2030-01-01T11:00:00.000Z"),
      duration: 60,
    });

    expect(result.startTime).toEqual(new Date("2030-01-01T11:00:00.000Z"));
    expect(deps.createdBookings).toHaveLength(1);
  });

  it("allows the same time on a different court", async () => {
    const deps = createDeps([
      booking({
        courtId: "court-1",
        startTime: new Date("2030-01-01T10:00:00.000Z"),
        endTime: new Date("2030-01-01T11:00:00.000Z"),
      }),
    ]);

    const result = await createBooking(deps, {
      courtId: "court-2",
      userId: "user-2",
      startTime: new Date("2030-01-01T10:00:00.000Z"),
      duration: 60,
    });

    expect(result.courtId).toBe("court-2");
    expect(deps.createdBookings).toHaveLength(1);
  });
});
