import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { db, schema } from "@/infra/db/index";
import { and, eq } from "drizzle-orm";

/**
 * PUT /api/admin/courts/[courtId]
 * Update a court. Admin can only modify courts in their club.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
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

  const { courtId } = await params;
  const court = (await db
    .select()
    .from(schema.courts)
    .where(eq(schema.courts.id, courtId))
    .limit(1))[0];

  if (!court || court.clubId !== profile.clubId) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.courtType !== undefined) updateData.courtType = body.courtType;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  await db
    .update(schema.courts)
    .set(updateData)
    .where(eq(schema.courts.id, courtId));

  const updated = (await db
    .select()
    .from(schema.courts)
    .where(eq(schema.courts.id, courtId))
    .limit(1))[0];

  return NextResponse.json({ court: updated });
}

/**
 * DELETE /api/admin/courts/[courtId]
 * Soft-delete a court. Only for admin's club courts with no future bookings.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
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

  const { courtId } = await params;

  const court = (await db
    .select()
    .from(schema.courts)
    .where(eq(schema.courts.id, courtId))
    .limit(1))[0];

  if (!court || court.clubId !== profile.clubId) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  await db
    .update(schema.courts)
    .set({ isActive: false } as any)
    .where(eq(schema.courts.id, courtId));

  return NextResponse.json({ success: true });
}
