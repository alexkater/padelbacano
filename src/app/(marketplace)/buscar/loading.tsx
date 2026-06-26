import { MapPin, SlidersHorizontal, BadgeCheck } from "lucide-react";

export default function SearchLoading() {
  return (
    <div className="bg-[var(--pb-surface-canvas)]">
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[var(--pb-layout-wide)] items-center gap-[var(--pb-space-10)] px-[var(--pb-space-4)] py-[var(--pb-space-12)] md:grid-cols-[0.9fr_1.1fr] md:px-[var(--pb-space-6)] md:py-[var(--pb-space-16)] xl:px-[var(--pb-space-8)]">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-full)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] py-[var(--pb-space-2)] shadow-[var(--pb-shadow-card)]">
            <MapPin aria-hidden="true" className="size-4 text-[var(--pb-brand-primary)]" strokeWidth={2} />
            <span className="text-[length:var(--pb-text-caption)] font-bold uppercase tracking-[0.11em] text-[var(--pb-brand-primary)]">
              Marketplace Colombia
            </span>
          </div>

          <div className="mt-[var(--pb-space-6)] space-y-[var(--pb-space-3)]">
            <div className="pb-shimmer h-16 w-full max-w-xl rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)]" />
            <div className="pb-shimmer h-5 w-3/4 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
          </div>

          <div className="mt-[var(--pb-space-8)] grid gap-[var(--pb-space-3)] sm:grid-cols-3">
            {[
              { icon: BadgeCheck, color: "var(--pb-trust-verified)" },
              { icon: SlidersHorizontal, color: "var(--pb-energy-clay)" },
              { icon: MapPin, color: "var(--pb-brand-primary)" },
            ].map((item, index) => (
              <div
                className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]"
                key={index}
              >
                <item.icon aria-hidden="true" className="size-6" color={item.color} strokeWidth={2} />
                <div className="pb-shimmer mt-[var(--pb-space-3)] h-4 w-24 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)] shadow-[var(--pb-shadow-card)]">
          <div className="pb-shimmer h-8 w-32 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
          <div className="mt-[var(--pb-space-6)] space-y-[var(--pb-space-4)]">
            {Array.from({ length: 3 }, (_, i) => (
              <div className="pb-shimmer h-12 w-full rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)]" key={i} />
            ))}
          </div>
          <div className="pb-shimmer mt-[var(--pb-space-6)] h-12 w-full rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)]" />
        </div>
      </section>
    </div>
  );
}
