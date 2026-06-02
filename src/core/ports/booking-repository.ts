// ─── Booking repository port ───────────────────────────────────────────────

import type { Booking, BookingFilters, BookingStatus } from "../entities/booking";
import type { TimeSlot, SlotQuery } from "../entities/slot";

export interface IBookingRepository {
  /** Find a single booking by ID */
  findById(id: string): Promise<Booking | null>;

  /** List bookings matching the given filters */
  list(filters: BookingFilters): Promise<Booking[]>;

  /** Get available time slots for a given day/club/court */
  getAvailableSlots(query: SlotQuery): Promise<TimeSlot[]>;

  /** Check if a specific time slot is available (no conflicting bookings) */
  isSlotAvailable(
    courtId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<boolean>;

  /** Create a new booking. Returns the created booking with ID. */
  create(booking: Omit<Booking, "id" | "createdAt" | "updatedAt">): Promise<Booking>;

  /** Update booking status */
  updateStatus(bookingId: string, status: BookingStatus): Promise<Booking>;

  /** Get bookings count for a date range (used for occupancy stats) */
  countByDateRange(clubId: string, from: Date, to: Date): Promise<number>;

  /** Get bookings for a specific date (used for cash register / daily report) */
  listByDate(clubId: string, date: Date): Promise<Booking[]>;
}
