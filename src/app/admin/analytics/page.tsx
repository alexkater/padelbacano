"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULE_FLAGS } from "@/padelbacano.config";

type Overview = { totalRevenue: number; totalBookings: number; occupancyPct: number; avgBookingDuration: number; revenueByDay: { date: string; revenue: number; bookings: number }[]; occupancyByHour: { hour: number; pct: number }[]; topCourts: { name: string; bookings: number }[] };
type Revenue = { total: number; byMethod: { method: string; amount: number }[]; byDay: { date: string; amount: number }[] };

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");

  useEffect(() => {
    async function load() {
      try {
        const from = new Date(Date.now() - parseInt(days) * 86400000).toISOString();
        const res = await fetch(`/api/analytics/overview?from=${from}`);
        if (res.ok) { const d = await res.json(); setOverview(d.overview); setRevenue(d.revenue); }
      } catch { }
      setLoading(false);
    }
    load();
  }, [days]);

  if (!MODULE_FLAGS.analytics) return <div className="max-w-2xl"><h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Analytics</h1><Card><CardContent><p className="text-sm text-[var(--club-ink-muted)] py-8 text-center">El módulo de analytics no está activado.</p></CardContent></Card></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--club-ink)]">Analytics & BI</h1>
        <select value={days} onChange={e => setDays(e.target.value)} className="h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 text-sm bg-white">
          <option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option>
        </select>
      </div>

      {loading ? <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded" />)}</div> : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Ingresos", value: `$${((overview?.totalRevenue || 0) / 100).toLocaleString("es-CO")}`, sub: "COP" },
              { label: "Reservas", value: overview?.totalBookings || 0, sub: "confirmadas" },
              { label: "Ocupación", value: `${overview?.occupancyPct || 0}%`, sub: "pistas" },
              { label: "Dur. media", value: `${overview?.avgBookingDuration || 0}m`, sub: "por reserva" },
            ].map(s => (
              <Card key={s.label}><CardContent><p className="text-xs text-[var(--club-ink-muted)]">{s.label}</p><p className="text-2xl font-bold text-[var(--club-ink)] mt-1">{s.value}</p><p className="text-xs text-[var(--club-ink-muted)]">{s.sub}</p></CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue by day chart */}
            <Card><CardHeader><CardTitle>Ingresos por Día</CardTitle></CardHeader><CardContent>
              {overview?.revenueByDay && overview.revenueByDay.length > 0 ? (
                <div className="space-y-1">
                  {overview.revenueByDay.slice(-14).map(d => {
                    const maxRev = Math.max(...overview.revenueByDay.map(x => x.revenue), 1000);
                    const pct = (d.revenue / maxRev) * 100;
                    return (
                      <div key={d.date} className="flex items-center gap-2 text-xs">
                        <span className="w-20 text-[var(--club-ink-muted)]">{new Date(d.date).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
                        <div className="flex-1 h-4 bg-[var(--club-surface-alt)] rounded">
                          <div className="h-full bg-[var(--club-primary)] rounded" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-16 text-right font-medium">${(d.revenue / 100).toLocaleString("es-CO")}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">Sin datos de ingresos</p>}
            </CardContent></Card>

            {/* Occupancy by hour */}
            <Card><CardHeader><CardTitle>Ocupación por Hora</CardTitle></CardHeader><CardContent>
              {overview?.occupancyByHour ? (
                <div className="space-y-1">
                  {overview.occupancyByHour.map(h => {
                    const maxOcc = Math.max(...overview.occupancyByHour.map(x => x.pct), 1);
                    const pct = (h.pct / maxOcc) * 100;
                    return (
                      <div key={h.hour} className="flex items-center gap-2 text-xs">
                        <span className="w-12 text-[var(--club-ink-muted)]">{h.hour}:00</span>
                        <div className="flex-1 h-4 bg-[var(--club-surface-alt)] rounded">
                          <div className="h-full bg-[var(--club-warning)] rounded" style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                        <span className="w-10 text-right font-medium">{h.pct}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">Sin datos</p>}
            </CardContent></Card>

            {/* Revenue by method */}
            <Card><CardHeader><CardTitle>Ingresos por Método</CardTitle></CardHeader><CardContent>
              {revenue?.byMethod && revenue.byMethod.length > 0 ? (
                <div className="space-y-2">
                  {revenue.byMethod.map(m => (
                    <div key={m.method} className="flex justify-between text-sm">
                      <span className="text-[var(--club-ink-muted)] capitalize">{m.method.replace("_", " ")}</span>
                      <span className="font-medium">${(m.amount / 100).toLocaleString("es-CO")}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">Sin transacciones</p>}
            </CardContent></Card>

            {/* Top courts */}
            <Card><CardHeader><CardTitle>Pistas Más Usadas</CardTitle></CardHeader><CardContent>
              {overview?.topCourts && overview.topCourts.length > 0 ? (
                <div className="space-y-2">
                  {overview.topCourts.map((c, i) => (
                    <div key={c.name} className="flex justify-between text-sm">
                      <span className="text-[var(--club-ink)]">#{i + 1} {c.name}</span>
                      <span className="font-medium">{c.bookings} reservas</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">Sin datos</p>}
            </CardContent></Card>
          </div>
        </>
      )}
    </div>
  );
}
