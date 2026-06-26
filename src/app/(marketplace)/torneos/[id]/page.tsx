"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  CalendarDays,
  Medal,
  Swords,
  Trophy,
  Users,
  Check,
  Share2,
  ChevronRight,
  AlertCircle,
  ArrowLeft,
  CircleDollarSign,
  Copy,
} from "lucide-react";
import type { TournamentStatus } from "@/core/entities/tournament";

// ─── Types matching the API response ─────────────────────────────────────

type ApiTournament = {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  format: string;
  startDate: string;
  endDate: string | null;
  registrationDeadline: string | null;
  minLevel: number | null;
  maxLevel: number | null;
  maxParticipants: number | null;
  entryFee: number | null;
  prize: string | null;
  status: TournamentStatus;
  rules: string | null;
  registrationCount?: number;
  level: string | null;
};

type ApiPlayer = {
  userId: string;
  name: string;
  status: string;
  paymentStatus: string;
};

type ApiMatch = {
  id: string;
  tournamentId: string;
  courtId: string | null;
  round: number;
  player1Id: string | null;
  player2Id: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  player1Name: string | null;
  player2Name: string | null;
  winnerName: string | null;
  startTime: string | null;
  status: string;
};

type ApiStanding = {
  id: string;
  tournamentId: string;
  userId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number;
  playerName: string;
};

