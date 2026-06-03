import { NextRequest, NextResponse } from "next/server";
import { chatRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId") || undefined;
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const messages = await chatRepo.getMessages(club.id, matchId);
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { content, matchId, receiverId } = body;
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const guestId = "00000000-0000-0000-0000-000000000000";
  const message = await chatRepo.send({
    clubId: club.id, senderId: guestId,
    receiverId: receiverId || null, matchId: matchId || null, content,
  });
  return NextResponse.json({ message }, { status: 201 });
}
