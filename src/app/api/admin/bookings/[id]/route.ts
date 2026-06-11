import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { db, schema } from "@/infra/db/index";
import { and, eq } from "drizzle-orm";

/**
 * DELETE /api/admin/bookings/[id]
 * Admin cancels a booking that belongs to their club.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "club_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = (await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, session.user.id))
    .limit(1))[0];

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Verify booking belongs to admin's club
  const row = (await db
    .select({
      booking: schema.bookings,
      clubId: schema.courts.clubId,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .where(eq(schema.bookings.id, id))
    .limit(1))[0];

  if (!row) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (row.clubId !== profile.clubId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (row.booking.status === "cancelled") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 409 });
  }

  await db
    .update(schema.bookings)
    .set({ status: "cancelled" } as any)
    .where(eq(schema.bookings.id, id));

  const updated = (await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.id, id))
    .limit(1))[0];

  return NextResponse.json({ booking: updated });
}
