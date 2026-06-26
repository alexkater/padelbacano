export default function AdminLoading() {
  return (
    <div className="space-y-[var(--pb-space-8)]">
      {/* Title */}
      <div className="pb-shimmer h-8 w-48 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-[var(--pb-space-4)] md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]"
            key={i}
          >
            <div className="pb-shimmer h-4 w-24 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
            <div className="pb-shimmer mt-[var(--pb-space-3)] h-8 w-16 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
            <div className="pb-shimmer mt-[var(--pb-space-2)] h-3 w-32 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-5)] shadow-[var(--pb-shadow-card)]">
        <div className="flex items-center justify-between">
          <div className="pb-shimmer h-6 w-40 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
          <div className="pb-shimmer h-5 w-24 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
        </div>
        <div className="mt-[var(--pb-space-5)] space-y-[var(--pb-space-3)]">
          {/* Table header */}
          <div className="flex gap-[var(--pb-space-4)] border-b border-[var(--pb-border-subtle)] pb-[var(--pb-space-3)]">
            <div className="pb-shimmer h-4 w-20 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
            <div className="pb-shimmer h-4 w-16 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
            <div className="pb-shimmer h-4 w-12 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
            <div className="pb-shimmer h-4 w-24 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 4 }, (_, i) => (
            <div className="flex gap-[var(--pb-space-4)] py-[var(--pb-space-2)]" key={i}>
              <div className="pb-shimmer h-4 w-20 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
              <div className="pb-shimmer h-4 w-16 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
              <div className="pb-shimmer h-4 w-12 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
              <div className="pb-shimmer h-4 w-24 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
