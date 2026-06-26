"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type RevenueDay = {
  date: string;
  revenue: number;
  bookings: number;
};

type RevenueChartProps = {
  data: RevenueDay[];
};

function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--pb-text-tertiary)]">
        Sin datos de ingresos en el periodo seleccionado
      </div>
    );
  }

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--pb-border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fontSize: 11, fill: "var(--pb-text-tertiary)" }}
              axisLine={{ stroke: "var(--pb-border-subtle)" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `$${(Number(v ?? 0) / 100 / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "var(--pb-text-tertiary)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--pb-surface-elevated)",
                border: "1px solid var(--pb-border-subtle)",
                borderRadius: "var(--pb-radius-md)",
                fontSize: 13,
                boxShadow: "var(--pb-shadow-overlay)",
              }}
              labelFormatter={(label) => formatShortDate(String(label ?? ""))}
              formatter={(value) => [formatCOP(Number(value ?? 0)), "Ingresos"]}
            />
            <Bar
              dataKey="revenue"
              fill="var(--pb-energy-clay)"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
