"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MODULE_FLAGS } from "@/padelbacano.config";

// ─── Types ───────────────────────────────────────────────────────────────────

type TournamentDetail = {
  id: string;
  name: string;
  format: string;
  status: string;
  startDate: string;
  maxParticipants: number | null;
  prize: string | null;
  description: string | null;
};

type TournamentPlayer = {
  userId: string;
  name: string;
  status: string;
  paymentStatus: string;
};

type Match = {
  id: string;
  tournamentId: string;
  round: number;
  player1Id: string | null;
  player2Id: string | null;
  player1Name: string | null;
  player2Name: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  winnerName: string | null;
  status: string;
  startTime: string | null;
};

type Standing = {
  id: string;
  userId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number;
};

type TournamentData = {
  tournament: TournamentDetail;
  players: TournamentPlayer[];
  matches: Match[];
  standings: Standing[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  registration: "Inscripciones",
  in_progress: "En curso",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Eliminación Directa",
  round_robin: "Round Robin",
  americano: "Americano",
  mexicano: "Mexicano",
};

const MATCH_STATUS_LABELS: Record<string, string> = {
  scheduled: "Programado",
  in_progress: "En juego",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

function matchStatusVariant(status: string): "default" | "success" | "warning" | "error" {
  switch (status) {
    case "completed": return "success";
    case "in_progress": return "warning";
    case "cancelled": return "error";
    default: return "default";
  }
}

// ─── Score Form Component ────────────────────────────────────────────────────

function ScoreForm({
  match,
  onSubmitted,
}: {
  match: Match;
  onSubmitted: () => void;
}) {
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);

    if (isNaN(s1) || isNaN(s2)) {
      setError("Ambos scores deben ser números");
      return;
    }
    if (s1 < 0 || s2 < 0) {
      setError("Los scores no pueden ser negativos");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/tournaments/${match.tournamentId}/matches/${match.id}/score`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score1: s1, score2: s2 }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al guardar el resultado");
        return;
      }

      onSubmitted();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          value={score1}
          onChange={(e) => setScore1(e.target.value)}
          disabled={submitting}
          className="w-14 h-8 rounded border border-[var(--club-border)] px-2 text-center text-sm"
          placeholder="0"
        />
        <span className="text-[var(--club-ink-muted)] text-xs font-bold">-</span>
        <input
          type="number"
          min="0"
          value={score2}
          onChange={(e) => setScore2(e.target.value)}
          disabled={submitting}
          className="w-14 h-8 rounded border border-[var(--club-border)] px-2 text-center text-sm"
          placeholder="0"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button
        type="submit"
        size="sm"
        disabled={submitting}
        className="text-xs h-7"
      >
        {submitting ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}

// ─── Match Card Component ────────────────────────────────────────────────────

function MatchCard({
  match,
  onScoreSubmitted,
}: {
  match: Match;
  onScoreSubmitted: () => void;
}) {
  return (
    <div className="rounded-[var(--club-radius)] border border-[var(--club-border)] bg-white p-3 min-w-[180px]">
      <div className="flex items-center justify-between mb-1">
        <Badge variant={matchStatusVariant(match.status)} className="text-[10px] px-1.5 py-0">
          {MATCH_STATUS_LABELS[match.status] ?? match.status}
        </Badge>
      </div>

      {/* Player 1 */}
      <div className={`flex items-center justify-between py-1 px-1 rounded text-sm ${match.winnerId && match.winnerId === match.player1Id ? "font-bold text-[var(--club-primary)]" : "text-[var(--club-ink)]"}`}>
        <span className="truncate flex-1">
          {match.player1Name ?? "—"}
        </span>
        {match.status === "completed" && (
          <span className="ml-2 font-mono text-sm tabular-nums">{match.score1}</span>
        )}
      </div>

      {/* VS divider */}
      <div className="border-t border-[var(--club-border)] my-1" />

      {/* Player 2 */}
      <div className={`flex items-center justify-between py-1 px-1 rounded text-sm ${match.winnerId && match.winnerId === match.player2Id ? "font-bold text-[var(--club-primary)]" : "text-[var(--club-ink)]"}`}>
        <span className="truncate flex-1">
          {match.player2Name ?? "—"}
        </span>
        {match.status === "completed" && (
          <span className="ml-2 font-mono text-sm tabular-nums">{match.score2}</span>
        )}
      </div>

      {/* Score entry form — only for playable pending matches */}
      {match.status !== "completed" && match.status !== "cancelled" && match.player1Id && match.player2Id && (
        <div className="mt-2 border-t border-dashed border-[var(--club-border)] pt-2">
          <p className="text-[10px] text-[var(--club-ink-muted)] mb-1 uppercase tracking-wide font-medium">
            Registrar resultado
          </p>
          <ScoreForm match={match} onSubmitted={onScoreSubmitted} />
        </div>
      )}
    </div>
  );
}

// ─── Round Group Component ───────────────────────────────────────────────────

function RoundGroup({
  round,
  matches,
  onScoreSubmitted,
}: {
  round: number;
  matches: Match[];
  onScoreSubmitted: () => void;
}) {
  const isFinal = matches.length === 1;
  const isThirdPlace = round === 100; // placeholder for third-place round display

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-bold text-[var(--club-ink-muted)] uppercase tracking-widest mb-1">
        {isThirdPlace ? "3er Puesto" : `Ronda ${round}`}
      </h3>
      {isFinal && (
        <div className="w-16 h-0.5 bg-yellow-400 mb-1 rounded-full" />
      )}
      <div className="flex flex-col gap-2">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onScoreSubmitted={onScoreSubmitted}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminTournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [data, setData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) {
        setError("Error al cargar el torneo");
        setLoading(false);
        return;
      }
      const d = await res.json();
      setData(d);
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData, refreshKey]);

  const handleScoreSubmitted = () => {
    setRefreshKey((k) => k + 1);
  };

  if (!MODULE_FLAGS.tournaments) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Torneos</h1>
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--club-ink-muted)] py-8 text-center">
              El módulo de torneos no está activado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl">
        <Card>
          <CardContent>
            <p className="text-sm text-red-600 py-8 text-center">
              {error ?? "Torneo no encontrado"}
            </p>
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={fetchData}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { tournament, matches, standings } = data;

  // Group matches by round
  const byRound = new Map<number, Match[]>();
  for (const m of matches) {
    const list = byRound.get(m.round) ?? [];
    list.push(m);
    byRound.set(m.round, list);
  }

  const sortedRounds = Array.from(byRound.entries()).sort(
    ([a], [b]) => a - b,
  );

  // Determine max round for layout (final is the last round)
  const maxRound = sortedRounds.length > 0 ? sortedRounds[sortedRounds.length - 1][0] : 0;

  return (
    <div className="max-w-6xl">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--club-ink)]">
            {tournament.name}
          </h1>
          <p className="text-sm text-[var(--club-ink-muted)]">
            {FORMAT_LABELS[tournament.format] ?? tournament.format}
            {" · "}
            {new Date(tournament.startDate).toLocaleDateString("es-ES")}
            {" · "}
            <Badge>{STATUS_LABELS[tournament.status] ?? tournament.status}</Badge>
          </p>
        </div>
      </div>

      {/* ─── Stats Card ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--club-ink-muted)]">Formato</p>
            <p className="text-lg font-bold text-[var(--club-ink)]">
              {FORMAT_LABELS[tournament.format] ?? tournament.format}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--club-ink-muted)]">Partidos</p>
            <p className="text-lg font-bold text-[var(--club-ink)]">
              {matches.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--club-ink-muted)]">Jugadores</p>
            <p className="text-lg font-bold text-[var(--club-ink)]">
              {data.players.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--club-ink-muted)]">Rondas</p>
            <p className="text-lg font-bold text-[var(--club-ink)]">{maxRound}</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Bracket View ─────────────────────────────────────────────── */}
      {tournament.format === "single_elimination" && matches.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Cuadro del Torneo</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Horizontal bracket layout */}
            <div className="flex gap-6 overflow-x-auto pb-4">
              {sortedRounds.map(([round, roundMatches]) => (
                <div key={round} className="flex-shrink-0">
                  <RoundGroup
                    round={round}
                    matches={roundMatches}
                    onScoreSubmitted={handleScoreSubmitted}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : matches.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Partidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedRounds.map(([round, roundMatches]) => (
                <div key={round}>
                  <h3 className="text-xs font-bold text-[var(--club-ink-muted)] uppercase tracking-widest mb-2">
                    Ronda {round}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {roundMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onScoreSubmitted={handleScoreSubmitted}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent>
            <p className="text-sm text-[var(--club-ink-muted)] py-6 text-center">
              No hay partidos generados aún.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Standings ───────────────────────────────────────────────── */}
      {standings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Clasificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--club-border)] text-[var(--club-ink-muted)] text-xs uppercase tracking-wider">
                    <th className="text-left py-2 pr-2">#</th>
                    <th className="text-left py-2 pr-2">Jugador</th>
                    <th className="text-center py-2 pr-2">PJ</th>
                    <th className="text-center py-2 pr-2">G</th>
                    <th className="text-center py-2 pr-2">P</th>
                    <th className="text-center py-2 pr-2">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={s.id} className="border-b border-[var(--club-border)]/50 last:border-0">
                      <td className="py-2 pr-2 font-bold text-[var(--club-ink-muted)] w-8">{i + 1}</td>
                      <td className="py-2 pr-2 font-medium text-[var(--club-ink)]">{s.playerName}</td>
                      <td className="py-2 pr-2 text-center">{s.matchesPlayed}</td>
                      <td className="py-2 pr-2 text-center text-green-600">{s.wins}</td>
                      <td className="py-2 pr-2 text-center text-red-600">{s.losses}</td>
                      <td className="py-2 pr-2 text-center font-bold">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Empty state ─────────────────────────────────────────────── */}
      {matches.length === 0 && standings.length === 0 && (
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--club-ink-muted)] py-6 text-center">
              El torneo no tiene actividad registrada.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
