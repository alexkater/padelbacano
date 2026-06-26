export default function ClubDetailLoading() {
  return (
    <main className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)] py-[var(--pb-space-8)] text-[var(--pb-text-primary)]">
      <div className="mx-auto max-w-[var(--pb-layout-max)] space-y-[var(--pb-space-6)]">
        {/* Breadcrumb */}
        <div className="pb-shimmer h-4 w-48 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />

        {/* Hero skeleton */}
        <div className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)] shadow-[var(--pb-shadow-card)]">
          <div className="flex flex-col gap-[var(--pb-space-4)] md:flex-row md:justify-between">
            <div className="space-y-[var(--pb-space-3)]">
              <div className="pb-shimmer h-4 w-32 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
              <div className="pb-shimmer h-8 w-64 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
              <div className="pb-shimmer h-5 w-48 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
              <div className="pb-shimmer h-4 w-full max-w-md rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
            </div>
            <div className="pb-shimmer h-24 w-44 rounded-[var(--pb-radius-lg)] bg-[var(--pb-surface-secondary)]" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid gap-[var(--pb-space-6)] lg:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-[var(--pb-space-4)]">
            <div className="pb-shimmer h-7 w-32 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
            {Array.from({ length: 3 }, (_, i) => (
              <div
                className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]"
                key={i}
              >
                <div className="flex flex-col gap-[var(--pb-space-3)] sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-[var(--pb-space-2)]">
                    <div className="pb-shimmer h-6 w-40 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
                    <div className="pb-shimmer h-4 w-64 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
                  </div>
                  <div className="pb-shimmer h-12 w-44 rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)]" />
                </div>
              </div>
            ))}
          </div>
          <aside className="space-y-[var(--pb-space-4)]">
            <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
              <div className="pb-shimmer h-6 w-24 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
              <div className="mt-[var(--pb-space-4)] space-y-[var(--pb-space-3)]">
                <div className="pb-shimmer h-4 w-full rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
                <div className="pb-shimmer h-4 w-full rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
                <div className="pb-shimmer h-4 w-3/4 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
              </div>
            </div>
            <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
              <div className="pb-shimmer h-6 w-36 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
              <div className="mt-[var(--pb-space-4)] space-y-[var(--pb-space-2)]">
                <div className="pb-shimmer h-4 w-full rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
                <div className="pb-shimmer h-4 w-2/3 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
              </div>
            </div>
          </aside>
        </div>

        {/* Availability skeleton */}
        <div className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)] shadow-[var(--pb-shadow-card)]">
          <div className="flex flex-col gap-[var(--pb-space-4)] md:flex-row md:items-end md:justify-between">
            <div className="space-y-[var(--pb-space-2)]">
              <div className="pb-shimmer h-7 w-36 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
              <div className="pb-shimmer h-4 w-48 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
            </div>
            <div className="pb-shimmer h-11 w-44 rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)]" />
          </div>
          <div className="mt-[var(--pb-space-5)] flex flex-wrap gap-[var(--pb-space-2)]">
            {Array.from({ length: 6 }, (_, i) => (
              <div className="pb-shimmer h-9 w-28 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
