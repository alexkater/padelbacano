import { CLUB_CONFIG } from "@/padelbacano.config";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { bookingRepo, clubRepo } from "@/infra/db/repositories";
import {
  BookingConflictError,
  createBooking,
  CreateBookingError,
} from "@/core/use-cases/bookings";
import type { IEmailService } from "@/core/ports/email-service";

const noEmailService: IEmailService = {
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

/**
 * GET /api/bookings?status=confirmed&upcoming=true
 * Returns bookings for the authenticated user.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
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

  return NextResponse.json({ bookings: result });
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

  const body = await request.json();

  const { courtId, startTime, endTime, duration } = body;

  if (!courtId || !startTime || (!duration && !endTime)) {
    return NextResponse.json(
      { error: "Required: courtId, startTime, and duration or endTime" },
      { status: 400 }
    );
  }

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
  }

  const bookingDuration = getDurationMinutes(start, duration, endTime);
  if (!bookingDuration) {
    return NextResponse.json(
      { error: "Duration must be 60 or 90 minutes" },
      { status: 400 }
    );
  }

  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  const court = club?.courts.find((candidate) => candidate.id === courtId);
  if (!court || !court.isActive) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  try {
    const booking = await createBooking(
      { bookingRepo, emailService: noEmailService },
      {
        courtId,
        userId: session.user.id,
        startTime: start,
        duration: bookingDuration,
      }
    );

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json(
        { error: "Slot is no longer available" },
        { status: 409 }
      );
    }

    if (error instanceof CreateBookingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
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
