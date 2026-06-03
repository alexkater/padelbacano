import { NextRequest, NextResponse } from "next/server";
import { announcementRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

/**
 * GET /api/announcements?clubId=X&all=true
 * Returns announcements for a club. ?all=true returns unpublished too (admin).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("clubId");
  const all = searchParams.get("all") === "true";

  const club = clubId
    ? await clubRepo.findById(clubId)
    : await clubRepo.findBySlug(CLUB_CONFIG.slug);

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const items = all
    ? await announcementRepo.listAll(club.id)
    : await announcementRepo.listPublished(club.id);

  return NextResponse.json({ announcements: items });
}

/**
 * POST /api/announcements
 * Creates a new announcement. Body: { title, content, type }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, content, type, clubId: bodyClubId } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: "title and content are required" },
      { status: 400 }
    );
  }

  const club = bodyClubId
    ? await clubRepo.findById(bodyClubId)
    : await clubRepo.findBySlug(CLUB_CONFIG.slug);

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const announcement = await announcementRepo.create({
    clubId: club.id,
    title,
    content,
    type: type ?? "general",
  });

  return NextResponse.json({ announcement }, { status: 201 });
}
