import { NextRequest, NextResponse } from "next/server";
import { bookingRepo } from "@/infra/db/repositories";
import { emailService } from "@/infra/email";

/**
 * GET /api/bookings?clubId=X&date=YYYY-MM-DD&duration=60|90
 * Returns the full court grid with availability for the given date.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("clubId");
  const dateStr = searchParams.get("date");
  const durationParam = searchParams.get("duration");

  if (!clubId || !dateStr) {
    return NextResponse.json(
      { error: "clubId and date are required" },
      { status: 400 }
    );
  }

  const duration = (durationParam === "90" ? 90 : 60) as 60 | 90;

  // Parse date as local midnight
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const slots = await bookingRepo.getAvailableSlots({
    clubId,
    date,
    duration,
  });

  return NextResponse.json({ slots, date: dateStr });
}

/**
 * POST /api/bookings
 * Creates a new booking. Requires: courtId, userId, startTime, duration.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { courtId, userId, startTime, duration } = body;

  if (!courtId || !startTime || !duration) {
    return NextResponse.json(
      { error: "Required: courtId, startTime, duration" },
      { status: 400 }
    );
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  // Check availability
  const isAvailable = await bookingRepo.isSlotAvailable(
    courtId,
    start,
    end
  );

  if (!isAvailable) {
    return NextResponse.json(
      { error: "Slot is no longer available" },
      { status: 409 }
    );
  }

  // Use placeholder user if no userId provided (MVP — no auth required for booking)
  const effectiveUserId = userId || "00000000-0000-0000-0000-000000000000";

  const booking = await bookingRepo.create({
    courtId,
    userId: effectiveUserId,
    startTime: start,
    endTime: end,
    duration,
    status: "confirmed",
    notes: null,
  });

  sendBookingEmail(booking);

  return NextResponse.json({ booking }, { status: 201 });
}

// Fire-and-forget booking confirmation email
function sendBookingEmail(booking: { courtId: string; startTime: Date; duration: number }) {
  emailService.sendBookingConfirmation("booking@elrematepadel.com", {
    clubName: "El Remate Padel Club",
    courtName: booking.courtId.slice(0, 8),
    date: booking.startTime.toLocaleDateString("es-ES"),
    time: booking.startTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    duration: booking.duration,
  }).catch(() => {});
}
