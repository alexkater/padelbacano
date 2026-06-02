// ─── Booking repository — Drizzle/SQLite implementation ────────────────────

import { eq, and, gte, lte, sql } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IBookingRepository } from "@/core/ports/booking-repository";
import type { Booking, BookingFilters, BookingStatus } from "@/core/entities/booking";
import type { TimeSlot, SlotQuery } from "@/core/entities/slot";

function rowToBooking(row: typeof schema.bookings.$inferSelect): Booking {
  return {
    id: row.id,
    courtId: row.courtId,
    userId: row.userId,
    startTime: row.startTime,
    endTime: row.endTime,
    duration: row.duration as 60 | 90,
    status: row.status as BookingStatus,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const bookingRepo: IBookingRepository = {
  async findById(id) {
    const row = db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id))
      .get();
    return row ? rowToBooking(row) : null;
  },

  async list(filters) {
    const conditions = [];

    if (filters.courtId) {
      conditions.push(eq(schema.bookings.courtId, filters.courtId));
    }
    if (filters.userId) {
      conditions.push(eq(schema.bookings.userId, filters.userId));
    }
    if (filters.status) {
      conditions.push(eq(schema.bookings.status, filters.status));
    }
    if (filters.date) {
      const dayStart = new Date(filters.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(filters.date);
      dayEnd.setHours(23, 59, 59, 999);
      conditions.push(gte(schema.bookings.startTime, dayStart));
      conditions.push(lte(schema.bookings.startTime, dayEnd));
    }
    if (filters.dateFrom) {
      conditions.push(gte(schema.bookings.startTime, filters.dateFrom));
    }
    if (filters.dateTo) {
      conditions.push(lte(schema.bookings.endTime, filters.dateTo));
    }

    const rows = db
      .select()
      .from(schema.bookings)
      .where(and(...conditions))
      .all();

    return rows.map(rowToBooking);
  },

  async getAvailableSlots(query) {
    // Parse date as local midnight (avoid UTC parsing of YYYY-MM-DD)
    const d = query.date;
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    // Get all active courts for the club
    const clubCourts = db
      .select()
      .from(schema.courts)
      .where(
        and(
          eq(schema.courts.clubId, query.clubId),
          eq(schema.courts.isActive, true)
        )
      )
      .all();

    // Get confirmed bookings for the day
    const dayBookings = db
      .select()
      .from(schema.bookings)
      .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
      .where(
        and(
          eq(schema.courts.clubId, query.clubId),
          eq(schema.bookings.status, "confirmed"),
          gte(schema.bookings.startTime, dayStart),
          lte(schema.bookings.endTime, dayEnd)
        )
      )
      .all();

    // Build slots: 60-min slots from 9:00 to 23:00 for each court
    const slots: TimeSlot[] = [];
    const duration = query.duration ?? 60;

    for (const court of clubCourts) {
      const hour = 9; // club opens at 9
      const closeHour = 23; // club closes at 23

      for (let h = hour; h < closeHour; h++) {
        const slotStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

        // Check for conflicts
        const isConflicting = dayBookings.some((row) => {
          const b = row.bookings;
          return (
            b.courtId === court.id &&
            b.startTime < slotEnd &&
            b.endTime > slotStart
          );
        });

        const conflictingBooking = dayBookings.find((row) => {
          const b = row.bookings;
          return (
            b.courtId === court.id &&
            b.startTime < slotEnd &&
            b.endTime > slotStart
          );
        });

        slots.push({
          courtId: court.id,
          courtName: court.name,
          startTime: slotStart,
          endTime: slotEnd,
          duration: duration as 60 | 90,
          isAvailable: !isConflicting,
          bookingId: conflictingBooking
            ? conflictingBooking.bookings.id
            : null,
          price: null, // pricing comes from club config, not bookings
        });
      }
    }

    return slots;
  },

  async isSlotAvailable(courtId, startTime, endTime, excludeBookingId) {
    const conditions = [
      eq(schema.bookings.courtId, courtId),
      eq(schema.bookings.status, "confirmed"),
      sql`${schema.bookings.startTime} < ${endTime.getTime() / 1000}`,
      sql`${schema.bookings.endTime} > ${startTime.getTime() / 1000}`,
    ];

    if (excludeBookingId) {
      conditions.push(
        sql`${schema.bookings.id} != ${excludeBookingId}`
      );
    }

    const conflicting = db
      .select()
      .from(schema.bookings)
      .where(and(...conditions))
      .get();

    return !conflicting;
  },

  async create(input) {
    const id = uuid();
    const now = new Date();

    db.insert(schema.bookings)
      .values({
        id,
        courtId: input.courtId,
        userId: input.userId,
        startTime: input.startTime,
        endTime: input.endTime,
        duration: input.duration,
        status: input.status,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const row = db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id))
      .get()!;

    return rowToBooking(row);
  },

  async updateStatus(bookingId, status) {
    const now = new Date();

    db.update(schema.bookings)
      .set({ status, updatedAt: now })
      .where(eq(schema.bookings.id, bookingId))
      .run();

    const row = db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, bookingId))
      .get()!;

    return rowToBooking(row);
  },

  async countByDateRange(clubId, from, to) {
    const result = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.bookings)
      .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
      .where(
        and(
          eq(schema.courts.clubId, clubId),
          eq(schema.bookings.status, "confirmed"),
          gte(schema.bookings.startTime, from),
          lte(schema.bookings.endTime, to)
        )
      )
      .get();

    return result?.count ?? 0;
  },

  async listByDate(clubId, date) {
    const d = date;
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    const rows = db
      .select()
      .from(schema.bookings)
      .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
      .where(
        and(
          eq(schema.courts.clubId, clubId),
          gte(schema.bookings.startTime, dayStart),
          lte(schema.bookings.startTime, dayEnd)
        )
      )
      .all();

    return rows.map((r) => rowToBooking(r.bookings));
  },
};
