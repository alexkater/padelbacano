import { NextResponse } from "next/server";
import { tournamentRepo } from "@/infra/db/repositories";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await tournamentRepo.findById(id);
  if (!tournament) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  const registrations = await tournamentRepo.getRegistrations(tournament.id);
  const activeCount = registrations.filter((r) => r.status !== "cancelled").length;

  return NextResponse.json({
    tournament: {
      id: tournament.id,
      clubId: tournament.clubId,
      name: tournament.name,
      description: tournament.description,
      format: tournament.format,
      startDate: tournament.startDate.toISOString(),
      endDate: tournament.endDate?.toISOString() ?? null,
      registrationDeadline: tournament.registrationDeadline?.toISOString() ?? null,
      level: tournament.level,
      minLevel: tournament.minLevel,
      maxLevel: tournament.maxLevel,
      maxParticipants: tournament.maxParticipants,
      entryFee: tournament.entryFee,
      prize: tournament.prize,
      status: tournament.status,
      rules: tournament.rules,
      createdAt: tournament.createdAt.toISOString(),
      updatedAt: tournament.updatedAt.toISOString(),
      registeredCount: activeCount,
    },
  });
}
