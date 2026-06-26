"use client";

import type { ReactNode } from "react";

type KpiCardProps = {
  label: string;
  value: string;
  sub?: string;
  accent: "green" | "clay" | "yellow" | "blue";
  icon: ReactNode;
  change?: number | null;
};

const accentMap = {
  green: {
    bg: "bg-[var(--pb-brand-primary)]/8",
    text: "text-[var(--pb-brand-primary)]",
    bar: "bg-[var(--pb-brand-primary)]",
  },
  clay: {
    bg: "bg-[var(--pb-energy-clay)]/8",
    text: "text-[var(--pb-energy-clay)]",
    bar: "bg-[var(--pb-energy-clay)]",
  },
  yellow: {
    bg: "bg-[var(--pb-energy-yellow)]/8",
    text: "text-[var(--pb-energy-yellow)]",
    bar: "bg-[var(--pb-energy-yellow)]",
  },
  blue: {
    bg: "bg-[var(--pb-trust-verified)]/8",
    text: "text-[var(--pb-trust-verified)]",
    bar: "bg-[var(--pb-trust-verified)]",
  },
};

export function KpiCard({ label, value, sub, accent, icon, change }: KpiCardProps) {
  const a = accentMap[accent];

  let changeEl = null;
  if (change !== undefined && change !== null) {
    const isPos = change > 0;
    const isNeutral = change === 0;
    const color = isNeutral ? "text-[var(--pb-text-tertiary)]" : isPos ? "text-green-600" : "text-red-600";
    const arrow = isNeutral ? "" : isPos ? "▲" : "▼";
    changeEl = (
      <span className={`text-xs font-medium ${color} ml-1.5`}>
        {arrow} {Math.abs(change)}%
      </span>
    );
  }

  return (
    <div
      className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-5 shadow-[var(--pb-shadow-card)]"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[var(--pb-text-caption)] font-[550] uppercase tracking-[0.11em] text-[var(--pb-text-secondary)]">
          {label}
        </span>
        <span className={`${a.bg} ${a.text} rounded-[var(--pb-radius-sm)] p-1.5`}>
          {icon}
        </span>
      </div>
      <p className="text-2xl font-bold text-[var(--pb-text-primary)] tracking-tight">
        {value}
      </p>
      {(sub || changeEl) && (
        <p className="text-xs text-[var(--pb-text-tertiary)] mt-0.5 flex items-center">
          {sub && <span>{sub}</span>}
          {changeEl}
        </p>
      )}
      <div className={`mt-3 h-1 w-full rounded-[var(--pb-radius-xs)] ${a.bg}`}>
        <div className={`h-full w-2/3 rounded-[var(--pb-radius-xs)] ${a.bar} opacity-60`} />
      </div>
    </div>
  );
}
