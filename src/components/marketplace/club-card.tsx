import Link from "next/link";
import type { ClubSearchResult } from "@/core/entities/marketplace";
import { cn } from "@/lib/utils";

type ClubCardProps = {
  readonly club: ClubSearchResult;
  readonly className?: string;
};

const copFormatter = new Intl.NumberFormat("es-CO", {
  currency: "COP",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  style: "currency",
});

const slotFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "America/Bogota",
});

function formatCop(cents: number): string {
  return copFormatter.format(cents / 100).replace("$", "COP ");
}

function formatSlot(slot: string | null): string {
  if (slot === null) {
    return "Sin horario disponible para esta fecha";
  }

  return `${slotFormatter.format(new Date(slot))} COT`;
}

function courtCountLabel(count: number): string {
  return count === 1 ? "1 cancha" : `${count} canchas`;
}

function VerifiedMark() {
  return (
    <span className="inline-flex items-center gap-[var(--pb-space-1)] rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)] px-[var(--pb-space-2)] py-[var(--pb-space-1)] text-[length:var(--pb-text-caption)] font-semibold text-[var(--pb-trust-verified)]">
      <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 3.75 18.25 6v4.75c0 4.1-2.5 7.8-6.25 9.5-3.75-1.7-6.25-5.4-6.25-9.5V6L12 3.75Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="m9 12.1 2 2 4.1-4.35"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
      Club verificado
    </span>
  );
}

export function ClubCard({ club, className }: ClubCardProps) {
  return (
    <Link
      aria-label={`Ver detalle de ${club.name}`}
      className={cn(
        "group block rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)] shadow-[var(--pb-shadow-card)] transition-[transform,border-color,box-shadow] duration-[var(--pb-motion-standard)] ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-0.5 hover:border-[var(--pb-border-strong)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]",
        className
      )}
      href={`/clubes/${club.slug}`}
    >
      <article className="flex h-full flex-col gap-[var(--pb-space-5)]">
        <header className="space-y-[var(--pb-space-3)]">
          <div className="flex items-start justify-between gap-[var(--pb-space-3)]">
            <div className="min-w-0">
              <p className="text-[length:var(--pb-text-caption)] font-bold uppercase tracking-[0.11em] text-[var(--pb-text-tertiary)]">
                {club.city}
              </p>
              <h2 className="mt-[var(--pb-space-1)] text-[length:var(--pb-text-h3)] font-bold leading-tight tracking-[-0.01em] text-[var(--pb-text-primary)]">
                {club.name}
              </h2>
            </div>
            <span className="rounded-[var(--pb-radius-full)] border border-[var(--pb-border-subtle)] px-[var(--pb-space-2)] py-[var(--pb-space-1)] text-[length:var(--pb-text-caption)] font-semibold text-[var(--pb-text-secondary)]">
              {club.courtTypes.join(" · ")}
            </span>
          </div>
          {club.isVerified ? <VerifiedMark /> : null}
        </header>

        <dl className="grid gap-[var(--pb-space-3)] text-[length:var(--pb-text-body-sm)]">
          <div className="flex items-center justify-between gap-[var(--pb-space-3)] rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)] px-[var(--pb-space-3)] py-[var(--pb-space-2)]">
            <dt className="font-medium text-[var(--pb-text-secondary)]">Canchas</dt>
            <dd className="font-semibold text-[var(--pb-text-primary)]">{courtCountLabel(club.courtCount)}</dd>
          </div>
          <div className="flex items-center justify-between gap-[var(--pb-space-3)] rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)] px-[var(--pb-space-3)] py-[var(--pb-space-2)]">
            <dt className="font-medium text-[var(--pb-text-secondary)]">Precio</dt>
            <dd className="font-bold text-[var(--pb-energy-clay)]">desde {formatCop(club.minPriceCents)}</dd>
          </div>
        </dl>

        <div className="mt-auto rounded-[var(--pb-radius-md)] border border-[var(--pb-border-subtle)] p-[var(--pb-space-3)]">
          <p className="text-[length:var(--pb-text-caption)] font-bold uppercase tracking-[0.11em] text-[var(--pb-text-tertiary)]">
            Próximo horario
          </p>
          <p className="mt-[var(--pb-space-1)] text-[length:var(--pb-text-body-sm)] font-semibold text-[var(--pb-text-primary)]">
            {formatSlot(club.nextAvailableSlot)}
          </p>
        </div>
      </article>
    </Link>
  );
}
