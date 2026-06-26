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

type OccupancyHour = {
  hour: number;
  pct: number;
};

type OccupancyChartProps = {
  data: OccupancyHour[];
};

export function OccupancyChart({ data }: OccupancyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--pb-text-tertiary)]">
        Sin datos de ocupación en el periodo seleccionado
      </div>
    );
  }

  const labeled = data.map((h) => ({
    ...h,
    label: `${h.hour}:00`,
  }));

  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={labeled} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--pb-border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--pb-text-tertiary)" }}
              axisLine={{ stroke: "var(--pb-border-subtle)" }}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tickFormatter={(v) => `${v ?? 0}%`}
              tick={{ fontSize: 11, fill: "var(--pb-text-tertiary)" }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                background: "var(--pb-surface-elevated)",
                border: "1px solid var(--pb-border-subtle)",
                borderRadius: "var(--pb-radius-md)",
                fontSize: 13,
                boxShadow: "var(--pb-shadow-overlay)",
              }}
              formatter={(value) => [`${value ?? 0}%`, "Ocupación"]}
              labelFormatter={(label) => `Hora ${label ?? ""}`}
            />
            <Bar
              dataKey="pct"
              fill="var(--pb-energy-yellow)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
