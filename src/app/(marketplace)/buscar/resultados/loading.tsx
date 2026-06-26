export default function SearchResultsLoading() {
  return (
    <main className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)] py-[var(--pb-space-10)] text-[var(--pb-text-primary)]">
      <section className="mx-auto w-full max-w-[var(--pb-layout-wide)] space-y-[var(--pb-space-8)]">
        {/* Header skeleton */}
        <div className="rounded-[var(--pb-radius-xl)] bg-[var(--pb-surface-inverse)] p-[var(--pb-space-6)] md:p-[var(--pb-space-8)]">
          <div className="pb-shimmer h-4 w-40 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
          <div className="pb-shimmer mt-[var(--pb-space-3)] h-10 w-3/4 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
          <div className="pb-shimmer mt-[var(--pb-space-3)] h-5 w-1/2 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
        </div>

        {/* Results skeleton grid */}
        <div className="flex items-center justify-between gap-[var(--pb-space-4)]">
          <div className="pb-shimmer h-5 w-32 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
        </div>
        <div className="grid gap-[var(--pb-space-4)] md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)] shadow-[var(--pb-shadow-card)]"
              key={index}
            >
              <div className="pb-shimmer h-4 w-24 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
              <div className="pb-shimmer mt-[var(--pb-space-3)] h-7 w-3/4 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
              <div className="pb-shimmer mt-[var(--pb-space-5)] h-10 rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)]" />
              <div className="pb-shimmer mt-[var(--pb-space-3)] h-10 rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)]" />
              <div className="pb-shimmer mt-[var(--pb-space-5)] h-16 rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)]" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
