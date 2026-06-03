import { NextRequest, NextResponse } from "next/server";
import { partnerPostRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

/**
 * GET /api/partner-posts?clubId=X
 * Returns active partner posts for a club.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("clubId");

  if (clubId) {
    const items = await partnerPostRepo.listActive(clubId);
    return NextResponse.json({ posts: items });
  }

  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const items = await partnerPostRepo.listActive(club.id);
  return NextResponse.json({ posts: items });
}

/**
 * POST /api/partner-posts
 * Creates a new partner post. Body: { name, level, schedule, notes }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, level, schedule, notes } = body;

  if (!name || !level || !schedule) {
    return NextResponse.json(
      { error: "name, level, and schedule are required" },
      { status: 400 }
    );
  }

  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Use guest user for now (auth not required for MVP)
  const userId = "00000000-0000-0000-0000-000000000000";

  const post = await partnerPostRepo.create({
    clubId: club.id,
    userId,
    name,
    level,
    schedule,
    notes,
  });

  return NextResponse.json({ post }, { status: 201 });
}
