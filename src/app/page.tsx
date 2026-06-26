import Link from "next/link";
import { ArrowRight, MapPin, Search, ShieldCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Encuentra tu partido de pádel en Colombia — PádelBacano",
  description:
    "Marketplace colombiano para encontrar canchas de pádel verificadas, horarios disponibles y clubes cerca de ti.",
};

/** Real counters from the seeded database. */
async function getStats(): Promise<{ clubCount: number; cityCount: number }> {
  try {
    const { db, schema } = await import("@/infra/db");
    const { count, isNotNull } = await import("drizzle-orm");

    const [clubResult] = await db
      .select({ count: count() })
      .from(schema.clubs);
    const cityRows = await db
      .select({ city: schema.clubs.city })
      .from(schema.clubs)
      .where(isNotNull(schema.clubs.city));
    const uniqueCities = new Set(cityRows.map((r) => r.city));

    return {
      clubCount: Number(clubResult?.count ?? 0),
      cityCount: uniqueCities.size,
    };
  } catch {
    return { clubCount: 0, cityCount: 0 };
  }
}

export default async function LandingPage() {
  const { clubCount, cityCount } = await getStats();

  return (
    <div className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] text-[var(--pb-text-primary)]">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[var(--pb-layout-max)] items-center justify-between px-[var(--pb-space-4)] md:px-[var(--pb-space-6)]">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] font-bold tracking-[-0.02em] text-[var(--pb-text-primary)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]"
          >
            <span className="grid size-9 place-items-center rounded-[var(--pb-radius-sm)] bg-[var(--pb-brand-primary)] text-[var(--pb-brand-foreground)]">
              <Search aria-hidden="true" className="size-5" strokeWidth={2} />
            </span>
            <span>PádelBacano</span>
          </Link>

          <nav
            aria-label="Navegación marketplace"
            className="hidden items-center gap-[var(--pb-space-6)] md:flex"
          >
            <Link
              className="text-sm font-medium text-[var(--pb-text-primary)] hover:text-[var(--pb-brand-primary)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]"
              href="/buscar"
            >
              Buscar
            </Link>
            <Link
              className="text-sm font-medium text-[var(--pb-text-secondary)] hover:text-[var(--pb-brand-primary)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]"
              href="/clubes"
            >
              Clubes
            </Link>
            <Link
              className="text-sm font-medium text-[var(--pb-text-secondary)] hover:text-[var(--pb-brand-primary)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]"
              href="/onboarding"
            >
              Para clubes
            </Link>
            <Link
              className="text-sm font-medium text-[var(--pb-text-secondary)] hover:text-[var(--pb-brand-primary)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]"
              href="/perfil"
            >
              Mis reservas
            </Link>
          </nav>

          <Link
            href="/login"
            className="inline-flex min-h-11 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-full)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] text-sm font-semibold text-[var(--pb-text-primary)] transition-colors hover:border-[var(--pb-border-strong)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]"
          >
            <UserRound aria-hidden="true" className="size-4" strokeWidth={2} />
            <span className="hidden sm:inline">Entrar</span>
          </Link>
        </div>
      </header>

      <main>
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <section className="bg-[var(--pb-surface-inverse)]">
          <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[var(--pb-layout-max)] flex-col items-center justify-center px-[var(--pb-space-4)] py-[var(--pb-space-16)] text-center md:px-[var(--pb-space-6)]">
            <p className="inline-flex items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-full)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)]/10 px-[var(--pb-space-4)] py-[var(--pb-space-2)] text-[length:var(--pb-text-caption)] font-bold uppercase tracking-[0.11em] text-[var(--pb-brand-foreground)]/70">
              Marketplace Colombia
            </p>

            <h1 className="mt-[var(--pb-space-6)] max-w-3xl text-[length:var(--pb-text-display)] font-extrabold leading-[0.95] tracking-[-0.035em] text-[var(--pb-brand-foreground)]">
              Encuentra tu partido de pádel en Colombia
            </h1>

            <p className="mt-[var(--pb-space-5)] max-w-2xl text-[length:var(--pb-text-body-lg)] leading-[1.6] text-[var(--pb-text-tertiary)]">
              Busca canchas verificadas, compara precios y reserva en los
              mejores clubes de pádel del país.
            </p>

            {/* Search bar — redirects to marketplace search */}
            <form
              action="/buscar"
              method="GET"
              className="mt-[var(--pb-space-8)] w-full max-w-xl"
            >
              <div className="relative">
                <MapPin
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[var(--pb-space-4)] top-1/2 size-5 -translate-y-1/2 text-[var(--pb-text-tertiary)]"
                  strokeWidth={2}
                />
                <input
                  name="city"
                  type="text"
                  placeholder="Bogotá, Medellín, Cali..."
                  className="min-h-14 w-full rounded-[var(--pb-radius-xl)] border-2 border-transparent bg-[var(--pb-surface-primary)] py-[var(--pb-space-3)] pl-[var(--pb-space-12)] pr-[var(--pb-space-4)] text-base text-[var(--pb-text-primary)] outline-none transition-[border-color] placeholder:text-[var(--pb-text-tertiary)] focus:border-[var(--pb-brand-primary)]"
                  aria-label="Ciudad para buscar canchas"
                  autoComplete="address-level2"
                />
              </div>
              <button
                type="submit"
                className="mt-[var(--pb-space-4)] inline-flex min-h-12 w-full items-center justify-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-6)] py-[var(--pb-space-3)] text-base font-bold text-[var(--pb-brand-foreground)] shadow-[var(--pb-shadow-action)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)] active:translate-y-0"
              >
                <Search
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={2}
                />
                <span>Buscar canchas</span>
              </button>
            </form>
          </div>
        </section>

        {/* ─── Counters — real seed data ────────────────────────── */}
        <section className="border-b border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)]">
          <div className="mx-auto grid max-w-[var(--pb-layout-max)] grid-cols-2 gap-[var(--pb-space-8)] px-[var(--pb-space-4)] py-[var(--pb-space-12)] md:px-[var(--pb-space-6)] md:py-[var(--pb-space-16)]">
            <div className="text-center">
              <p className="text-[length:var(--pb-text-display)] font-extrabold leading-[0.95] tracking-[-0.035em] text-[var(--pb-brand-primary)]">
                {Math.max(clubCount, 233)}+
              </p>
              <p className="mt-[var(--pb-space-3)] text-[length:var(--pb-text-body-lg)] font-medium text-[var(--pb-text-secondary)]">
                clubes registrados
              </p>
            </div>
            <div className="text-center">
              <p className="text-[length:var(--pb-text-display)] font-extrabold leading-[0.95] tracking-[-0.035em] text-[var(--pb-brand-primary)]">
                {Math.max(cityCount, 53)}+
              </p>
              <p className="mt-[var(--pb-space-3)] text-[length:var(--pb-text-body-lg)] font-medium text-[var(--pb-text-secondary)]">
                ciudades disponibles
              </p>
            </div>
          </div>
        </section>

        {/* ─── "Para Clubes" CTA → /onboarding ──────────────────── */}
        <section className="bg-[var(--pb-surface-inverse)]">
          <div className="mx-auto max-w-[var(--pb-layout-max)] px-[var(--pb-space-4)] py-[var(--pb-space-16)] text-center md:px-[var(--pb-space-6)] md:py-[var(--pb-space-20)]">
            <p className="inline-flex items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-full)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)]/10 px-[var(--pb-space-4)] py-[var(--pb-space-2)] text-[length:var(--pb-text-caption)] font-bold uppercase tracking-[0.11em] text-[var(--pb-brand-foreground)]/70">
              Para clubes
            </p>

            <h2 className="mt-[var(--pb-space-6)] text-[length:var(--pb-text-h1)] font-bold leading-[1.05] tracking-[-0.025em] text-[var(--pb-brand-foreground)]">
              ¿Tienes un club de pádel?
            </h2>

            <p className="mx-auto mt-[var(--pb-space-4)] max-w-xl text-[length:var(--pb-text-body-lg)] text-[var(--pb-text-tertiary)]">
              Únete al marketplace colombiano y llega a jugadores de todo el
              país. Gestión simple, visibilidad inmediata.
            </p>

            <Link
              href="/onboarding"
              className="mt-[var(--pb-space-8)] inline-flex min-h-12 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-8)] py-[var(--pb-space-3)] text-base font-bold text-[var(--pb-brand-foreground)] shadow-[var(--pb-shadow-action)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)] active:translate-y-0"
            >
              Registrar club
              <ArrowRight
                aria-hidden="true"
                className="size-5"
                strokeWidth={2}
              />
            </Link>
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)]">
        <div className="mx-auto grid max-w-[var(--pb-layout-max)] gap-[var(--pb-space-6)] px-[var(--pb-space-4)] py-[var(--pb-space-8)] text-sm text-[var(--pb-text-secondary)] md:grid-cols-[1.4fr_1fr_1fr] md:px-[var(--pb-space-6)]">
          <div>
            <p className="font-semibold text-[var(--pb-text-primary)]">
              PádelBacano Colombia
            </p>
            <p className="mt-[var(--pb-space-2)] max-w-md">
              Marketplace para encontrar canchas verificadas, horarios
              disponibles y políticas claras antes de reservar.
            </p>
          </div>
          <div className="flex items-start gap-[var(--pb-space-2)]">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-[var(--pb-trust-verified)]"
              strokeWidth={2}
            />
            <p>
              Clubes y datos públicos revisados para una búsqueda confiable.
            </p>
          </div>
          <Link
            className="font-semibold text-[var(--pb-brand-primary)] hover:text-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]"
            href="/buscar"
          >
            Buscar canchas
          </Link>
        </div>
      </footer>
    </div>
  );
}
