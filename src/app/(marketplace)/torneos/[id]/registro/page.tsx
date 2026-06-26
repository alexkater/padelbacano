"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { z } from "zod";
import {
  CalendarDays,
  Clock,
  MapPin,
  Swords,
  Trophy,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserRound,
} from "lucide-react";

// ─── Schema ──────────────────────────────────────────────────────────────────

const tournamentResponseSchema = z.object({
  tournament: z.object({
    id: z.string(),
    clubId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    format: z.string(),
    startDate: z.string(),
    endDate: z.string().nullable(),
    registrationDeadline: z.string().nullable(),
    level: z.string(),
    minLevel: z.number().nullable(),
    maxLevel: z.number().nullable(),
    maxParticipants: z.number().nullable(),
    entryFee: z.number().nullable(),
    prize: z.string().nullable(),
    status: z.string(),
    rules: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    registeredCount: z.number(),
  }),
});

type TournamentData = z.infer<typeof tournamentResponseSchema>["tournament"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(dateStr));
}

function formatDateOnly(dateStr: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "long",
  }).format(new Date(dateStr));
}

function formatCop(cents: number | null): string | null {
  if (cents === null || cents === undefined) return null;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Eliminación directa",
  round_robin: "Todos contra todos",
  americano: "Americano",
  mexicano: "Mexicano",
};

const LEVEL_LABELS: Record<string, string> = {
  open: "Abierto",
  A: "A (Avanzado)",
  B: "B (Intermedio)",
  C: "C (Principiante)",
};

// ─── Page ────────────────────────────────────────────────────────────────────

type Params = { readonly params: Promise<{ readonly id: string }> };