type ApiResponse = {
  tournament: ApiTournament;
  players: ApiPlayer[];
  matches: ApiMatch[];
  standings: ApiStanding[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Eliminación Directa",
  round_robin: "Round Robin",
  americano: "Americano",
  mexicano: "Mexicano",
};

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: "Borrador",
  registration: "Inscripciones abiertas",
  in_progress: "En curso",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

const LEVEL_LABELS: Record<string, string> = {
  open: "Abierto",
  A: "Nivel A",
  B: "Nivel B",
  C: "Nivel C",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatCop(cents: number | null): string {
  if (cents === null || cents === 0) return "Gratis";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Page component ──────────────────────────────────────────────────────

export default function PublicTournamentPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const res = await fetch(`/api/tournaments/${encodeURIComponent(id)}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Torneo no encontrado");
          throw new Error("Error al cargar el torneo");
        }
        const json = (await res.json()) as ApiResponse;
        if (!active) return;
        setData(json);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  async function handleShare(): Promise<void> {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: data?.tournament.name ?? "Torneo", url });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  if (loading) return <PageSkeleton />;
  if (error || !data) return <NotFoundState error={error ?? undefined} />;

  const { tournament, players, matches, standings } = data;
  const isUpcoming = tournament.status === "draft" || tournament.status === "registration";
  const isInProgress = tournament.status === "in_progress";
  const isCompleted = tournament.status === "completed";
  const isLive = isInProgress || isCompleted;
  const matchesByRound = groupMatchesByRound(matches);
  const hasBracket = isLive && matches.length > 0;

  return (
    <main className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)] py-[var(--pb-space-6)] text-[var(--pb-text-primary)] md:py-[var(--pb-space-8)]">
      <div className="mx-auto max-w-[var(--pb-layout-max)] space-y-[var(--pb-space-6)]">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-[var(--pb-space-2)] text-sm text-[var(--pb-text-secondary)]" aria-label="Ruta de navegación">
          <Link className="hover:text-[var(--pb-brand-primary)] transition-colors" href="/buscar">
            Marketplace
          </Link>
          <ChevronRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
          <span className="text-[var(--pb-text-primary)] font-medium truncate max-w-[200px]">
            {tournament.name}
          </span>
        </nav>

        {/* ── Tournament header ── */}
        <header className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)] md:p-[var(--pb-space-8)]">
          <div className="flex flex-col gap-[var(--pb-space-5)]">
            <div className="flex flex-wrap items-start justify-between gap-[var(--pb-space-4)]">
              <div className="space-y-[var(--pb-space-3)] min-w-0">
                <div className="flex flex-wrap items-center gap-[var(--pb-space-3)]">
                  <h1 className="text-[length:var(--pb-text-h1)] font-bold tracking-[-0.025em] leading-tight">
                    {tournament.name}
                  </h1>
                  <StatusBadge status={tournament.status} />
                </div>
                {tournament.description && (
                  <p className="text-[var(--pb-text-secondary)] leading-relaxed max-w-3xl">
                    {tournament.description}
                  </p>
                )}
              </div>
              <div className="flex gap-[var(--pb-space-2)] shrink-0">
                {isUpcoming && (
                  <Link
                    href={`/torneos/${tournament.id}/registro`}
                    className="inline-flex min-h-11 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-5)] text-sm font-semibold text-[var(--pb-brand-foreground)] shadow-[var(--pb-shadow-action)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
                  >
                    <Swords aria-hidden="true" className="size-4" strokeWidth={2} />
                    Inscribirse
                  </Link>
                )}
                <button
                  onClick={handleShare}
                  className="inline-flex min-h-11 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-4)] text-sm font-semibold text-[var(--pb-text-primary)] transition-colors hover:bg-[var(--pb-surface-secondary)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
                  type="button"
                  aria-label="Compartir torneo"
                >
                  {copied ? (
                    <Check aria-hidden="true" className="size-4 text-[var(--pb-status-success)]" strokeWidth={2} />
                  ) : (
                    <Share2 aria-hidden="true" className="size-4" strokeWidth={2} />
                  )}
                  <span className="hidden sm:inline">{copied ? "Enlace copiado" : "Compartir"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-[var(--pb-space-3)] sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
              <InfoChip icon={<CalendarDays className="size-4" />} label="Fecha" value={formatDate(tournament.startDate)} />
              <InfoChip icon={<Swords className="size-4" />} label="Formato" value={FORMAT_LABELS[tournament.format] ?? tournament.format} />
              <InfoChip icon={<Medal className="size-4" />} label="Nivel" value={tournament.level ? (LEVEL_LABELS[tournament.level] ?? tournament.level) : "Abierto"} />
              {tournament.prize && <InfoChip icon={<Trophy className="size-4" />} label="Premio" value={tournament.prize} />}
              <InfoChip icon={<Users className="size-4" />} label="Cupos" value={`${players.length}${tournament.maxParticipants ? ` / ${tournament.maxParticipants}` : ""}`} />
              {tournament.entryFee !== null && tournament.entryFee > 0 && (
                <InfoChip icon={<CircleDollarSign className="size-4" />} label="Inscripción" value={formatCop(tournament.entryFee)} />
              )}
            </div>
          </div>
        </header>

        {/* ── Players list ── */}
        <section className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)] md:p-[var(--pb-space-6)]">
          <div className="flex items-center justify-between mb-[var(--pb-space-4)]">
            <h2 className="text-[length:var(--pb-text-h2)] font-bold tracking-[-0.02em]">
              Jugadores inscritos
            </h2>
            <span className="rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)] px-[var(--pb-space-3)] py-[var(--pb-space-1)] text-xs font-semibold text-[var(--pb-text-secondary)]">
              {players.length}
            </span>
          </div>
          {players.length === 0 ? (
            <p className="py-[var(--pb-space-6)] text-center text-[var(--pb-text-secondary)]">
              No hay jugadores inscritos todavía.
            </p>
          ) : (
            <ul className="grid gap-[var(--pb-space-2)] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {players.map((player) => (
                <li
                  key={player.userId}
                  className="flex items-center gap-[var(--pb-space-3)] rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)] px-[var(--pb-space-4)] py-[var(--pb-space-3)]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--pb-radius-full)] bg-[var(--pb-brand-primary)]/10 text-sm font-bold text-[var(--pb-brand-primary)]">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate text-sm font-medium">{player.name}</span>
                  {player.status === "confirmed" && (
                    <span className="ml-auto shrink-0 rounded-full bg-[var(--pb-status-success)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--pb-status-success)]">
                      Confirmado
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isUpcoming && (
            <div className="mt-[var(--pb-space-5)] border-t border-[var(--pb-border-subtle)] pt-[var(--pb-space-4)]">
              <Link
                href={`/torneos/${tournament.id}/registro`}
                className="inline-flex min-h-11 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-5)] text-sm font-semibold text-[var(--pb-brand-foreground)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
              >
                <Swords aria-hidden="true" className="size-4" strokeWidth={2} />
                Inscribirme a este torneo
              </Link>
            </div>
          )}
        </section>

        {/* ── Bracket (in_progress or completed) ── */}
        {hasBracket && tournament.format === "single_elimination" && (
          <section className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)] md:p-[var(--pb-space-6)]">
            <div className="flex items-center gap-[var(--pb-space-3)] mb-[var(--pb-space-5)]">
              <Swords aria-hidden="true" className="size-5 text-[var(--pb-brand-primary)]" strokeWidth={2} />
              <h2 className="text-[length:var(--pb-text-h2)] font-bold tracking-[-0.02em]">
                Cuadro del torneo
              </h2>
            </div>
            <BracketView rounds={matchesByRound} />
          </section>
        )}

        {/* ── Round robin match list ── */}
        {hasBracket && tournament.format === "round_robin" && (
          <section className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)] md:p-[var(--pb-space-6)]">
            <div className="flex items-center gap-[var(--pb-space-3)] mb-[var(--pb-space-5)]">
              <Swords aria-hidden="true" className="size-5 text-[var(--pb-brand-primary)]" strokeWidth={2} />
              <h2 className="text-[length:var(--pb-text-h2)] font-bold tracking-[-0.02em]">
                Partidos
              </h2>
            </div>
            <RoundRobinView rounds={matchesByRound} />
          </section>
        )}

        {/* ── Standings (completed) ── */}
        {isCompleted && standings.length > 0 && (
          <section className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)] md:p-[var(--pb-space-6)]">
            <div className="flex items-center gap-[var(--pb-space-3)] mb-[var(--pb-space-5)]">
              <Trophy aria-hidden="true" className="size-5 text-[var(--pb-energy-clay)]" strokeWidth={2} />
              <h2 className="text-[length:var(--pb-text-h2)] font-bold tracking-[-0.02em]">
                Clasificación final
              </h2>
            </div>
            <StandingsTable standings={standings} />
          </section>
        )}

        {/* ── Registration deadline info ── */}
        {tournament.registrationDeadline && isUpcoming && (
          <p className="text-sm text-[var(--pb-text-tertiary)] text-center">
            Inscripciones abiertas hasta {formatDate(tournament.registrationDeadline)}
          </p>
        )}
      </div>
    </main>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function StatusBadge({ status }: { readonly status: TournamentStatus }) {
  const colors: Record<TournamentStatus, string> = {
    draft: "bg-[var(--pb-surface-secondary)] text-[var(--pb-text-tertiary)]",
    registration: "bg-[var(--pb-status-success)]/10 text-[var(--pb-status-success)]",
    in_progress: "bg-[var(--pb-energy-clay)]/10 text-[var(--pb-energy-clay)]",
    completed: "bg-[var(--pb-trust-verified)]/10 text-[var(--pb-trust-verified)]",
    cancelled: "bg-[var(--pb-status-error)]/10 text-[var(--pb-status-error)]",
  };
  return (
    <span className={`inline-flex items-center rounded-[var(--pb-radius-full)] px-[var(--pb-space-3)] py-[var(--pb-space-1)] text-xs font-bold ${colors[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)] px-[var(--pb-space-3)] py-[var(--pb-space-3)]">
      <span className="shrink-0 text-[var(--pb-text-tertiary)]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--pb-text-tertiary)]">
          {label}
        </p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function GroupedRoundMatches({ roundIndex, matches, totalRounds }: { roundIndex: number; matches: ApiMatch[]; totalRounds: number }) {
  const roundLabel = totalRounds <= 3
    ? ["Final", "Semifinales", "Cuartos de final"][totalRounds - roundIndex] ?? `Ronda ${roundIndex}`
    : `Ronda ${roundIndex}`;

  return (
    <div className="space-y-[var(--pb-space-2)]">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--pb-text-tertiary)] mb-[var(--pb-space-2)]">
        {roundLabel}
      </p>
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}

function MatchCard({ match }: { readonly match: ApiMatch }) {
  const isCompleted = match.status === "completed";
  const scoreDisplay = match.score1 !== null && match.score2 !== null
    ? `${match.score1} - ${match.score2}`
    : null;

  return (
    <div
      className={`rounded-[var(--pb-radius-md)] border px-[var(--pb-space-3)] py-[var(--pb-space-2)] text-sm ${
        isCompleted
          ? "border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)]"
          : "border-dashed border-[var(--pb-border-subtle)] bg-[var(--pb-surface-secondary)]/50"
      }`}
    >
      <div className="flex items-center justify-between gap-[var(--pb-space-2)]">
        <div className="flex-1 min-w-0">
          <span className={`block truncate ${match.winnerId === match.player1Id ? "font-bold text-[var(--pb-brand-primary)]" : match.status === "completed" ? "text-[var(--pb-text-tertiary)]" : ""}`}>
            {match.player1Name ?? "—"}
          </span>
          <span className={`block truncate ${match.winnerId === match.player2Id ? "font-bold text-[var(--pb-brand-primary)]" : match.status === "completed" ? "text-[var(--pb-text-tertiary)]" : ""}`}>
            {match.player2Name ?? "—"}
          </span>
        </div>
        <div className="shrink-0 text-right">
          {scoreDisplay ? (
            <span className="font-mono font-bold text-sm">{scoreDisplay}</span>
          ) : match.status === "scheduled" ? (
            <span className="text-[10px] uppercase tracking-[0.06em] text-[var(--pb-text-tertiary)]">
              Pendiente
            </span>
          ) : null}
          {match.status === "in_progress" && (
            <span className="text-[10px] uppercase tracking-[0.06em] text-[var(--pb-energy-clay)] font-semibold">
              Jugando
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function BracketView({ rounds }: { readonly rounds: Map<number, ApiMatch[]> }) {
  const sortedRounds = Array.from(rounds.entries()).sort(([a], [b]) => b - a);
  const totalRounds = sortedRounds.length;

  if (totalRounds === 0) return <p className="text-sm text-[var(--pb-text-secondary)] text-center py-[var(--pb-space-6)]">No hay partidos disponibles.</p>;

  return (
    <div className="space-y-[var(--pb-space-6)]">
      {sortedRounds.map(([roundIndex, roundMatches]) => (
        <div key={roundIndex}>
          {/* 3rd-place match flag: last round, second match */}
          {roundIndex === totalRounds && roundMatches.length > 1 ? (
            <>
              <div className="mb-[var(--pb-space-3)]">
                <GroupedRoundMatches
                  roundIndex={roundIndex}
                  matches={[roundMatches[0]]}
                  totalRounds={totalRounds}
                />
              </div>
              <div className="border-t border-dashed border-[var(--pb-border-subtle)] pt-[var(--pb-space-4)]">
                <GroupedRoundMatches
                  roundIndex={roundIndex}
                  matches={[roundMatches[1]]}
                  totalRounds={totalRounds}
                />
              </div>
            </>
          ) : (
            <GroupedRoundMatches
              roundIndex={roundIndex}
              matches={roundMatches}
              totalRounds={totalRounds}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function RoundRobinView({ rounds }: { readonly rounds: Map<number, ApiMatch[]> }) {
  const sortedRounds = Array.from(rounds.entries()).sort(([a], [b]) => a - b);

  if (sortedRounds.length === 0) return <p className="text-sm text-[var(--pb-text-secondary)] text-center py-[var(--pb-space-6)]">No hay partidos disponibles.</p>;

  return (
    <div className="space-y-[var(--pb-space-6)]">
      {sortedRounds.map(([roundIndex, roundMatches]) => (
        <div key={roundIndex}>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--pb-text-tertiary)] mb-[var(--pb-space-2)]">
            Jornada {roundIndex}
          </p>
          <div className="grid gap-[var(--pb-space-2)] sm:grid-cols-2 lg:grid-cols-3">
            {roundMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StandingsTable({ standings }: { readonly standings: ApiStanding[] }) {
  const sorted = [...standings].sort((a, b) => b.points - a.points || b.wins - a.wins);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--pb-border-subtle)] text-left text-xs font-semibold uppercase tracking-[0.06em] text-[var(--pb-text-tertiary)]">
            <th className="pb-[var(--pb-space-2)] pr-[var(--pb-space-3)]">#</th>
            <th className="pb-[var(--pb-space-2)] pr-[var(--pb-space-3)] min-w-[140px]">Jugador</th>
            <th className="pb-[var(--pb-space-2)] pr-[var(--pb-space-3)] text-center">PJ</th>
            <th className="pb-[var(--pb-space-2)] pr-[var(--pb-space-3)] text-center">G</th>
            <th className="pb-[var(--pb-space-2)] pr-[var(--pb-space-3)] text-center">P</th>
            <th className="pb-[var(--pb-space-2)] text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => {
            const isTop = i < 3;
            return (
              <tr
                key={s.userId}
                className={`border-b border-[var(--pb-border-subtle)]/50 ${
                  isTop ? "bg-[var(--pb-surface-secondary)]/50" : ""
                }`}
              >
                <td className="py-[var(--pb-space-2)] pr-[var(--pb-space-3)] font-bold">
                  {i === 0 ? (
                    <Trophy aria-hidden="true" className="size-4 text-[var(--pb-energy-yellow)]" strokeWidth={2} />
                  ) : i === 1 ? (
                    <Medal aria-hidden="true" className="size-4 text-[var(--pb-text-tertiary)]" strokeWidth={2} />
                  ) : i === 2 ? (
                    <Medal aria-hidden="true" className="size-4 text-[var(--pb-energy-clay)]" strokeWidth={2} />
                  ) : (
                    <span className="text-[var(--pb-text-tertiary)]">{i + 1}</span>
                  )}
                </td>
                <td className="py-[var(--pb-space-2)] pr-[var(--pb-space-3)] font-medium truncate max-w-[180px]">
                  {s.playerName}
                </td>
                <td className="py-[var(--pb-space-2)] pr-[var(--pb-space-3)] text-center text-[var(--pb-text-secondary)]">{s.matchesPlayed}</td>
                <td className="py-[var(--pb-space-2)] pr-[var(--pb-space-3)] text-center text-[var(--pb-status-success)] font-semibold">{s.wins}</td>
                <td className="py-[var(--pb-space-2)] pr-[var(--pb-space-3)] text-center text-[var(--pb-status-error)]">{s.losses}</td>
                <td className="py-[var(--pb-space-2)] text-center font-bold">{s.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── State components ────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <main className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)] py-[var(--pb-space-8)]">
      <div className="mx-auto max-w-[var(--pb-layout-max)] space-y-[var(--pb-space-6)]">
        <div className="h-5 w-48 animate-pulse rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
        <div className="h-56 animate-pulse rounded-[var(--pb-radius-xl)] bg-[var(--pb-surface-secondary)]" />
        <div className="h-48 animate-pulse rounded-[var(--pb-radius-xl)] bg-[var(--pb-surface-secondary)]" />
        <div className="h-64 animate-pulse rounded-[var(--pb-radius-xl)] bg-[var(--pb-surface-secondary)]" />
      </div>
    </main>
  );
}

function NotFoundState({ error }: { readonly error?: string }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)]">
      <section className="max-w-md rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-8)] text-center shadow-[var(--pb-shadow-card)]">
        <AlertCircle aria-hidden="true" className="mx-auto size-10 text-[var(--pb-status-error)]" strokeWidth={2} />
        <h1 className="mt-[var(--pb-space-4)] text-[length:var(--pb-text-h2)] font-bold">
          Torneo no encontrado
        </h1>
        <p className="mt-[var(--pb-space-3)] text-[var(--pb-text-secondary)]">
          {error ?? "Revisa el enlace o vuelve al marketplace."}
        </p>
        <Link
          className="mt-[var(--pb-space-6)] inline-flex min-h-11 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-5)] font-semibold text-[var(--pb-brand-foreground)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
          href="/buscar"
        >
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2} />
          Volver al marketplace
        </Link>
      </section>
    </main>
  );
}

// ─── Utils ───────────────────────────────────────────────────────────────

function groupMatchesByRound(matches: ApiMatch[]): Map<number, ApiMatch[]> {
  const grouped = new Map<number, ApiMatch[]>();
  for (const match of matches) {
    const existing = grouped.get(match.round) ?? [];
    existing.push(match);
    grouped.set(match.round, existing);
  }
  return grouped;
}
