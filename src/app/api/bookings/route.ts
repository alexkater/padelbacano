import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { bookingRepo, userRepo } from "@/infra/db/repositories";
import { db, schema } from "@/infra/db/index";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuid } from "@/infra/db/uuid";
import { COT_TIME_ZONE, formatCOT } from "@/infra/timezone/cot";
import {
  BookingConflictError,
  CreateBookingError,
} from "@/core/use-cases/bookings";
import type { NotificationEvent } from "@/core/ports/notification-port";
import {
  createLockedBooking,
  ensureBookingUniqueness,
  getAlternativeSlots,
  isUniqueConflict,
} from "./concurrency";
import { dispatchEmail, dispatchWhatsApp } from "@/infra/notifications/dispatch";

function bookingDisplay(startTime: Date, endTime: Date) {
  return {
    startTimeCOT: formatCOT(startTime, "yyyy-MM-dd'T'HH:mm:ss-05:00"),
    endTimeCOT: formatCOT(endTime, "yyyy-MM-dd'T'HH:mm:ss-05:00"),
    date: formatCOT(startTime, "yyyy-MM-dd"),
    time: formatCOT(startTime, "HH:mm"),
    displayTime: `${formatCOT(startTime, "HH:mm")} - ${formatCOT(endTime, "HH:mm")} COT`,
    timezone: COT_TIME_ZONE,
  };
}

async function conflictResponse(clubId: string, start: Date, duration: 60 | 90) {
  const alternatives = await getAlternativeSlots(clubId, start, duration);

  return NextResponse.json(
    { success: false, error: "Horario no disponible", alternatives },
    { status: 409 }
  );
}

/**
 * GET /api/bookings?status=confirmed&upcoming=true
 * Returns bookings for the authenticated user.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("clubId");
  const dateParam = searchParams.get("date");
  const durationParam = searchParams.get("duration");

  if (clubId && dateParam) {
    const date = new Date(`${dateParam}T00:00:00-05:00`);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const duration = durationParam === "90" ? 90 : 60;
    const slots = await bookingRepo.getAvailableSlots({ clubId, date, duration });
    return NextResponse.json({
      slots: slots.map((slot) => ({
        ...slot,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        ...bookingDisplay(slot.startTime, slot.endTime),
      })),
    });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusParam = searchParams.get("status");
  const upcomingParam = searchParams.get("upcoming");

  const bookings = await bookingRepo.list({
    userId: session.user.id,
    status: statusParam === "confirmed" ? "confirmed" : undefined,
  });

  let result = bookings;

  // Filter to upcoming only (future bookings)
  if (upcomingParam === "true") {
    const now = new Date();
    result = result.filter((b) => new Date(b.startTime) > now);
  }

  const bookingIds = result.map((b) => b.id);
  const courtsMap = new Map<string, { name: string; clubId: string }>();
  const clubsMap = new Map<string, string>();

  if (bookingIds.length > 0) {
    const courtRows = await db
      .select({ id: schema.courts.id, name: schema.courts.name, clubId: schema.courts.clubId })
      .from(schema.courts)
      .innerJoin(schema.bookings, eq(schema.courts.id, schema.bookings.courtId))
      .where(inArray(schema.bookings.id, bookingIds));

    for (const row of courtRows) {
      courtsMap.set(row.id, { name: row.name, clubId: row.clubId });
    }

    const clubIds = [...new Set(courtRows.map((r) => r.clubId))];
    if (clubIds.length > 0) {
      const clubRows = await db
        .select({ id: schema.clubs.id, name: schema.clubs.name })
        .from(schema.clubs)
        .where(inArray(schema.clubs.id, clubIds));
      for (const row of clubRows) {
        clubsMap.set(row.id, row.name);
      }
    }
  }

  const enriched = result.map((booking) => {
    const courtInfo = courtsMap.get(booking.courtId);
    return {
      ...booking,
      courtName: courtInfo?.name ?? null,
      clubName: courtInfo ? (clubsMap.get(courtInfo.clubId) ?? null) : null,
      bookingTime: bookingDisplay(new Date(booking.startTime), new Date(booking.endTime)),
    };
  });

  return NextResponse.json({
    bookings: enriched,
  });
}

/**
 * POST /api/bookings
 * Creates a new booking for the authenticated user.
 * Requires: courtId and startTime, plus either duration or endTime.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    readonly courtId?: unknown;
    readonly startTime?: unknown;
    readonly endTime?: unknown;
    readonly duration?: unknown;
  };

  const { courtId, startTime, endTime, duration } = body;

  await ensureBookingUniqueness();

  if (
    typeof courtId !== "string" ||
    typeof startTime !== "string" ||
    (!duration && !endTime)
  ) {
    return NextResponse.json(
      { error: "Required: courtId, startTime, and duration or endTime" },
      { status: 400 }
    );
  }

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
  }

  if (typeof endTime === "string") {
    const end = new Date(endTime);
    if (Number.isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ error: "Invalid endTime" }, { status: 400 });
    }
  }

  const bookingDuration = getDurationMinutes(start, duration, endTime);
  if (!bookingDuration) {
    return NextResponse.json(
      { error: "Duration must be 60 or 90 minutes" },
      { status: 400 }
    );
  }

  const court = (await db
    .select()
    .from(schema.courts)
    .where(eq(schema.courts.id, courtId))
    .limit(1))[0];

  if (!court || !court.isActive) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  try {
    const booking = await createLockedBooking({
      courtId,
      clubId: court.clubId,
      userId: session.user.id,
      start,
      duration: bookingDuration,
    });

    notifyBookingCreated(session.user.id, court, start, bookingDuration).catch(() => {});

    return NextResponse.json({ booking, bookingTime: bookingDisplay(booking.startTime, booking.endTime) }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return conflictResponse(court.clubId, start, bookingDuration);
    }

    if (error instanceof CreateBookingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (isUniqueConflict(error)) {
      return conflictResponse(court.clubId, start, bookingDuration);
    }

    throw error;
  }
}

/**
 * Fire booking_created notifications (email + WhatsApp) after a successful
 * booking. Runs asynchronously — dispatch never throws, so it cannot
 * affect the HTTP response.
 */
