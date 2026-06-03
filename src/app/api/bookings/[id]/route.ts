import { CLUB_CONFIG } from "@/padelbacano.config";
import { NextRequest, NextResponse } from "next/server";
import { bookingRepo } from "@/infra/db/repositories";
import { emailService } from "@/infra/email";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const booking = await bookingRepo.findById(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 409 });
  }

  const updated = await bookingRepo.updateStatus(id, "cancelled");

  emailService.sendCancellationNotice("booking@" + CLUB_CONFIG.domain, {
    clubName: CLUB_CONFIG.name,
    courtName: booking.courtId.slice(0, 8),
    date: booking.startTime.toLocaleDateString("es-ES"),
    time: booking.startTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
  }).catch(() => {});

  return NextResponse.json({ booking: updated });
}
