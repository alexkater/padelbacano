// ─── Analytics repository — real Drizzle aggregation queries ────────────────
// All revenue in cents (integers).

import { eq, and, gte, lte, lt, sql, desc, inArray } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IAnalyticsRepository } from "@/core/ports/analytics-repository";
import type { AnalyticsOverview, RevenueReport, OccupancyReport, DailySummary, PeriodComparison } from "@/core/entities/analytics";

/** Number of bookable hour-long slots per court per day (09:00–23:00) */
const SLOTS_PER_COURT_PER_DAY = 14;
const OPENING_HOUR = 9;

function dayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/** Active booking statuses that count toward utilisation */
const ACTIVE_STATUSES: (typeof schema.bookings.$inferSelect.status)[] = ["confirmed", "completed"];

export const analyticsRepo: IAnalyticsRepository = {
  // ── getOverview ──────────────────────────────────────────────────────────
  async getOverview(clubId, from, to) {
    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));

    // Active court count
    const [courtCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.courts)
      .where(and(eq(schema.courts.clubId, clubId), eq(schema.courts.isActive, true)));
    const totalCourts = Number(courtCountRow?.count ?? 0);

    // ── Booking aggregations ─────────────────────────────────────────────
    const [bookingAgg] = await db
      .select({
        totalBookings: sql<number>`count(*)::int`,
        avgDuration: sql<number>`coalesce(round(avg(${schema.bookings.duration})), 0)::int`,
        activeMembers: sql<number>`count(distinct ${schema.bookings.userId})::int`,
        peakHour: sql<number>`null::int`, // placeholder, computed separately
      })
      .from(schema.bookings)
      .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
      .where(
        and(
          eq(schema.courts.clubId, clubId),
          inArray(schema.bookings.status, ACTIVE_STATUSES),
          gte(schema.bookings.startTime, from),
          lt(schema.bookings.startTime, to),
        ),
      );

    const totalBookings = Number(bookingAgg?.totalBookings ?? 0);

    // ── Total revenue from completed transactions ─────────────────────────
    const [revRow] = await db
      .select({ total: sql<number>`coalesce(sum(${schema.transactions.amount}), 0)::int` })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.clubId, clubId),
          eq(schema.transactions.status, "completed"),
          gte(schema.transactions.createdAt, from),
          lt(schema.transactions.createdAt, to),
        ),
      );
    const totalRevenue = Number(revRow?.total ?? 0);

    // ── Revenue by day ──────────────────────────────────────────────────
    const revByDayRows = await db
      .select({
        date: sql<string>`date(${schema.transactions.createdAt})`,
        revenue: sql<number>`coalesce(sum(${schema.transactions.amount}), 0)::int`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.clubId, clubId),
          eq(schema.transactions.status, "completed"),
          gte(schema.transactions.createdAt, from),
          lt(schema.transactions.createdAt, to),
        ),
      )
      .groupBy(sql`date(${schema.transactions.createdAt})`)
      .orderBy(sql`date(${schema.transactions.createdAt})`);

    // ── Bookings by day ───────────────────────────────────────────────────
    const bkByDayRows = await db
      .select({
        date: sql<string>`date(${schema.bookings.startTime})`,
        bookings: sql<number>`count(*)::int`,
      })
      .from(schema.bookings)
      .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
      .where(
        and(
          eq(schema.courts.clubId, clubId),
          inArray(schema.bookings.status, ACTIVE_STATUSES),
          gte(schema.bookings.startTime, from),
          lt(schema.bookings.startTime, to),
        ),
      )
      .groupBy(sql`date(${schema.bookings.startTime})`)
      .orderBy(sql`date(${schema.bookings.startTime})`);

    // Merge revenue + bookings by day
    const revDayMap = new Map(revByDayRows.map((r) => [r.date, r.revenue]));
    const revenueByDay = bkByDayRows.map((r) => ({
      date: r.date,
      revenue: revDayMap.get(r.date) ?? 0,
      bookings: r.bookings,
    }));

    // ── Occupancy by hour ─────────────────────────────────────────────────
    const occByHourRows = await db
      .select({
        hour: sql<number>`extract(hour from ${schema.bookings.startTime})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.bookings)
      .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
      .where(
        and(
          eq(schema.courts.clubId, clubId),
          inArray(schema.bookings.status, ACTIVE_STATUSES),
          gte(schema.bookings.startTime, from),
          lt(schema.bookings.startTime, to),
        ),
      )
      .groupBy(sql`extract(hour from ${schema.bookings.startTime})`)
      .orderBy(sql`extract(hour from ${schema.bookings.startTime})`);

    const occHourMap = new Map(occByHourRows.map((r) => [r.hour, r.count]));
    const occupancyByHour: { hour: number; pct: number }[] = [];
    for (let h = OPENING_HOUR; h < OPENING_HOUR + SLOTS_PER_COURT_PER_DAY; h++) {
      const count = occHourMap.get(h) ?? 0;
      const pct = totalCourts > 0 ? Math.round((count / (totalCourts * days)) * 100) : 0;
      occupancyByHour.push({ hour: h, pct });
    }

    // ── Top courts ────────────────────────────────────────────────────────
    const topCourtRows = await db
      .select({
        name: schema.courts.name,
        bookings: sql<number>`count(*)::int`,
      })
      .from(schema.bookings)
      .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
      .where(
        and(
          eq(schema.courts.clubId, clubId),
          inArray(schema.bookings.status, ACTIVE_STATUSES),
          gte(schema.bookings.startTime, from),
          lt(schema.bookings.startTime, to),
        ),
      )
      .groupBy(schema.courts.id, schema.courts.name)
      .orderBy(desc(sql`count(*)`))
      .limit(5);
    const topCourts = topCourtRows.map((r) => ({ name: r.name, bookings: r.bookings }));

    // ── New players by month ──────────────────────────────────────────────
    const newPlayerRows = await db
      .select({
        month: sql<string>`to_char(${schema.userProfiles.joinedAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.userProfiles)
      .where(
        and(
          eq(schema.userProfiles.clubId, clubId),
          gte(schema.userProfiles.joinedAt, from),
          lt(schema.userProfiles.joinedAt, to),
        ),
      )
      .groupBy(sql`to_char(${schema.userProfiles.joinedAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.userProfiles.joinedAt}, 'YYYY-MM')`);
    const newPlayersByMonth = newPlayerRows.map((r) => ({ month: r.month, count: r.count }));

    // ── Occupancy % (overall) ────────────────────────────────────────────
    const maxSlots = totalCourts * SLOTS_PER_COURT_PER_DAY * days;
    const occupancyPct = maxSlots > 0 ? Math.round((totalBookings / maxSlots) * 100) : 0;

    return {
      totalRevenue,
      totalBookings,
      occupancyPct,
      activeMembers: Number(bookingAgg?.activeMembers ?? 0),
      avgBookingDuration: Number(bookingAgg?.avgDuration ?? 0),
      revenueByDay,
      occupancyByHour,
      topCourts,
      newPlayersByMonth,
    };
  },

  // ── getRevenueReport ─────────────────────────────────────────────────────
  async getRevenueReport(clubId, from, to) {
    // ── Total revenue ─────────────────────────────────────────────────────
    const [totalRow] = await db
      .select({ total: sql<number>`coalesce(sum(${schema.transactions.amount}), 0)::int` })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.clubId, clubId),
          eq(schema.transactions.status, "completed"),
          gte(schema.transactions.createdAt, from),
          lt(schema.transactions.createdAt, to),
        ),
      );
    const total = Number(totalRow?.total ?? 0);

    // ── By payment method ─────────────────────────────────────────────────
    const methodRows = await db
      .select({
        method: schema.transactions.method,
        amount: sql<number>`coalesce(sum(${schema.transactions.amount}), 0)::int`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.clubId, clubId),
          eq(schema.transactions.status, "completed"),
          gte(schema.transactions.createdAt, from),
          lt(schema.transactions.createdAt, to),
        ),
      )
      .groupBy(schema.transactions.method)
      .orderBy(desc(sql`sum(${schema.transactions.amount})`));
    const byMethod = methodRows.map((r) => ({ method: r.method, amount: r.amount }));

    // ── By day ────────────────────────────────────────────────────────────
    const dayRows = await db
      .select({
        date: sql<string>`date(${schema.transactions.createdAt})`,
        amount: sql<number>`coalesce(sum(${schema.transactions.amount}), 0)::int`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.clubId, clubId),
          eq(schema.transactions.status, "completed"),
          gte(schema.transactions.createdAt, from),
          lt(schema.transactions.createdAt, to),
        ),
      )
      .groupBy(sql`date(${schema.transactions.createdAt})`)
      .orderBy(sql`date(${schema.transactions.createdAt})`);
    const byDay = dayRows.map((r) => ({ date: r.date, amount: r.amount }));

    // ── By month ──────────────────────────────────────────────────────────
    const monthRows = await db
      .select({
        month: sql<string>`to_char(${schema.transactions.createdAt}, 'YYYY-MM')`,
        amount: sql<number>`coalesce(sum(${schema.transactions.amount}), 0)::int`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.clubId, clubId),
          eq(schema.transactions.status, "completed"),
          gte(schema.transactions.createdAt, from),
          lt(schema.transactions.createdAt, to),
        ),
      )
      .groupBy(sql`to_char(${schema.transactions.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.transactions.createdAt}, 'YYYY-MM')`);
    const byMonth = monthRows.map((r) => ({ month: r.month, amount: r.amount }));

    return { period: { from, to }, total, byMethod, byDay, byMonth };
  },

  // ── getOccupancyReport ───────────────────────────────────────────────────
  async getOccupancyReport(clubId, from, to) {
    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));

    // Active court count
    const courtRows = await db
      .select()
      .from(schema.courts)
      .where(and(eq(schema.courts.clubId, clubId), eq(schema.courts.isActive, true)));
    const totalCourts = courtRows.length;
    if (totalCourts === 0) {
      return { period: { from, to }, overallPct: 0, byHour: [], byCourt: [] };
    }

    // Confirmed + completed bookings in range
    const bookingRows = await db
      .select({
        courtId: schema.bookings.courtId,
        courtName: schema.courts.name,
        hour: sql<number>`extract(hour from ${schema.bookings.startTime})::int`,
      })
      .from(schema.bookings)
      .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
      .where(
        and(
          eq(schema.courts.clubId, clubId),
          inArray(schema.bookings.status, ACTIVE_STATUSES),
          gte(schema.bookings.startTime, from),
          lt(schema.bookings.startTime, to),
        ),
      );

    const maxSlots = totalCourts * SLOTS_PER_COURT_PER_DAY * days;
    const totalConfirmed = bookingRows.length;
    const overallPct = maxSlots > 0 ? Math.round((totalConfirmed / maxSlots) * 100) : 0;

    // Occupancy by hour
    const hourCounts = new Array(SLOTS_PER_COURT_PER_DAY).fill(0);
    for (const r of bookingRows) {
      const offset = r.hour - OPENING_HOUR;
      if (offset >= 0 && offset < SLOTS_PER_COURT_PER_DAY) hourCounts[offset]++;
    }
    const byHour = hourCounts.map((count, i) => ({
      hour: i + OPENING_HOUR,
      pct: totalCourts > 0 ? Math.round((count / (totalCourts * days)) * 100) : 0,
      bookings: count,
    }));

    // Occupancy by court
    const courtCapacity = SLOTS_PER_COURT_PER_DAY * days;
    const courtMap = new Map<string, { confirmed: number }>();
    for (const c of courtRows) courtMap.set(c.name, { confirmed: 0 });
    for (const r of bookingRows) {
      const entry = courtMap.get(r.courtName);
      if (entry) entry.confirmed++;
    }
    const byCourt = [...courtMap.entries()]
      .map(([name, data]) => ({
        name,
        pct: Math.round((data.confirmed / courtCapacity) * 100),
        bookings: data.confirmed,
      }))
      .sort((a, b) => b.pct - a.pct);

    return { period: { from, to }, overallPct, byHour, byCourt };
  },

  // ── getOverviewComparison ────────────────────────────────────────────────
  async getOverviewComparison(clubId, currentFrom, currentTo, previousFrom, previousTo) {
    const current = await this.getOverview(clubId, currentFrom, currentTo);
    const previous = await this.getOverview(clubId, previousFrom, previousTo);

    const pRev = previous?.totalRevenue ?? null;
    const pBk = previous?.totalBookings ?? null;
    const pOcc = previous?.occupancyPct ?? null;
    const pMem = previous?.activeMembers ?? null;

    const changes = previous
      ? {
          totalRevenue: pRev !== null && pRev !== 0 ? Math.round(((current.totalRevenue - pRev) / pRev) * 100) : null,
          totalBookings: pBk !== null && pBk !== 0 ? Math.round(((current.totalBookings - pBk) / pBk) * 100) : null,
          occupancyPct: pOcc !== null ? current.occupancyPct - pOcc : null,
          activeMembers: pMem !== null && pMem !== 0 ? Math.round(((current.activeMembers - pMem) / pMem) * 100) : null,
        }
      : null;

    return { current, previous, changes };
  },

  // ── computeDailySummary ─────────────────────────────────────────────────
  async computeDailySummary(clubId, date) {
    const { start: dayStart, end: dayEnd } = dayRange(date);

    // Active court count
    const [courtCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.courts)
      .where(and(eq(schema.courts.clubId, clubId), eq(schema.courts.isActive, true)));
    const totalCourts = Number(courtCountRow?.count ?? 0);

    // ── Booking aggregations for the day ──────────────────────────────────
    const [dayAgg] = await db
      .select({
        totalBookings: sql<number>`count(*)::int`,
        cancelledBookings: sql<number>`count(*) filter (where ${schema.bookings.status} = 'cancelled')::int`,
        uniquePlayers: sql<number>`count(distinct ${schema.bookings.userId})::int`,
        avgDuration: sql<number>`coalesce(round(avg(${schema.bookings.duration})), 0)::int`,
      })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.clubId, clubId),
          gte(schema.bookings.startTime, dayStart),
          lt(schema.bookings.startTime, dayEnd),
        ),
      );

    const totalBookings = Number(dayAgg?.totalBookings ?? 0);
    const cancelledBookings = Number(dayAgg?.cancelledBookings ?? 0);
    const uniquePlayers = Number(dayAgg?.uniquePlayers ?? 0);
    const avgDuration = Number(dayAgg?.avgDuration ?? 0);

    // Active bookings (confirmed + completed) for occupancy calculation
    const [activeAgg] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.clubId, clubId),
          inArray(schema.bookings.status, ACTIVE_STATUSES),
          gte(schema.bookings.startTime, dayStart),
          lt(schema.bookings.startTime, dayEnd),
        ),
      );
    const activeBookings = Number(activeAgg?.count ?? 0);
    const maxSlots = Math.max(1, totalCourts * SLOTS_PER_COURT_PER_DAY);
    const occupancyPct = Math.round((activeBookings / maxSlots) * 100);

    // ── Revenue from completed transactions for the day ───────────────────
    const [revRow] = await db
      .select({ total: sql<number>`coalesce(sum(${schema.transactions.amount}), 0)::int` })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.clubId, clubId),
          eq(schema.transactions.status, "completed"),
          gte(schema.transactions.createdAt, dayStart),
          lt(schema.transactions.createdAt, dayEnd),
        ),
      );
    const revenue = Number(revRow?.total ?? 0);

    // ── Peak hour (hour with most bookings) ────────────────────────────────
    const peakRows = await db
      .select({
        hour: sql<number>`extract(hour from ${schema.bookings.startTime})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.clubId, clubId),
          inArray(schema.bookings.status, ACTIVE_STATUSES),
          gte(schema.bookings.startTime, dayStart),
          lt(schema.bookings.startTime, dayEnd),
        ),
      )
      .groupBy(sql`extract(hour from ${schema.bookings.startTime})`)
      .orderBy(desc(sql`count(*)`))
      .limit(1);
    const peakHour = peakRows.length > 0 ? peakRows[0].hour : null;

    // ── Upsert into daily_summaries ───────────────────────────────────────
    // Delete existing entry for the same club+date, then insert fresh
    await db
      .delete(schema.dailySummaries)
      .where(
        and(
          eq(schema.dailySummaries.clubId, clubId),
          eq(schema.dailySummaries.date, dayStart),
        ),
      );

    await db.insert(schema.dailySummaries).values({
      id: uuid(),
      clubId,
      date: dayStart,
      totalBookings,
      cancelledBookings,
      occupancyPct,
      revenue,
      uniquePlayers,
      avgDuration,
      peakHour,
      createdAt: new Date(),
    });
  },
};
