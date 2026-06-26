import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { bookingRepo } from "@/infra/db/repositories";
import { auth } from "@/infra/auth/config";
import { cancelBookingRequest } from "../_cancel";

/**
 * GET /api/bookings/[id]
 * Returns booking detail. Must be authenticated and own the booking.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await bookingRepo.findById(id);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ booking });
}

/**
 * DELETE /api/bookings/[id]
 * Cancels a booking. Owner or club_admin can cancel.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return cancelBookingRequest(request, id);
}
