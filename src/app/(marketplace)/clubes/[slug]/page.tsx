"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { Breadcrumbs } from "@/components/marketplace/breadcrumbs";
import type { ClubPublicDetail, CourtAvailabilitySlot } from "@/core/entities/marketplace";
import type { ReactNode } from "react";

const slotSchema = z.object({
  courtId: z.string(),
  courtName: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  priceInCents: z.number(),
  isPeak: z.boolean(),
  isAvailable: z.boolean(),
});

const availabilitySchema = z.object({
  success: z.literal(true),
  data: z.array(z.object({ courtId: z.string(), slots: z.array(slotSchema) })),
});

const clubSchema = z.object({ success: z.literal(true), data: z.custom<ClubPublicDetail>() });

type Params = { readonly params: Promise<{ readonly slug: string }> };

function todayInBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function formatCop(cents: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(cents / 100);
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function surfaceLabel(value: string): string {
  const labels: Record<string, string> = { glass: "Cristal", panoramic: "Panorámica", wall: "Muro" };
  return labels[value] ?? value;
}

export default function ClubDetailPage({ params }: Params) {
  const { slug } = use(params);
  const [club, setClub] = useState<ClubPublicDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayInBogota());
  const [slots, setSlots] = useState<readonly CourtAvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CourtAvailabilitySlot | null>(null);

  useEffect(() => {
    let active = true;
    async function loadClub(): Promise<void> {
      const response = await fetch(`/api/marketplace/clubs/${encodeURIComponent(slug)}`);
      if (!response.ok) {
        if (active) setStatus("missing");
        return;
      }
      const payload = clubSchema.parse(await response.json());
      if (!active) return;
      setClub(payload.data);
      setSelectedCourtId(payload.data.courts[0]?.id ?? null);
      setStatus("ready");
    }
    loadClub().catch(() => {
      if (active) setStatus("missing");
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const loadAvailability = useCallback(async (courtId: string = selectedCourtId ?? "") => {
    if (!club || !courtId) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    const query = new URLSearchParams({ clubId: club.id, date: selectedDate });
    try {
      const response = await fetch(`/api/marketplace/availability?${query.toString()}`);
      if (!response.ok) return;
      const payload = availabilitySchema.parse(await response.json());
      const court = payload.data.find((item) => item.courtId === courtId);
      setSlots(court?.slots.filter((slot) => slot.isAvailable) ?? []);
    } finally {
      setSlotsLoading(false);
    }
  }, [club, selectedCourtId, selectedDate]);

  if (status === "loading") return <ClubSkeleton />;
  if (status === "missing" || !club) return <NotFoundState />;

  const selectedCourt = club.courts.find((court) => court.id === selectedCourtId) ?? club.courts[0];

  return (
    <main className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)] py-[var(--pb-space-8)] text-[var(--pb-text-primary)]">
      <div className="mx-auto max-w-[var(--pb-layout-max)] space-y-[var(--pb-space-8)]">
        <Breadcrumbs items={[{ label: "Buscar", href: "/buscar" }, { label: club.city }, { label: club.name }]} />
        <header className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)] shadow-[var(--pb-shadow-card)]">
          <div className="flex flex-col gap-[var(--pb-space-6)] md:flex-row md:items-start md:justify-between">
            <div className="space-y-[var(--pb-space-4)]">
              <div className="flex flex-wrap items-center gap-[var(--pb-space-3)]">
                <h1 className="text-[length:var(--pb-text-h1)] font-[750] leading-[1.05] tracking-[-0.025em]">{club.name}</h1>
                {club.isVerified ? <VerifiedBadge /> : null}
              </div>
              <p className="text-lg text-[var(--pb-text-secondary)]">{club.city}, Colombia · {club.courtCount} canchas</p>
              {club.description ? <p className="max-w-3xl text-base leading-7 text-[var(--pb-text-secondary)]">{club.description}</p> : null}
            </div>
            <div className="rounded-[var(--pb-radius-lg)] bg-[var(--pb-surface-secondary)] p-[var(--pb-space-5)] text-sm text-[var(--pb-text-secondary)]">
              <p className="font-semibold text-[var(--pb-text-primary)]">Desde {formatCop(club.minPriceCents)}</p>
              <p>{club.openingHours}</p>
            </div>
          </div>
        </header>
        <section className="grid gap-[var(--pb-space-6)] lg:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-[var(--pb-space-4)]">
            <h2 className="text-[length:var(--pb-text-h2)] font-bold tracking-[-0.02em]">Canchas</h2>
            {club.courts.map((court) => (
              <article key={court.id} className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
                <div className="flex flex-col gap-[var(--pb-space-4)] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{court.name}</h3>
                    <p className="text-sm text-[var(--pb-text-secondary)]">Tipo: Pádel · Superficie: {surfaceLabel(court.courtType)} · {court.indoor ? "Cubierta" : "Exterior"} · Iluminación disponible</p>
                  </div>
                  <button className="min-h-12 rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-5)] font-semibold text-[var(--pb-brand-foreground)] shadow-[var(--pb-shadow-action)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]" onClick={() => { setSelectedCourtId(court.id); void loadAvailability(court.id); }} type="button">
                    Ver disponibilidad
                  </button>
                </div>
              </article>
            ))}
          </div>
          <aside className="space-y-[var(--pb-space-4)]">
            <InfoCard title="Precios">
              <dl className="space-y-[var(--pb-space-3)] text-sm">
                <PriceRow label="Lun-Vie horario valle" value={formatCop(club.pricing.offPeakPriceCents)} />
                <PriceRow label="Lun-Vie horario pico" value={formatCop(club.pricing.peakPriceCents)} />
                <p className="text-[var(--pb-text-secondary)]">Precios por franja en {club.pricing.currency}. IVA y cargos se muestran antes de confirmar.</p>
              </dl>
            </InfoCard>
            <InfoCard title="Política de cancelación">
              <p className="text-sm leading-6 text-[var(--pb-text-secondary)]">{club.cancellationPolicy.summary}</p>
              <p className="mt-[var(--pb-space-2)] text-xs text-[var(--pb-text-tertiary)]">Cancelación gratuita hasta {club.cancellationPolicy.minHoursBefore} h antes. Penalización tardía: {club.cancellationPolicy.penaltyPercent}%.</p>
            </InfoCard>
          </aside>
        </section>
        <section className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)] shadow-[var(--pb-shadow-card)]">
          <div className="flex flex-col gap-[var(--pb-space-4)] md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-[length:var(--pb-text-h2)] font-bold tracking-[-0.02em]">Disponibilidad</h2>
              <p className="text-sm text-[var(--pb-text-secondary)]">{selectedCourt ? selectedCourt.name : "Selecciona una cancha"} · Horarios en COT</p>
            </div>
            <label className="text-sm font-semibold">Fecha
              <input className="mt-[var(--pb-space-1)] block min-h-11 rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]" min={todayInBogota()} onChange={(event) => setSelectedDate(event.target.value)} type="date" value={selectedDate} />
            </label>
          </div>
          <div className="mt-[var(--pb-space-5)] flex flex-wrap gap-[var(--pb-space-2)]">
            {slotsLoading ? <SpinnerLabel /> : null}
            {!slotsLoading && slots.length === 0 ? <p className="text-sm text-[var(--pb-text-secondary)]">Pulsa “Ver disponibilidad” para consultar horarios disponibles.</p> : null}
            {slots.map((slot) => {
              const selected = selectedSlot?.startTime === slot.startTime && selectedSlot.courtId === slot.courtId;
              return <button className={`rounded-[var(--pb-radius-sm)] border px-[var(--pb-space-3)] py-[var(--pb-space-2)] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)] ${selected ? "border-[var(--pb-brand-primary)] bg-[var(--pb-brand-primary)] text-[var(--pb-brand-foreground)]" : "border-[var(--pb-border-strong)] bg-[var(--pb-surface-secondary)] text-[var(--pb-text-primary)] hover:border-[var(--pb-brand-primary)]"}`} key={`${slot.courtId}-${slot.startTime}`} onClick={() => setSelectedSlot(slot)} type="button">{formatTime(slot.startTime)} · {formatCop(slot.priceInCents)}</button>;
            })}
          </div>
          {selectedSlot ? <Link className="mt-[var(--pb-space-5)] inline-flex min-h-12 items-center rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-6)] font-semibold text-[var(--pb-brand-foreground)] shadow-[var(--pb-shadow-action)] hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]" href={`/reservar?clubId=${club.id}&courtId=${selectedSlot.courtId}&startTime=${encodeURIComponent(selectedSlot.startTime)}`}>Reservar cancha</Link> : null}
        </section>
      </div>
    </main>
  );
}

