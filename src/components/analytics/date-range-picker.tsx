"use client";

import { useCallback } from "react";

export type DateRange = {
  from: string;
  to: string;
};

export type ComparisonRange = {
  from: string;
  to: string;
};

type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onComparisonChange?: (range: ComparisonRange) => void;
};

const presets = [
  { label: "7 d", days: 7 },
  { label: "30 d", days: 30 },
  { label: "90 d", days: 90 },
] as const;

function dateToInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthStartStr(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 10);
}

function monthEndStr(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset + 1);
  d.setDate(0);
  return d.toISOString().slice(0, 10);
}

export function DateRangePicker({ value, onChange, onComparisonChange }: DateRangePickerProps) {
  const setPreset = useCallback(
    (days: number) => {
      const to = new Date();
      const from = new Date(Date.now() - days * 86_400_000);
      onChange({ from: dateToInput(from), to: dateToInput(to) });
      if (onComparisonChange) {
        const compareFrom = new Date(Date.now() - days * 2 * 86_400_000);
        const compareTo = new Date(Date.now() - days * 86_400_000);
        onComparisonChange({ from: dateToInput(compareFrom), to: dateToInput(compareTo) });
      }
    },
    [onChange, onComparisonChange],
  );

  const setThisMonth = useCallback(() => {
    const to = dateToInput(new Date());
    onChange({ from: monthStartStr(0), to });
    if (onComparisonChange) {
      onComparisonChange({ from: monthStartStr(-1), to: monthEndStr(-1) });
    }
  }, [onChange, onComparisonChange]);

  const setLastMonth = useCallback(() => {
    const from = monthStartStr(-1);
    const to = monthEndStr(-1);
    onChange({ from, to });
    if (onComparisonChange) {
      onComparisonChange({ from: monthStartStr(-2), to: monthEndStr(-2) });
    }
  }, [onChange, onComparisonChange]);

  const daysDiff = value.from
    ? Math.round(
        (new Date(value.to).getTime() - new Date(value.from).getTime()) /
          86_400_000,
      )
    : 0;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1">
        {presets.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => setPreset(p.days)}
            className={`px-3 py-1.5 text-xs font-[550] rounded-[var(--pb-radius-sm)] border transition-colors ${
              daysDiff === p.days
                ? "bg-[var(--pb-brand-primary)] text-[var(--pb-brand-foreground)] border-[var(--pb-brand-primary)]"
                : "bg-[var(--pb-surface-primary)] text-[var(--pb-text-secondary)] border-[var(--pb-border-subtle)] hover:border-[var(--pb-border-strong)]"
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="w-px h-5 bg-[var(--pb-border-subtle)] mx-1" />
        <button
          type="button"
          onClick={setThisMonth}
          className="px-3 py-1.5 text-xs font-[550] rounded-[var(--pb-radius-sm)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] text-[var(--pb-text-secondary)] hover:border-[var(--pb-border-strong)] transition-colors"
        >
          Este mes
        </button>
        <button
          type="button"
          onClick={setLastMonth}
          className="px-3 py-1.5 text-xs font-[550] rounded-[var(--pb-radius-sm)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] text-[var(--pb-text-secondary)] hover:border-[var(--pb-border-strong)] transition-colors"
        >
          Mes pasado
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="sr-only">Desde</label>
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="h-9 px-2.5 text-sm rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] text-[var(--pb-text-primary)]"
        />
        <span className="text-xs text-[var(--pb-text-tertiary)]">—</span>
        <label className="sr-only">Hasta</label>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="h-9 px-2.5 text-sm rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] text-[var(--pb-text-primary)]"
        />
      </div>
    </div>
  );
}
