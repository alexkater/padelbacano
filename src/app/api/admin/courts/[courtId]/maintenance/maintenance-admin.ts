import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { db, schema } from "@/infra/db/index";

type AdminRole = "club_admin" | "platform_admin";

type AdminCourtAccess = {
  readonly courtId: string;
  readonly userId: string;
};

function getAdminRole(role: string): AdminRole | null {
  if (role === "club_admin") return "club_admin";
  if (role === "platform_admin") return "platform_admin";
  return null;
}

export async function requireAdminCourtAccess(courtId: string): Promise<AdminCourtAccess | NextResponse> {
  const session = await auth();
  const role = session?.user?.role ? getAdminRole(session.user.role) : null;
  if (!session?.user?.id || !role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role === "platform_admin") {
    const court = (await db
      .select({ id: schema.courts.id })
      .from(schema.courts)
      .where(eq(schema.courts.id, courtId))
      .limit(1))[0];

    if (!court) {
      return NextResponse.json({ error: "Court not found" }, { status: 404 });
    }

    return { courtId, userId: session.user.id };
  }

  const rows = await db
    .select({ courtId: schema.courts.id })
    .from(schema.userProfiles)
    .innerJoin(schema.courts, eq(schema.userProfiles.clubId, schema.courts.clubId))
    .where(
      and(
        eq(schema.userProfiles.userId, session.user.id),
        eq(schema.userProfiles.role, "admin"),
        eq(schema.courts.id, courtId)
      )
    )
    .limit(1);

  if (!rows[0]) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  return { courtId, userId: session.user.id };
}

export function isAccessResponse(value: AdminCourtAccess | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export function overlaps(startTime: Date, endTime: Date, rowStart: Date, rowEnd: Date): boolean {
  return rowStart < endTime && rowEnd > startTime;
}
