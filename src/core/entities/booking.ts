// ─── Booking entity ────────────────────────────────────────────────────────

import type { Court } from "./court";
import type { User } from "./user";

export const BOOKING_STATUSES = [
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const DURATION_OPTIONS = [60, 90] as const;
export type DurationMinutes = (typeof DURATION_OPTIONS)[number];

/**
 * A booking represents a reservation of a court for a specific time slot.
 * If status is "cancelled", the slot becomes available again.
 */
export type Booking = {
  id: string;
  courtId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  duration: DurationMinutes;
  status: BookingStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Optional: populated by repository when joining
  court?: Court;
  user?: User;
};

/**
 * Query parameters for listing bookings.
 */
export type BookingFilters = {
  clubId?: string;
  date?: Date; // single day filter
  dateFrom?: Date;
  dateTo?: Date;
  courtId?: string;
  userId?: string;
  status?: BookingStatus;
};
