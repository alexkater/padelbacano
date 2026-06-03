import { NextRequest, NextResponse } from "next/server";
import { schoolRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("clubId");
  const club = clubId ? await clubRepo.findById(clubId) : await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const coaches = await schoolRepo.listCoaches(club.id);
  return NextResponse.json({ coaches });
}