async function notifyBookingCreated(
  userId: string,
  court: typeof schema.courts.$inferSelect,
  start: Date,
  duration: 60 | 90,
): Promise<void> {
  const user = await userRepo.findById(userId);
  const profile = await userRepo.getProfile(userId, court.clubId);
  const club = (await db
    .select({ name: schema.clubs.name })
    .from(schema.clubs)
    .where(eq(schema.clubs.id, court.clubId))
    .limit(1))[0];

  if (!user) return;

  const event: NotificationEvent = {
    id: uuid(),
    type: "booking_created",
    userId,
    clubId: court.clubId,
    payload: {
      clubName: club?.name,
      courtName: court.name,
      startTime: start.toISOString(),
      date: formatCOT(start, "yyyy-MM-dd"),
      time: formatCOT(start, "HH:mm"),
      duration,
    },
    createdAt: new Date(),
  };

  await Promise.allSettled([
    dispatchEmail(event, {
      to: user.email,
      subject: `Reserva confirmada — ${club?.name ?? "PádelBacano"}`,
      htmlBody: "",
      templateId: "booking_confirmation",
    }),
    ...(profile?.phone
      ? [
          dispatchWhatsApp(event, {
            to: profile.phone,
            templateName: "booking_confirmation",
            params: {
              clubName: club?.name ?? "PádelBacano",
              courtName: court.name,
              date: formatCOT(start, "yyyy-MM-dd"),
              time: formatCOT(start, "HH:mm"),
            },
          }),
        ]
      : []),
  ]);
}

function getDurationMinutes(
  start: Date,
  duration: unknown,
  endTime: unknown
): 60 | 90 | null {
  if (duration === 60 || duration === 90) {
    return duration;
  }

  if (typeof duration === "string") {
    const parsed = Number(duration);
    if (parsed === 60 || parsed === 90) return parsed;
  }

  if (typeof endTime !== "string") {
    return null;
  }

  const end = new Date(endTime);
  if (Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  const minutes = (end.getTime() - start.getTime()) / (60 * 1000);
  return minutes === 60 || minutes === 90 ? minutes : null;
}
