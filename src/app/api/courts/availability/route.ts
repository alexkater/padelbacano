import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/infra/db/index";

/**
 * GET /api/courts/availability?courtId=X&date=YYYY-MM-DD
 * Returns 60-minute time slots showing availability for a specific court and date.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courtId = searchParams.get("courtId");
  const dateStr = searchParams.get("date");

  if (!courtId || !dateStr) {
    return NextResponse.json(
      { error: "courtId and date are required" },
      { status: 400 }
    );
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  // Check court exists
  const court = (await db
    .select()
    .from(schema.courts)
    .where(eq(schema.courts.id, courtId))
    .limit(1))[0];

  if (!court) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  // Parse as local date
  const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

  // Get confirmed bookings for this court on this date
  const dayBookings = await db
    .select()
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.courtId, courtId),
        eq(schema.bookings.status, "confirmed"),
        gte(schema.bookings.startTime, dayStart),
        lte(schema.bookings.endTime, dayEnd)
      )
    );

  // Generate 60-min slots from 6:00 to 23:00
  const slots: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
  }> = [];

  for (let h = 6; h < 23; h++) {
    const slotStart = new Date(y, m - 1, d, h, 0, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

    const isAvailable = !dayBookings.some((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bStart < slotEnd && bEnd > slotStart;
    });

    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      available: isAvailable,
    });
  }

  return NextResponse.json({
    courtId,
    date: dateStr,
    slots,
  });
}
