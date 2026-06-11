import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { db, schema } from "@/infra/db/index";
import { eq, gte, lte, and } from "drizzle-orm";

/**
 * GET /api/admin/bookings
 * List all bookings for the admin's club. Optional filters.
 */
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const courtId = searchParams.get("courtId");
  const statusParam = searchParams.get("status");
  const validStatuses = ["confirmed", "cancelled", "completed", "no_show"] as const;
  const statusFilter = validStatuses.find((s) => s === statusParam);

  const conditions = [
    eq(schema.courts.clubId, profile.clubId),
  ];

  if (dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dayStart = new Date(y, m - 1, d, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
    conditions.push(gte(schema.bookings.startTime, dayStart));
    conditions.push(lte(schema.bookings.endTime, dayEnd));
  }

  if (courtId) {
    conditions.push(eq(schema.bookings.courtId, courtId));
  }

  if (statusFilter) {
    conditions.push(eq(schema.bookings.status, statusFilter));
  }

  const bookings = await db
    .select({
      booking: schema.bookings,
      courtName: schema.courts.name,
      userName: schema.users.name,
      userEmail: schema.users.email,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .innerJoin(schema.users, eq(schema.bookings.userId, schema.users.id))
    .where(and(...conditions));

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.booking.id,
      courtId: b.booking.courtId,
      courtName: b.courtName,
      userId: b.booking.userId,
      userName: b.userName,
      userEmail: b.userEmail,
      startTime: b.booking.startTime,
      endTime: b.booking.endTime,
      duration: b.booking.duration,
      status: b.booking.status,
      notes: b.booking.notes,
    })),
  });
}
