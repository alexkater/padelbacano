import { NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { tournamentRepo } from "@/infra/db/repositories";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión para inscribirte" }, { status: 401 });
  }

  const { id } = await params;
  const tournament = await tournamentRepo.findById(id);
  if (!tournament) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  if (tournament.status !== "registration") {
    return NextResponse.json({ error: "Este torneo no está abierto a inscripciones" }, { status: 400 });
  }

  // Check registration deadline
  if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
    return NextResponse.json({ error: "El plazo de inscripción ha finalizado" }, { status: 400 });
  }

  // Check user level constraints
  const registrations = await tournamentRepo.getRegistrations(tournament.id);
  const activeCount = registrations.filter(r => r.status !== "cancelled").length;

  if (tournament.maxParticipants && activeCount >= tournament.maxParticipants) {
    return NextResponse.json({ error: "El torneo ha alcanzado el máximo de participantes" }, { status: 400 });
  }

  // Check for existing registration
  const existing = registrations.find(r => r.userId === session.user!.id && r.status !== "cancelled");
  if (existing) {
    return NextResponse.json({ error: "Ya estás inscrito en este torneo" }, { status: 409 });
  }

  const registration = await tournamentRepo.register(id, session.user.id);
  return NextResponse.json({ registration }, { status: 201 });
}
