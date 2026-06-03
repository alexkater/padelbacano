import { NextRequest, NextResponse } from "next/server";
import { openMatchRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("clubId");
  const club = clubId ? await clubRepo.findById(clubId) : await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const matches = await openMatchRepo.listOpen(club.id);
  return NextResponse.json({ matches });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const courtId = body.courtId as string;
  const title = body.title as string | undefined;
  const startTime = body.startTime as string;
  const duration = body.duration as number;
  const minLevel = body.minLevel as number | undefined;
  const maxLevel = body.maxLevel as number | undefined;
  const maxPlayers = (body.maxPlayers as number) || 4;
  const notes = body.notes as string | undefined;

  if (!courtId || !startTime || !duration) {
    return NextResponse.json({ error: "courtId, startTime, duration required" }, { status: 400 });
  }
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const guestId = "00000000-0000-0000-0000-000000000000";
  const match = await openMatchRepo.create({
    clubId: club.id,
    courtId,
    creatorId: guestId,
    title: title || null,
    startTime: start,
    endTime: end,
    duration,
    minLevel: minLevel ?? null,
    maxLevel: maxLevel ?? null,
    maxPlayers,
    notes: notes ?? null,
    status: "open" as const,
  });
  return NextResponse.json({ match }, { status: 201 });
}