export default function TournamentRegistrationPage({ params }: Params) {
  const { id } = use(params);
  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated";

  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [pageStatus, setPageStatus] = useState<"loading" | "ready" | "error" | "missing">("loading");

  // Registration state
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const loadTournament = useCallback(async () => {
    setPageStatus("loading");
    try {
      const res = await fetch(`/api/tournaments/${encodeURIComponent(id)}`);
      if (!res.ok) {
        setPageStatus(res.status === 404 ? "missing" : "error");
        return;
      }
      const payload = tournamentResponseSchema.parse(await res.json());
      setTournament(payload.tournament);
      setPageStatus("ready");
    } catch {
      setPageStatus("error");
    }
  }, [id]);

  useEffect(() => {
    loadTournament().catch(() => setPageStatus("error"));
  }, [loadTournament]);

  const handleRegister = useCallback(async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const returnUrl = `/torneos/${encodeURIComponent(id)}/registro`;
      await signIn(undefined, { callbackUrl: returnUrl });
      return;
    }

    setRegistering(true);
    setRegisterError(null);
    try {
      const res = await fetch(`/api/tournaments/${encodeURIComponent(id)}/register`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Error al inscribirte" }));
        setRegisterError(body.error ?? "Error al inscribirte");
        return;
      }
      setRegistered(true);
      // Reload tournament data to update spot count
      await loadTournament();
    } catch {
      setRegisterError("Error de conexión. Intenta de nuevo.");
    } finally {
      setRegistering(false);
    }
  }, [id, isAuthenticated, loadTournament]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (pageStatus === "loading") {
    return <LoadingSkeleton />;
  }

  // ── Missing / not found ─────────────────────────────────────────────────
  if (pageStatus === "missing" || !tournament) {
    return <NotFoundState />;
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (pageStatus === "error") {
    return <ErrorState onRetry={loadTournament} />;
  }

  const maxParticipants = tournament.maxParticipants;
  const spotsFull = maxParticipants !== null && tournament.registeredCount >= maxParticipants;
  const isOpen = tournament.status === "registration";
  const passedDeadline =
    tournament.registrationDeadline && new Date() > new Date(tournament.registrationDeadline);

  // ── Ready state ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)] py-[var(--pb-space-8)] text-[var(--pb-text-primary)]">
      <div className="mx-auto max-w-[var(--pb-layout-max)] space-y-[var(--pb-space-8)]">
        {/* Breadcrumb */}
        <nav className="text-sm text-[var(--pb-text-secondary)]" aria-label="Ruta de navegación">
          <Link className="hover:text-[var(--pb-brand-primary)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]" href="/buscar">
            Marketplace
          </Link>
          <span className="px-[var(--pb-space-2)]">/</span>
          <Link className="hover:text-[var(--pb-brand-primary)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]" href="/buscar">
            Torneos
          </Link>
          <span className="px-[var(--pb-space-2)]">/</span>
          <span className="text-[var(--pb-text-primary)]">{tournament.name}</span>
        </nav>

        {/* Tournament header */}
        <header className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)] shadow-[var(--pb-shadow-card)]">
          <div className="flex flex-col gap-[var(--pb-space-6)] md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-[var(--pb-space-4)]">
              <div className="flex flex-wrap items-start justify-between gap-[var(--pb-space-3)]">
                <div>
                  <h1 className="text-[length:var(--pb-text-h1)] font-[750] leading-[1.05] tracking-[-0.025em]">
                    {tournament.name}
                  </h1>
                  <p className="mt-[var(--pb-space-2)] flex items-center gap-[var(--pb-space-2)] text-sm text-[var(--pb-text-secondary)]">
                    <Swords aria-hidden="true" className="size-4" strokeWidth={2} />
                    {FORMAT_LABELS[tournament.format] ?? tournament.format}
                    <span aria-hidden="true">·</span>
                    Nivel: {LEVEL_LABELS[tournament.level as string] ?? tournament.level ?? "Abierto"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-[var(--pb-space-1)] whitespace-nowrap rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)] px-[var(--pb-space-3)] py-[var(--pb-space-1)] text-xs font-semibold text-[var(--pb-text-secondary)]">
                  <Users aria-hidden="true" className="size-3.5" strokeWidth={2} />
                  {tournament.registeredCount}{maxParticipants !== null ? ` / ${maxParticipants}` : ""} inscritos
                </span>
              </div>

              {tournament.description ? (
                <p className="max-w-3xl text-base leading-7 text-[var(--pb-text-secondary)]">
                  {tournament.description}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        {/* Details grid */}
        <div className="grid gap-[var(--pb-space-6)] md:grid-cols-2 lg:grid-cols-3">
          {/* Date and time */}
          <DetailCard icon={CalendarDays} label="Inicio" value={formatDateOnly(tournament.startDate)} />
          <DetailCard icon={Clock} label="Fin" value={tournament.endDate ? formatDateOnly(tournament.endDate) : "Por definir"} />
          <DetailCard
            icon={Trophy}
            label="Premio"
            value={tournament.prize ?? "Sin premio"}
            highlight={!!tournament.prize}
          />

          {/* Entry fee */}
          {tournament.entryFee !== null && tournament.entryFee > 0 ? (
            <DetailCard
              icon={MapPin}
              label="Costo de inscripción"
              value={formatCop(tournament.entryFee) ?? "Gratuito"}
              highlight
            />
          ) : (
            <DetailCard icon={MapPin} label="Costo de inscripción" value="Gratuito" />
          )}

          {/* Level range */}
          <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
            <div className="flex items-center gap-[var(--pb-space-2)] text-sm text-[var(--pb-text-tertiary)]">
              <Users aria-hidden="true" className="size-4" strokeWidth={2} />
              <span className="font-semibold uppercase tracking-[0.11em]">Nivel requerido</span>
            </div>
            <p className="mt-[var(--pb-space-1)] text-lg font-bold text-[var(--pb-text-primary)]">
              {tournament.minLevel !== null && tournament.maxLevel !== null
                ? `${tournament.minLevel} – ${tournament.maxLevel}`
                : tournament.minLevel !== null
                  ? `Desde nivel ${tournament.minLevel}`
                  : tournament.maxLevel !== null
                    ? `Hasta nivel ${tournament.maxLevel}`
                    : "Abierto a todos los niveles"}
            </p>
          </div>

          {/* Spots */}
          <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
            <div className="flex items-center gap-[var(--pb-space-2)] text-sm text-[var(--pb-text-tertiary)]">
              <Users aria-hidden="true" className="size-4" strokeWidth={2} />
              <span className="font-semibold uppercase tracking-[0.11em]">Cupos</span>
            </div>
            <p className="mt-[var(--pb-space-1)] text-lg font-bold text-[var(--pb-text-primary)]">
              {maxParticipants !== null
                ? `${tournament.registeredCount} / ${maxParticipants}`
                : `${tournament.registeredCount} inscritos`}
            </p>
            {spotsFull ? (
              <p className="mt-[var(--pb-space-1)] flex items-center gap-[var(--pb-space-1)] text-sm font-semibold text-[var(--pb-status-error)]">
                <AlertCircle aria-hidden="true" className="size-4" strokeWidth={2} />
                Torneo completo
              </p>
            ) : (
              <p className="mt-[var(--pb-space-1)] text-sm text-[var(--pb-text-secondary)]">
                {maxParticipants !== null
                  ? `${maxParticipants - tournament.registeredCount} cupos disponibles`
                  : "Cupos disponibles"}
              </p>
            )}
          </div>
        </div>

        {/* Registration deadline notice */}
        {tournament.registrationDeadline ? (
          <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
            <p className="flex items-center gap-[var(--pb-space-2)] text-sm text-[var(--pb-text-secondary)]">
              <Clock aria-hidden="true" className="size-4" strokeWidth={2} />
              <span>
                {passedDeadline
                  ? "El plazo de inscripción ha finalizado"
                  : `Inscripciones abiertas hasta ${formatDate(tournament.registrationDeadline)}`}
              </span>
            </p>
          </div>
        ) : null}

        {/* Rules */}
        {tournament.rules ? (
          <section className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
            <h2 className="mb-[var(--pb-space-3)] text-lg font-bold">Reglas del torneo</h2>
            <p className="whitespace-pre-line text-sm leading-6 text-[var(--pb-text-secondary)]">
              {tournament.rules}
            </p>
          </section>
        ) : null}

        {/* Registration CTA */}
        <section className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)] shadow-[var(--pb-shadow-card)]">
          <div className="flex flex-col items-center gap-[var(--pb-space-4)] text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              {registered ? (
                <>
                  <h2 className="flex items-center gap-[var(--pb-space-2)] text-lg font-bold text-[var(--pb-status-success)]">
                    <CheckCircle2 aria-hidden="true" className="size-5" strokeWidth={2} />
                    ¡Inscripción confirmada!
                  </h2>
                  <p className="mt-[var(--pb-space-1)] text-sm text-[var(--pb-text-secondary)]">
                    Ya eres parte de {tournament.name}. Recibirás detalles antes del inicio.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold">¿Listo para jugar?</h2>
                  <p className="text-sm text-[var(--pb-text-secondary)]">
                    {!isOpen
                      ? "Este torneo no está aceptando inscripciones en este momento."
                      : spotsFull
                        ? "Todos los cupos están ocupados."
                        : passedDeadline
                          ? "El plazo de inscripción finalizó."
                          : "Inscríbete y asegura tu lugar en el torneo."}
                  </p>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-[var(--pb-space-3)]">
              {registered ? (
                <Link
                  href="/buscar"
                  className="inline-flex min-h-12 items-center rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-6)] font-semibold text-[var(--pb-brand-foreground)] shadow-[var(--pb-shadow-action)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
                >
                  Explorar más torneos
                </Link>
              ) : (
                <>
                  {isOpen && !spotsFull && !passedDeadline ? (
                    <button
                      type="button"
                      disabled={registering}
                      onClick={handleRegister}
                      className="inline-flex min-h-12 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-6)] font-semibold text-[var(--pb-brand-foreground)] shadow-[var(--pb-shadow-action)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {registering ? (
                        <>
                          <Loader2 aria-hidden="true" className="size-5 animate-spin" strokeWidth={2} />
                          Inscribiendo…
                        </>
                      ) : !isAuthenticated ? (
                        <>
                          <UserRound aria-hidden="true" className="size-5" strokeWidth={2} />
                          Iniciar sesión para inscribirme
                        </>
                      ) : (
                        "Inscribirme"
                      )}
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {/* Registration error */}
          {registerError ? (
            <div className="mt-[var(--pb-space-4)] flex items-start gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] bg-[var(--pb-status-error)]/10 px-[var(--pb-space-4)] py-[var(--pb-space-3)] text-sm text-[var(--pb-status-error)]">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              <span>{registerError}</span>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function DetailCard({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  readonly icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>;
  readonly label: string;
  readonly value: string | null;
  readonly highlight?: boolean;
}) {
  return (
    <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
      <div className="flex items-center gap-[var(--pb-space-2)] text-sm text-[var(--pb-text-tertiary)]">
        <Icon aria-hidden="true" className="size-4" strokeWidth={2} />
        <span className="font-semibold uppercase tracking-[0.11em]">{label}</span>
      </div>
      <p
        className={`mt-[var(--pb-space-1)] text-lg font-bold ${
          highlight ? "text-[var(--pb-energy-clay)]" : "text-[var(--pb-text-primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <main className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)] py-[var(--pb-space-8)]">
      <div className="mx-auto max-w-[var(--pb-layout-max)] space-y-[var(--pb-space-6)]">
        <div className="h-6 w-48 animate-pulse rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)]" />
        <div className="h-48 animate-pulse rounded-[var(--pb-radius-xl)] bg-[var(--pb-surface-secondary)]" />
        <div className="grid gap-[var(--pb-space-6)] md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[var(--pb-radius-lg)] bg-[var(--pb-surface-secondary)]" />
          ))}
        </div>
        <div className="h-32 animate-pulse rounded-[var(--pb-radius-xl)] bg-[var(--pb-surface-secondary)]" />
      </div>
    </main>
  );
}

function NotFoundState() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)]">
      <section className="max-w-md rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-8)] text-center shadow-[var(--pb-shadow-card)]">
        <h1 className="text-[length:var(--pb-text-h2)] font-bold">Torneo no encontrado</h1>
        <p className="mt-[var(--pb-space-3)] text-[var(--pb-text-secondary)]">
          El torneo que buscas no existe o ha sido eliminado.
        </p>
        <Link
          className="mt-[var(--pb-space-5)] inline-flex min-h-11 items-center rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-5)] font-semibold text-[var(--pb-brand-foreground)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
          href="/buscar"
        >
          Volver al marketplace
        </Link>
      </section>
    </main>
  );
}

function ErrorState({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)]">
      <section className="max-w-md rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-8)] text-center shadow-[var(--pb-shadow-card)]">
        <h1 className="text-[length:var(--pb-text-h2)] font-bold">Error al cargar el torneo</h1>
        <p className="mt-[var(--pb-space-3)] text-[var(--pb-text-secondary)]">
          No pudimos cargar la información del torneo. Revisa tu conexión o inténtalo de nuevo.
        </p>
        <div className="mt-[var(--pb-space-5)] flex items-center justify-center gap-[var(--pb-space-3)]">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-5)] font-semibold text-[var(--pb-brand-foreground)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
          >
            Intentar de nuevo
          </button>
          <Link
            className="inline-flex min-h-11 items-center rounded-[var(--pb-radius-md)] border border-[var(--pb-border-subtle)] px-[var(--pb-space-5)] font-semibold text-[var(--pb-text-primary)] transition-colors hover:bg-[var(--pb-surface-secondary)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
            href="/buscar"
          >
            Volver
          </Link>
        </div>
      </section>
    </main>
  );
}