function VerifiedBadge() {
  return <span className="inline-flex items-center rounded-[var(--pb-radius-full)] bg-[var(--pb-trust-verified)] px-[var(--pb-space-3)] py-[var(--pb-space-1)] text-xs font-bold text-[var(--pb-brand-foreground)]">Club verificado</span>;
}

function PriceRow({ label, value }: { readonly label: string; readonly value: string }) {
  return <div className="flex items-center justify-between gap-[var(--pb-space-4)]"><dt className="text-[var(--pb-text-secondary)]">{label}</dt><dd className="font-bold text-[var(--pb-energy-clay)]">{value}</dd></div>;
}

function InfoCard({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return <section className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]"><h2 className="mb-[var(--pb-space-3)] text-xl font-bold">{title}</h2>{children}</section>;
}

function SpinnerLabel() {
  return <p className="inline-flex items-center gap-[var(--pb-space-2)] text-sm text-[var(--pb-text-secondary)]"><span className="h-4 w-4 animate-spin rounded-[var(--pb-radius-full)] border-2 border-[var(--pb-border-strong)] border-t-[var(--pb-brand-primary)]" />Cargando horarios…</p>;
}

function ClubSkeleton() {
  return <main className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)] py-[var(--pb-space-8)]"><div className="mx-auto max-w-[var(--pb-layout-max)] space-y-[var(--pb-space-6)]"><div className="h-64 animate-pulse rounded-[var(--pb-radius-xl)] bg-[var(--pb-surface-secondary)]" /><div className="grid gap-[var(--pb-space-6)] lg:grid-cols-2"><div className="h-48 animate-pulse rounded-[var(--pb-radius-lg)] bg-[var(--pb-surface-secondary)]" /><div className="h-48 animate-pulse rounded-[var(--pb-radius-lg)] bg-[var(--pb-surface-secondary)]" /></div></div></main>;
}

function NotFoundState() {
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)]"><section className="max-w-md rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-8)] text-center shadow-[var(--pb-shadow-card)]"><h1 className="text-[length:var(--pb-text-h2)] font-bold">Club no encontrado</h1><p className="mt-[var(--pb-space-3)] text-[var(--pb-text-secondary)]">Revisa el enlace o vuelve al marketplace para buscar canchas disponibles.</p><Link className="mt-[var(--pb-space-5)] inline-flex min-h-11 items-center rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-5)] font-semibold text-[var(--pb-brand-foreground)]" href="/clubes">Volver a clubes</Link></section></main>;
}
