import { NextRequest, NextResponse } from "next/server";
import { clubRepo } from "@/infra/db/repositories";

/**
 * GET /api/courts?clubId=X&active=true
 * Returns courts for a given club, filtered by active status.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("clubId");

  if (!clubId) {
    return NextResponse.json(
      { error: "clubId is required" },
      { status: 400 }
    );
  }

  const club = await clubRepo.findById(clubId);
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const showOnlyActive = searchParams.get("active") !== "false";

  const courts = club.courts
    .filter((c) => (showOnlyActive ? c.isActive : true))
    .map((c) => ({
      id: c.id,
      clubId: c.clubId,
      name: c.name,
      courtType: c.courtType,
      indoor: c.indoor,
      isActive: c.isActive,
    }));

  return NextResponse.json({ courts });
}
