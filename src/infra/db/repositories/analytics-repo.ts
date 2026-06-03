import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IAnalyticsRepository } from "@/core/ports/analytics-repository";
import type { AnalyticsOverview, RevenueReport } from "@/core/entities/analytics";

export const analyticsRepo: IAnalyticsRepository = {
  async getOverview(clubId, from, to) {
    const courts = db.select().from(schema.courts).where(and(eq(schema.courts.clubId, clubId), eq(schema.courts.isActive, true))).all();
    const totalCourts = courts.length;

    const bookingsInRange = db.select().from(schema.bookings).innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id)).where(and(eq(schema.courts.clubId, clubId), gte(schema.bookings.startTime, from), lte(schema.bookings.endTime, to))).all();

    const confirmed = bookingsInRange.filter(b => b.bookings.status === "confirmed");
    const maxSlots = totalCourts * 14 * Math.ceil((to.getTime() - from.getTime()) / (86400000));
    const occupancyPct = maxSlots > 0 ? Math.round((confirmed.length / maxSlots) * 100) : 0;

    const txRows = db.select().from(schema.transactions).where(and(eq(schema.transactions.clubId, clubId), eq(schema.transactions.status, "completed"))).all();
    const totalRevenue = txRows.filter(r => r.createdAt >= from && r.createdAt <= to).reduce((s, r) => s + r.amount, 0);

    // Revenue by day
    const revenueByDay: { date: string; revenue: number; bookings: number }[] = [];
    const dayMap = new Map<string, { revenue: number; bookings: number }>();
    for (const b of confirmed) {
      const day = b.bookings.startTime.toISOString().slice(0, 10);
      const entry = dayMap.get(day) || { revenue: 0, bookings: 0 };
      entry.bookings++;
      dayMap.set(day, entry);
    }
    for (const [date, entry] of dayMap) revenueByDay.push({ date, ...entry });
    revenueByDay.sort((a, b) => a.date.localeCompare(b.date));

    // Occupancy by hour
    const hourCounts = new Array(14).fill(0);
    for (const b of confirmed) hourCounts[b.bookings.startTime.getHours() - 9]++;
    const occupancyByHour = hourCounts.map((count, i) => ({ hour: i + 9, pct: Math.round((count / (totalCourts * Math.ceil((to.getTime() - from.getTime()) / 86400000))) * 100) }));

    // Top courts
    const courtMap = new Map<string, number>();
    for (const b of confirmed) {
      const name = b.courts?.name || b.bookings.courtId.slice(0, 8);
      courtMap.set(name, (courtMap.get(name) || 0) + 1);
    }
    const topCourts = [...courtMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, bookings]) => ({ name, bookings }));

    const avgDuration = confirmed.length > 0 ? Math.round(confirmed.reduce((s, b) => s + b.bookings.duration, 0) / confirmed.length) : 0;
    const players = new Set(confirmed.map(b => b.bookings.userId)).size;

    return { totalRevenue, totalBookings: confirmed.length, occupancyPct, activeMembers: 0, avgBookingDuration: avgDuration, revenueByDay, occupancyByHour, topCourts, newPlayersByMonth: [] };
  },

  async getRevenueReport(clubId, from, to) {
    const txRows = db.select().from(schema.transactions).where(and(eq(schema.transactions.clubId, clubId), eq(schema.transactions.status, "completed"))).all();
    const filtered = txRows.filter(r => r.createdAt >= from && r.createdAt <= to);
    const total = filtered.reduce((s, r) => s + r.amount, 0);

    const methodMap = new Map<string, number>();
    for (const r of filtered) methodMap.set(r.method, (methodMap.get(r.method) || 0) + r.amount);
    const byMethod = [...methodMap.entries()].map(([method, amount]) => ({ method, amount }));

    const dayMap = new Map<string, number>();
    for (const r of filtered) {
      const day = r.createdAt.toISOString().slice(0, 10);
      dayMap.set(day, (dayMap.get(day) || 0) + r.amount);
    }
    const byDay = [...dayMap.entries()].map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));

    return { period: { from, to }, total, byMethod, byDay };
  },

  async computeDailySummary(_clubId, _date) {
    // Daily snapshots can be pre-computed by a cron job
    // For now, computed on-the-fly in getOverview
  },
};
