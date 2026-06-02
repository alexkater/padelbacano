// ─── CreateBooking use case ────────────────────────────────────────────────
// Business logic for creating a court booking.
// Depends on ports, NOT on concrete implementations.

import type { IBookingRepository } from "../../ports/booking-repository";
import type { IEmailService } from "../../ports/email-service";
import type { Booking } from "../../entities/booking";
import { DURATION_OPTIONS } from "../../entities/booking";

export type CreateBookingInput = {
  courtId: string;
  userId: string;
  startTime: Date;
  duration: number; // must be 60 or 90
  notes?: string;
};

export class CreateBookingError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "SLOT_UNAVAILABLE"
      | "INVALID_DURATION"
      | "PAST_TIME"
      | "DB_ERROR"
  ) {
    super(message);
    this.name = "CreateBookingError";
  }
}

type Dependencies = {
  bookingRepo: IBookingRepository;
  emailService: IEmailService;
};

/**
 * Creates a new booking after validating:
 * - Duration is 60 or 90 minutes
 * - Start time is in the future
 * - The slot is actually available
 */
export async function createBooking(
  deps: Dependencies,
  input: CreateBookingInput
): Promise<Booking> {
  // ── Validate duration ──────────────────────────────────────────────────
  if (!DURATION_OPTIONS.includes(input.duration as typeof DURATION_OPTIONS[number])) {
    throw new CreateBookingError(
      `Duration must be 60 or 90 minutes, got ${input.duration}`,
      "INVALID_DURATION"
    );
  }

  // ── Validate future ───────────────────────────────────────────────────
  if (input.startTime <= new Date()) {
    throw new CreateBookingError(
      "Cannot book a slot in the past",
      "PAST_TIME"
    );
  }

  // ── Calculate end time ────────────────────────────────────────────────
  const endTime = new Date(input.startTime.getTime() + input.duration * 60 * 1000);

  // ── Check availability ────────────────────────────────────────────────
  const isAvailable = await deps.bookingRepo.isSlotAvailable(
    input.courtId,
    input.startTime,
    endTime
  );

  if (!isAvailable) {
    throw new CreateBookingError(
      "This time slot is no longer available",
      "SLOT_UNAVAILABLE"
    );
  }

  // ── Create booking ────────────────────────────────────────────────────
  const booking = await deps.bookingRepo.create({
    courtId: input.courtId,
    userId: input.userId,
    startTime: input.startTime,
    endTime,
    duration: input.duration as 60 | 90,
    status: "confirmed",
    notes: input.notes ?? null,
  });

  // ── Send confirmation email (fire and forget) ─────────────────────────
  deps.emailService
    .sendBookingConfirmation("user@placeholder.com", {
      clubName: "Club", // TODO: get from club repo
      courtName: booking.court?.name ?? "",
      date: input.startTime.toLocaleDateString(),
      time: input.startTime.toLocaleTimeString(),
      duration: input.duration,
    })
    .catch(() => {
      // Email failures are non-blocking
    });

  return booking;
}
