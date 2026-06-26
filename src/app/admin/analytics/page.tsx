"use client";

import { useCallback, useEffect, useState } from "react";
import { MODULE_FLAGS } from "@/padelbacano.config";
import { KpiCard } from "@/components/analytics/kpi-card";
import { RevenueChart } from "@/components/analytics/revenue-chart";
import { OccupancyChart } from "@/components/analytics/occupancy-chart";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import type { DateRange, ComparisonRange } from "@/components/analytics/date-range-picker";
import {
  CalendarDays,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";

// ─── Types matching the T50 API response ─────────────────────────────

type RevenueDay = { date: string; revenue: number; bookings: number };
type OccupancyHour = { hour: number; pct: number };
type TopCourt = { name: string; bookings: number };
type RevenueMethod = { method: string; amount: number };

type Overview = {
  totalRevenue: number;
  totalBookings: number;
  occupancyPct: number;
  activeMembers: number;
  avgBookingDuration: number;
  revenueByDay: RevenueDay[];
  occupancyByHour: OccupancyHour[];
  topCourts: TopCourt[];
  newPlayersByMonth: { month: string; count: number }[];
};

type RevenueData = {
  total: number;
  byMethod: RevenueMethod[];
  byDay: { date: string; amount: number }[];
  byMonth: { month: string; amount: number }[];
};

type ComparisonChanges = {
  totalRevenue: number | null;
  totalBookings: number | null;
  occupancyPct: number | null;
  activeMembers: number | null;
} | null;

type ComparisonData = {
  current: Overview;
  previous: Overview | null;
  changes: ComparisonChanges;
} | null;

// ─── Helpers ─────────────────────────────────────────────────────────

function formatCOP(cents: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Page component ──────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [comparison, setComparison] = useState<ComparisonData>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [comparisonRange, setComparisonRange] = useState<ComparisonRange>({ from: "", to: "" });

  // Initialise date range to last 30 days on mount
  useEffect(() => {
    const to = new Date();
    const from = new Date(Date.now() - 30 * 86_400_000);
    setDateRange({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });
    setComparisonRange({
      from: new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10),
      to: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
    });
  }, []);

  const fetchData = useCallback(async (from: string, to: string, compareFrom: string, compareTo: string) => {
    setLoading(true);
    setError(null);
    try {
      const fromParam = new Date(from + "T00:00:00").toISOString();
      const toParam = new Date(to + "T23:59:59").toISOString();
      const cfParam = new Date(compareFrom + "T00:00:00").toISOString();
      const ctParam = new Date(compareTo + "T23:59:59").toISOString();
      const params = new URLSearchParams({
        from: fromParam,
        to: toParam,
        compareFrom: cfParam,
        compareTo: ctParam,
      });
      const res = await fetch(`/api/analytics/overview?${params}`);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setOverview(data.overview);
      setRevenue(data.revenue);
      setComparison(data.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when date range or comparison range changes
  useEffect(() => {
    if (dateRange.from && dateRange.to && comparisonRange.from && comparisonRange.to) {
      fetchData(dateRange.from, dateRange.to, comparisonRange.from, comparisonRange.to);
    }
  }, [dateRange, comparisonRange, fetchData]);

  const handleDateChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const handleComparisonChange = useCallback((range: ComparisonRange) => {
    setComparisonRange(range);
  }, []);

  // ── Gate: module disabled ────────────────────────────────────────

  if (!MODULE_FLAGS.analytics) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-[var(--pb-text-primary)] mb-6">
          Analytics
        </h1>
        <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-8 text-center">
          <p className="text-sm text-[var(--pb-text-secondary)]">
            El módulo de analytics no está activado.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--pb-text-primary)]">
            Analytics
          </h1>
          <div className="h-9 w-64 rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)] animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-5"
            >
              <div className="h-3 w-16 bg-[var(--pb-surface-secondary)] rounded animate-pulse mb-3" />
              <div className="h-7 w-24 bg-[var(--pb-surface-secondary)] rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-[var(--pb-surface-secondary)] rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-5"
            >
              <div className="h-4 w-32 bg-[var(--pb-surface-secondary)] rounded animate-pulse mb-4" />
              <div className="h-48 bg-[var(--pb-surface-secondary)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--pb-text-primary)] mb-6">
          Analytics
        </h1>
        <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-status-error)]/30 bg-[var(--pb-status-error)]/5 p-8 text-center">
          <p className="text-sm font-medium text-[var(--pb-status-error)] mb-2">
            Error al cargar datos
          </p>
          <p className="text-sm text-[var(--pb-text-secondary)] mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchData(dateRange.from, dateRange.to, comparisonRange.from, comparisonRange.to)}
            className="px-4 py-2 text-sm font-medium rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] text-[var(--pb-brand-foreground)] hover:bg-[var(--pb-brand-hover)] transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[var(--pb-text-primary)]">
          Analytics
        </h1>
        <DateRangePicker
          value={dateRange}
          onChange={handleDateChange}
          onComparisonChange={handleComparisonChange}
        />
      </div>

      {/* KPI cards with comparison badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Total Reservas"
          value={String(overview?.totalBookings ?? 0)}
          sub="confirmadas en el periodo"
          accent="green"
          icon={<CalendarDays size={18} />}
          change={comparison?.changes?.totalBookings}
        />
        <KpiCard
          label="Ingresos"
          value={formatCOP(overview?.totalRevenue ?? 0)}
          sub="COP, transacciones completadas"
          accent="clay"
          icon={<DollarSign size={18} />}
          change={comparison?.changes?.totalRevenue}
        />
        <KpiCard
          label="Ocupación"
          value={`${overview?.occupancyPct ?? 0}%`}
          sub={`${overview?.avgBookingDuration ?? 0} min duración media`}
          accent="yellow"
          icon={<TrendingUp size={18} />}
          change={comparison?.changes?.occupancyPct}
        />
        <KpiCard
          label="Jugadores Activos"
          value={String(overview?.activeMembers ?? 0)}
          sub="usuarios únicos en el periodo"
          accent="blue"
          icon={<Users size={18} />}
          change={comparison?.changes?.activeMembers}
        />
      </div>

      {/* Period comparison detail */}
      {comparison?.previous && (
        <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-5 shadow-[var(--pb-shadow-card)] mb-8">
          <h3 className="text-sm font-semibold text-[var(--pb-text-primary)] mb-4">
            Comparación con período anterior
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[var(--pb-text-tertiary)] text-xs">Ingresos</p>
              <p className="font-medium text-[var(--pb-text-primary)]">{formatCOP(comparison.current.totalRevenue)}</p>
              <p className="text-xs text-[var(--pb-text-tertiary)]">vs {formatCOP(comparison.previous.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-[var(--pb-text-tertiary)] text-xs">Reservas</p>
              <p className="font-medium text-[var(--pb-text-primary)]">{comparison.current.totalBookings}</p>
              <p className="text-xs text-[var(--pb-text-tertiary)]">vs {comparison.previous.totalBookings}</p>
            </div>
            <div>
              <p className="text-[var(--pb-text-tertiary)] text-xs">Ocupación</p>
              <p className="font-medium text-[var(--pb-text-primary)]">{comparison.current.occupancyPct}%</p>
              <p className="text-xs text-[var(--pb-text-tertiary)]">vs {comparison.previous.occupancyPct}%</p>
            </div>
            <div>
              <p className="text-[var(--pb-text-tertiary)] text-xs">Miembros activos</p>
              <p className="font-medium text-[var(--pb-text-primary)]">{comparison.current.activeMembers}</p>
              <p className="text-xs text-[var(--pb-text-tertiary)]">vs {comparison.previous.activeMembers}</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-5 shadow-[var(--pb-shadow-card)]">
          <h3 className="text-base font-semibold text-[var(--pb-text-primary)] mb-4">
            Ingresos por Día
          </h3>
          <RevenueChart data={overview?.revenueByDay ?? []} />
        </div>

        <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-5 shadow-[var(--pb-shadow-card)]">
          <h3 className="text-base font-semibold text-[var(--pb-text-primary)] mb-4">
            Ocupación por Hora
          </h3>
          <OccupancyChart data={overview?.occupancyByHour ?? []} />
        </div>
      </div>

      {/* Secondary metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by method */}
        <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-5 shadow-[var(--pb-shadow-card)]">
          <h3 className="text-base font-semibold text-[var(--pb-text-primary)] mb-4">
            Ingresos por Método
          </h3>
          {revenue?.byMethod && revenue.byMethod.length > 0 ? (
            <div className="space-y-3">
              {revenue.byMethod.map((m) => {
                const total = revenue.total || 1;
                const pct = Math.round((m.amount / total) * 100);
                return (
                  <div key={m.method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--pb-text-secondary)] capitalize">
                        {m.method.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium text-[var(--pb-text-primary)]">
                        {formatCOP(m.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-[var(--pb-radius-xs)] bg-[var(--pb-surface-secondary)]">
                      <div
                        className="h-full rounded-[var(--pb-radius-xs)] bg-[var(--pb-brand-primary)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--pb-text-tertiary)] py-6 text-center">
              Sin transacciones en el periodo
            </p>
          )}
        </div>

        {/* Top courts */}
        <div className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-5 shadow-[var(--pb-shadow-card)]">
          <h3 className="text-base font-semibold text-[var(--pb-text-primary)] mb-4">
            Pistas Más Usadas
          </h3>
          {overview?.topCourts && overview.topCourts.length > 0 ? (
            <div className="space-y-3">
              {overview.topCourts.map((c, i) => {
                const maxBookings = Math.max(
                  ...overview.topCourts.map((x) => x.bookings),
                  1,
                );
                const pct = (c.bookings / maxBookings) * 100;
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--pb-text-primary)]">
                        <span className="text-[var(--pb-text-tertiary)] mr-1.5">
                          #{i + 1}
                        </span>
                        {c.name}
                      </span>
                      <span className="font-medium text-[var(--pb-text-primary)]">
                        {c.bookings} reservas
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-[var(--pb-radius-xs)] bg-[var(--pb-surface-secondary)]">
                      <div
                        className="h-full rounded-[var(--pb-radius-xs)] bg-[var(--pb-trust-verified)]"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--pb-text-tertiary)] py-6 text-center">
              Sin datos de pistas en el periodo
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
