// ─── CancelBooking use case ────────────────────────────────────────────────
// Business logic for cancelling a court booking.
// Validates cancellation policy before allowing cancellation.

import type { IBookingRepository } from "../../ports/booking-repository";
import type { IEmailService } from "../../ports/email-service";
import type { CancellationPolicy } from "../../entities/club";
import type { Booking } from "../../entities/booking";

export type CancelBookingInput = {
  bookingId: string;
  userId: string; // who is cancelling
  policy: CancellationPolicy; // the club's cancellation policy
  now?: Date; // for testing, defaults to new Date()
};

export class CancelBookingError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "BOOKING_NOT_FOUND"
      | "NOT_YOUR_BOOKING"
      | "ALREADY_CANCELLED"
      | "TOO_LATE_TO_CANCEL"
      | "DB_ERROR"
  ) {
    super(message);
    this.name = "CancelBookingError";
  }
}

type Dependencies = {
  bookingRepo: IBookingRepository;
  emailService: IEmailService;
};

/**
 * Cancels a booking after validating:
 * - The booking exists
 * - The user owns this booking
 * - The booking hasn't already been cancelled
 * - The cancellation deadline hasn't passed
 */
export async function cancelBooking(
  deps: Dependencies,
  input: CancelBookingInput
): Promise<Booking> {
  const now = input.now ?? new Date();

  // ── Find booking ──────────────────────────────────────────────────────
  const booking = await deps.bookingRepo.findById(input.bookingId);

  if (!booking) {
    throw new CancelBookingError("Booking not found", "BOOKING_NOT_FOUND");
  }

  // ── Ownership check ───────────────────────────────────────────────────
  if (booking.userId !== input.userId) {
    throw new CancelBookingError(
      "You can only cancel your own bookings",
      "NOT_YOUR_BOOKING"
    );
  }

  // ── Already cancelled? ────────────────────────────────────────────────
  if (booking.status === "cancelled") {
    throw new CancelBookingError(
      "This booking has already been cancelled",
      "ALREADY_CANCELLED"
    );
  }

  // ── Deadline check ────────────────────────────────────────────────────
  const deadlineMs =
    booking.startTime.getTime() -
    input.policy.minHoursBefore * 60 * 60 * 1000;

  if (now.getTime() > deadlineMs) {
    const hoursBefore =
      (booking.startTime.getTime() - now.getTime()) / (60 * 60 * 1000);
    throw new CancelBookingError(
      `Cancellation deadline passed. You can cancel up to ${input.policy.minHoursBefore}h before. Only ${hoursBefore.toFixed(1)}h remaining.`,
      "TOO_LATE_TO_CANCEL"
    );
  }

  // ── Cancel ────────────────────────────────────────────────────────────
  const updated = await deps.bookingRepo.updateStatus(input.bookingId, "cancelled");

  // ── Notify (fire and forget) ──────────────────────────────────────────
  deps.emailService
    .sendCancellationNotice("user@placeholder.com", {
      clubName: "Club",
      courtName: booking.court?.name ?? "",
      date: booking.startTime.toLocaleDateString(),
      time: booking.startTime.toLocaleTimeString(),
    })
    .catch(() => {});

  return updated;
}
