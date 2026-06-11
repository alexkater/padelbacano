import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { db, schema } from "@/infra/db/index";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "@/infra/db/uuid";

/**
 * GET /api/admin/courts
 * List all courts for the admin's club.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "club_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get admin's profile to find club
  const profile = (await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, session.user.id))
    .limit(1))[0];

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const courts = await db
    .select()
    .from(schema.courts)
    .where(eq(schema.courts.clubId, profile.clubId));

  return NextResponse.json({ courts });
}

/**
 * POST /api/admin/courts
 * Create a new court for the admin's club.
 */
export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { name, courtType } = body;
  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const now = new Date();
  const court = {
    id: uuid(),
    clubId: profile.clubId,
    name,
    courtType: courtType || "glass",
    indoor: true,
    isActive: true,
    order: 0,
    createdAt: now,
  };

  await db.insert(schema.courts).values(court);

  return NextResponse.json({ court }, { status: 201 });
}
