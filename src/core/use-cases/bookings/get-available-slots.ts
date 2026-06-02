// ─── GetAvailableSlots use case ────────────────────────────────────────────
// Queries available time slots for a given club/day/court combination.
// Pure query — no side effects, no validation beyond existence checks.

import type { IBookingRepository } from "../../ports/booking-repository";
import type { TimeSlot, SlotQuery } from "../../entities/slot";

type Dependencies = {
  bookingRepo: IBookingRepository;
};

/**
 * Returns all available time slots for a club on a given date,
 * optionally filtered by duration and court type.
 */
export async function getAvailableSlots(
  deps: Dependencies,
  query: SlotQuery
): Promise<TimeSlot[]> {
  return deps.bookingRepo.getAvailableSlots(query);
}
