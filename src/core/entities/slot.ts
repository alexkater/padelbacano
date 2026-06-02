// ─── TimeSlot value object ─────────────────────────────────────────────────

import type { DurationMinutes } from "./booking";

/**
 * Represents an available (or booked) time window on a specific court.
 * Used by the calendar views to render the booking grid.
 */
export type TimeSlot = {
  courtId: string;
  courtName: string;
  startTime: Date;
  endTime: Date;
  duration: DurationMinutes;
  isAvailable: boolean;
  bookingId: string | null; // non-null = booked
  price: number | null; // displayed price for this slot
};

/**
 * Parameters for querying available slots.
 */
export type SlotQuery = {
  clubId: string;
  date: Date; // which day
  duration?: DurationMinutes;
  courtType?: string;
};
