export type DailySummary = {
  id: string;
  clubId: string;
  date: Date;
  totalBookings: number;
  cancelledBookings: number;
  occupancyPct: number;
  revenue: number;
  uniquePlayers: number;
  avgDuration: number;
  peakHour: number | null;
  createdAt: Date;
};

export type AnalyticsOverview = {
  totalRevenue: number;
  totalBookings: number;
  occupancyPct: number;
  activeMembers: number;
  avgBookingDuration: number;
  revenueByDay: { date: string; revenue: number; bookings: number }[];
  occupancyByHour: { hour: number; pct: number }[];
  topCourts: { name: string; bookings: number }[];
  newPlayersByMonth: { month: string; count: number }[];
};

export type RevenueReport = {
  period: { from: Date; to: Date };
  total: number;
  byMethod: { method: string; amount: number }[];
  byDay: { date: string; amount: number }[];
  byMonth: { month: string; amount: number }[];
};

export type OccupancyReport = {
  period: { from: Date; to: Date };
  overallPct: number;
  byHour: { hour: number; pct: number; bookings: number }[];
  byCourt: { name: string; pct: number; bookings: number }[];
};

/** Comparison between two periods (e.g. this month vs last month) */
export type PeriodComparison<T> = {
  current: T;
  previous: T | null;
  changes: {
    totalRevenue: number | null;
    totalBookings: number | null;
    occupancyPct: number | null;
    activeMembers: number | null;
  } | null;
};
