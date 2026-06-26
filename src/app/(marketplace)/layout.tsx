import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { MarketplaceNav } from "@/components/marketplace/marketplace-nav";

export const metadata: Metadata = {
  title: {
    default: "Reserva tu cancha de pádel en Colombia — PádelBacano",
    template: "%s — PádelBacano",
  },
  description:
    "Marketplace de pádel en Colombia. Encuentra y reserva canchas verificadas por ciudad, fecha y precio. Torneos, escuela y más.",
  openGraph: {
    title: "PádelBacano — Marketplace de pádel en Colombia",
    description:
      "Encuentra y reserva canchas de pádel y tenis en Colombia. Clubes verificados, mejores precios y disponibilidad en tiempo real.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "PádelBacano Marketplace" }],
    locale: "es_CO",
    type: "website",
    siteName: "PádelBacano",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] text-[var(--pb-text-primary)]">
      <MarketplaceNav />

      <main>{children}</main>

      <footer className="border-t border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)]">
        <div className="mx-auto grid max-w-[var(--pb-layout-max)] gap-[var(--pb-space-6)] px-[var(--pb-space-4)] py-[var(--pb-space-8)] text-sm text-[var(--pb-text-secondary)] md:grid-cols-[1.4fr_1fr_1fr] md:px-[var(--pb-space-6)]">
          <div>
            <p className="font-semibold text-[var(--pb-text-primary)]">PádelBacano Colombia</p>
            <p className="mt-[var(--pb-space-2)] max-w-md">Marketplace para encontrar canchas verificadas, horarios disponibles y políticas claras antes de reservar.</p>
          </div>
          <div className="flex items-start gap-[var(--pb-space-2)]">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-[var(--pb-trust-verified)]" strokeWidth={2} />
            <p>Clubes y datos públicos revisados para una búsqueda confiable.</p>
          </div>
          <Link className="font-semibold text-[var(--pb-brand-primary)] hover:text-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]" href="/buscar">
            Buscar canchas
          </Link>
        </div>
      </footer>
    </div>
  );
}
