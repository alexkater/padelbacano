import type { Metadata } from "next";
import { MarketplaceSearchPanel } from "@/components/marketplace/search-panel";
import { Breadcrumbs } from "@/components/marketplace/breadcrumbs";
import { BadgeCheck, MapPin, SlidersHorizontal } from "lucide-react";

export const metadata: Metadata = {
  title: "Pádel en Colombia — Reserva tu cancha",
  description:
    "Busca canchas de pádel y tenis disponibles por ciudad, fecha y precio. Marketplace PádelBacano con clubes verificados en toda Colombia.",
  openGraph: {
    title: "Pádel en Colombia — Reserva tu cancha",
    description:
      "Busca canchas de pádel y tenis disponibles por ciudad, fecha y precio. Clubes verificados en toda Colombia.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "PádelBacano — Reserva tu cancha" }],
  },
};

export default function SearchPage() {
  return (
    <div className="bg-[var(--pb-surface-canvas)]">
      <section className="mx-auto max-w-[var(--pb-layout-wide)] px-[var(--pb-space-4)] pt-[var(--pb-space-8)] md:px-[var(--pb-space-6)] xl:px-[var(--pb-space-8)]">
        <Breadcrumbs items={[{ label: "Buscar" }]} />
      </section>
      <section className="mx-auto grid min-h-[calc(100dvh-8rem)] max-w-[var(--pb-layout-wide)] items-center gap-[var(--pb-space-10)] px-[var(--pb-space-4)] py-[var(--pb-space-12)] md:grid-cols-[0.9fr_1.1fr] md:px-[var(--pb-space-6)] md:py-[var(--pb-space-16)] xl:px-[var(--pb-space-8)]">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-full)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] py-[var(--pb-space-2)] text-[length:var(--pb-text-caption)] font-bold uppercase tracking-[0.11em] text-[var(--pb-brand-primary)] shadow-[var(--pb-shadow-card)]">
            <MapPin aria-hidden="true" className="size-4" strokeWidth={2} />
            Marketplace Colombia
          </p>
          <h1 className="mt-[var(--pb-space-6)] text-[length:var(--pb-text-display)] font-extrabold leading-[0.95] tracking-[-0.035em] text-[var(--pb-text-primary)]">
            Encuentra tu partido de pádel en Colombia
          </h1>
          <p className="mt-[var(--pb-space-5)] max-w-xl text-[length:var(--pb-text-body-lg)] leading-[1.6] text-[var(--pb-text-secondary)]">
            Filtra por ciudad, fecha, hora y deporte. Validamos disponibilidad con el marketplace antes de llevarte a resultados.
          </p>

          <div className="mt-[var(--pb-space-8)] grid gap-[var(--pb-space-3)] sm:grid-cols-3">
            <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
              <BadgeCheck aria-hidden="true" className="size-6 text-[var(--pb-trust-verified)]" strokeWidth={2} />
              <p className="mt-[var(--pb-space-3)] text-sm font-semibold text-[var(--pb-text-primary)]">Clubes verificados</p>
            </div>
            <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
              <SlidersHorizontal aria-hidden="true" className="size-6 text-[var(--pb-energy-clay)]" strokeWidth={2} />
              <p className="mt-[var(--pb-space-3)] text-sm font-semibold text-[var(--pb-text-primary)]">Filtros rápidos</p>
            </div>
            <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
              <MapPin aria-hidden="true" className="size-6 text-[var(--pb-brand-primary)]" strokeWidth={2} />
              <p className="mt-[var(--pb-space-3)] text-sm font-semibold text-[var(--pb-text-primary)]">Ciudades principales</p>
            </div>
          </div>
        </div>

        <MarketplaceSearchPanel />
      </section>
    </div>
  );
}
