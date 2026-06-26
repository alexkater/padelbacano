import { NextRequest, NextResponse } from "next/server";
import { tournamentRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

export async function GET() {
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const tournaments = await tournamentRepo.listByClub(club.id);
  return NextResponse.json({ tournaments });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const name = body.name as string;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const tournament = await tournamentRepo.create({
    clubId: club.id, name, description: (body.description as string) || null,
    format: (body.format as any) || "single_elimination",
    startDate: new Date((body.startDate as string) || Date.now()),
    endDate: body.endDate ? new Date(body.endDate as string) : null,
    registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline as string) : null,
    minLevel: (body.minLevel as number) ?? null, maxLevel: (body.maxLevel as number) ?? null,
    maxParticipants: (body.maxParticipants as number) ?? null,
    level: (body.level as "open" | "A" | "B" | "C") || "open",
    entryFee: (body.entryFee as number) ?? null, prize: (body.prize as string) || null,
    status: "draft", rules: (body.rules as string) || null,
  });
  return NextResponse.json({ tournament }, { status: 201 });
}
