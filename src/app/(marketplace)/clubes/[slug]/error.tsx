"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ClubDetailError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error("Club detail error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)]">
      <section className="w-full max-w-md rounded-[var(--pb-radius-xl)] border border-[var(--pb-status-error)]/20 bg-[var(--pb-surface-primary)] p-[var(--pb-space-8)] text-center shadow-[var(--pb-shadow-card)]">
        <div className="mx-auto grid size-14 place-items-center rounded-[var(--pb-radius-full)] bg-[var(--pb-status-error)]/10">
          <AlertTriangle aria-hidden="true" className="size-7 text-[var(--pb-status-error)]" strokeWidth={2} />
        </div>
        <h1 className="mt-[var(--pb-space-5)] text-[length:var(--pb-text-h2)] font-bold text-[var(--pb-text-primary)]">
          Club no disponible
        </h1>
        <p className="mt-[var(--pb-space-3)] text-[length:var(--pb-text-body)] text-[var(--pb-text-secondary)]">
          No pudimos cargar la información del club. Intenta de nuevo o vuelve al marketplace.
        </p>
        <div className="mt-[var(--pb-space-6)] flex flex-col gap-[var(--pb-space-3)] sm:flex-row sm:justify-center">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-6)] font-semibold text-[var(--pb-brand-foreground)] shadow-[var(--pb-shadow-action)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
            onClick={reset}
            type="button"
          >
            Reintentar
          </button>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-6)] font-semibold text-[var(--pb-text-primary)] transition-colors hover:bg-[var(--pb-surface-secondary)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
            href="/buscar"
          >
            Buscar canchas
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-[var(--pb-space-4)] text-[length:var(--pb-text-caption)] text-[var(--pb-text-tertiary)]">
            Error {error.digest}
          </p>
        ) : null}
      </section>
    </main>
  );
}
