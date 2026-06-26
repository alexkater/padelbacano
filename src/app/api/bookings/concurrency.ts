import { bookingRepo } from "@/infra/db/repositories";
import { db, schema } from "@/infra/db/index";
import { v4 as uuid } from "@/infra/db/uuid";
import { BookingConflictError, CreateBookingError } from "@/core/use-cases/bookings";
import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { COT_TIME_ZONE, formatCOT } from "@/infra/timezone/cot";

type BookingResponse = {
  readonly id: string;
  readonly courtId: string;
  readonly userId: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly duration: 60 | 90;
  readonly status: "confirmed" | "cancelled" | "completed" | "no_show";
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type AlternativeSlot = {
  readonly courtId: string;
  readonly courtName: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly duration: 60 | 90;
  readonly price: number | null;
  readonly startTimeCOT: string;
  readonly endTimeCOT: string;
  readonly displayTime: string;
  readonly timezone: typeof COT_TIME_ZONE;
};

type CreateLockedBookingInput = {
  readonly courtId: string;
  readonly clubId: string;
  readonly userId: string;
  readonly start: Date;
  readonly duration: 60 | 90;
};

let bookingUniquenessReady: Promise<unknown> | null = null;

export function ensureBookingUniqueness() {
  bookingUniquenessReady ??= db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_court_start_unique
    ON bookings (court_id, start_time)
    WHERE status <> 'cancelled'
  `);
  return bookingUniquenessReady;
}

export function isUniqueConflict(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const maybePostgresError = error as Error & { readonly code?: string };

  return (
    maybePostgresError.code === "23505" ||
    maybePostgresError.message.includes("bookings_active_court_start_unique") ||
    maybePostgresError.message.includes("bookings_confirmed_court_start_unique")
  );
}

export async function getAlternativeSlots(
  clubId: string,
  requestedStart: Date,
  duration: 60 | 90
): Promise<AlternativeSlot[]> {
  const slots = await bookingRepo.getAvailableSlots({
    clubId,
    date: requestedStart,
    duration,
  });

  return slots
    .filter((slot) =>
      slot.isAvailable && slot.startTime.getTime() !== requestedStart.getTime()
    )
    .slice(0, 3)
    .map((slot) => ({
      courtId: slot.courtId,
      courtName: slot.courtName,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      duration: slot.duration,
      price: slot.price,
      startTimeCOT: formatCOT(slot.startTime, "yyyy-MM-dd'T'HH:mm:ss-05:00"),
      endTimeCOT: formatCOT(slot.endTime, "yyyy-MM-dd'T'HH:mm:ss-05:00"),
      displayTime: `${formatCOT(slot.startTime, "HH:mm")} - ${formatCOT(slot.endTime, "HH:mm")} COT`,
      timezone: COT_TIME_ZONE,
    }));
}

export async function createLockedBooking(
  input: CreateLockedBookingInput
): Promise<BookingResponse> {
  const end = new Date(input.start.getTime() + input.duration * 60 * 1000);

  return db.transaction(async (tx) => {
    await tx.execute(sql`
      SELECT pg_advisory_xact_lock(hashtext(${`${input.courtId}:${input.start.toISOString()}`}))
    `);

    const conflictingBooking = (await tx
      .select({ id: schema.bookings.id })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.courtId, input.courtId),
          ne(schema.bookings.status, "cancelled"),
          lt(schema.bookings.startTime, end),
          gt(schema.bookings.endTime, input.start)
        )
      )
      .limit(1))[0];

    if (conflictingBooking) {
      throw new BookingConflictError();
    }

    const now = new Date();
    const inserted = (await tx
      .insert(schema.bookings)
      .values({
        id: uuid(),
        clubId: input.clubId,
        courtId: input.courtId,
        userId: input.userId,
        startTime: input.start,
        endTime: end,
        duration: input.duration,
        status: "confirmed",
        notes: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning())[0];

    if (!inserted) {
      throw new CreateBookingError("Booking could not be created", "DB_ERROR");
    }

    return {
      id: inserted.id,
      courtId: inserted.courtId,
      userId: inserted.userId,
      startTime: inserted.startTime,
      endTime: inserted.endTime,
      duration: inserted.duration === 90 ? 90 : 60,
      status: inserted.status,
      notes: inserted.notes,
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
    };
  });
}
