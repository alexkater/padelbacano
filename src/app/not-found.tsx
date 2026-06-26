import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Página no encontrada — PádelBacano",
  description: "La página que buscas no existe. Vuelve al marketplace de pádel en Colombia.",
};

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)]">
      <section className="w-full max-w-lg text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]">
          <MapPin aria-hidden="true" className="size-10 text-[var(--pb-text-tertiary)]" strokeWidth={1.5} />
        </div>

        <h1 className="mt-[var(--pb-space-6)] text-[length:var(--pb-text-display)] font-extrabold leading-[0.95] tracking-[-0.035em] text-[var(--pb-text-primary)]">
          404
        </h1>
        <p className="mt-[var(--pb-space-3)] text-[length:var(--pb-text-h3)] font-semibold text-[var(--pb-text-primary)]">
          Página no encontrada
        </p>
        <p className="mx-auto mt-[var(--pb-space-3)] max-w-md text-[length:var(--pb-text-body)] text-[var(--pb-text-secondary)]">
          La página que buscas no existe o fue movida. Revisa el enlace o vuelve al marketplace para encontrar canchas disponibles.
        </p>

        <div className="mt-[var(--pb-space-8)] flex flex-col items-center justify-center gap-[var(--pb-space-3)] sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-6)] font-semibold text-[var(--pb-brand-foreground)] shadow-[var(--pb-shadow-action)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
            href="/buscar"
          >
            <Search aria-hidden="true" className="size-5" strokeWidth={2} />
            Buscar canchas
          </Link>
          <Link
            className="inline-flex min-h-12 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-6)] font-semibold text-[var(--pb-text-primary)] transition-colors hover:bg-[var(--pb-surface-secondary)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
            href="/"
          >
            Ir al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
