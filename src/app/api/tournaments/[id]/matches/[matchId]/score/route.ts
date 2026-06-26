// ─── POST /api/tournaments/[id]/matches/[matchId]/score ──────────────────────
// Submit score for a match. Validates, persists, then advances bracket.
// Auth: club_admin or platform_admin.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { tournamentRepo } from "@/infra/db/repositories";

// ─── Bracket advancement helper ──────────────────────────────────────────────
// For single-elimination: given a match's round and position within that round,
// determine which match and slot the winner advances to.
// Position is the match's index within its round (0-based in sorted order).

type BracketAdvancement = {
  nextMatchId: string;
  slot: "player1" | "player2";
} | null;

function computeNextMatch(
  matches: { id: string; round: number }[],
  currentMatchId: string,
): BracketAdvancement {
  // Group matches by round, preserving sorted order
  const byRound = new Map<number, { id: string; round: number }[]>();

  for (const m of matches) {
    const list = byRound.get(m.round) ?? [];
    list.push(m);
    byRound.set(m.round, list);
  }

  // Find the current match and its position
  let currentMatch: { id: string; round: number } | null = null;
  let position = -1;

  for (const m of matches) {
    if (m.id === currentMatchId) {
      currentMatch = m;
      break;
    }
    position++;
  }

  if (!currentMatch) return null;

  // In single-elimination:
  // - Match at position P in round R feeds into match at floor(P/2) in round R+1
  // - If P is even (P%2===0), winner goes to player1 slot
  // - If P is odd (P%2===1), winner goes to player2 slot
  const nextRound = currentMatch.round + 1;
  const nextRoundMatches = byRound.get(nextRound);
  if (!nextRoundMatches) return null; // This was the final

  const nextPosition = Math.floor(position / 2);
  const nextMatch = nextRoundMatches[nextPosition];
  if (!nextMatch) return null;

  return {
    nextMatchId: nextMatch.id,
    slot: position % 2 === 0 ? "player1" : "player2",
  };
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  // ─── Auth ────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "club_admin" && session.user.role !== "platform_admin") {
    return NextResponse.json({ error: "Se requieren permisos de administrador" }, { status: 403 });
  }

  const { id: tournamentId, matchId } = await params;

  // ─── Tournament & match lookup ───────────────────────────────────────
  const tournament = await tournamentRepo.findById(tournamentId);
  if (!tournament) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  const allMatches = await tournamentRepo.listMatches(tournamentId);
  const match = allMatches.find((m) => m.id === matchId);
  if (!match) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  // ─── Validation ──────────────────────────────────────────────────────
  if (match.status === "completed") {
    return NextResponse.json(
      { error: "Este partido ya tiene un resultado registrado" },
      { status: 409 },
    );
  }

  if (match.status === "cancelled") {
    return NextResponse.json({ error: "Este partido fue cancelado" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.score1 !== "number" || typeof body.score2 !== "number") {
    return NextResponse.json(
      { error: "Se requieren score1 y score2 como números" },
      { status: 400 },
    );
  }

  const { score1, score2 } = body as { score1: number; score2: number };

  if (!Number.isInteger(score1) || !Number.isInteger(score2)) {
    return NextResponse.json({ error: "Los scores deben ser números enteros" }, { status: 400 });
  }

  if (score1 < 0 || score2 < 0) {
    return NextResponse.json({ error: "Los scores no pueden ser negativos" }, { status: 400 });
  }

  // Single-elimination: no ties allowed
  if (tournament.format === "single_elimination" && score1 === score2) {
    return NextResponse.json(
      { error: "En eliminación directa no se permiten empates" },
      { status: 400 },
    );
  }

  // Both players must exist for a valid match
  if (!match.player1Id || !match.player2Id) {
    return NextResponse.json(
      { error: "Este partido no tiene ambos jugadores asignados" },
      { status: 400 },
    );
  }

  // ─── Determine winner ───────────────────────────────────────────────
  const winnerId = score1 > score2 ? match.player1Id : match.player2Id;

  // ─── Persist match result ───────────────────────────────────────────
  const updatedMatch = await tournamentRepo.updateMatchResult(
    matchId,
    score1,
    score2,
    winnerId,
  );

  // ─── Bracket advancement (single elimination only) ──────────────────
  if (tournament.format === "single_elimination") {
    const advancement = computeNextMatch(
      allMatches.map((m) => ({ id: m.id, round: m.round })),
      matchId,
    );

    if (advancement) {
      const nextMatch = allMatches.find((m) => m.id === advancement.nextMatchId);
      if (nextMatch) {
        if (advancement.slot === "player1") {
          await tournamentRepo.updateMatchPlayers(
            advancement.nextMatchId,
            winnerId,
            nextMatch.player2Id,
          );
        } else {
          await tournamentRepo.updateMatchPlayers(
            advancement.nextMatchId,
            nextMatch.player1Id,
            winnerId,
          );
        }
      }
    }
  }

  // ─── Return updated data ────────────────────────────────────────────
  return NextResponse.json({
    match: updatedMatch,
    bracket: await tournamentRepo.listMatches(tournamentId),
  });
}
