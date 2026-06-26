import type { AnalyticsOverview, RevenueReport, OccupancyReport, PeriodComparison } from "../entities/analytics";

export interface IAnalyticsRepository {
  getOverview(clubId: string, from: Date, to: Date): Promise<AnalyticsOverview>;
  getRevenueReport(clubId: string, from: Date, to: Date): Promise<RevenueReport>;
  getOccupancyReport(clubId: string, from: Date, to: Date): Promise<OccupancyReport>;
  computeDailySummary(clubId: string, date: Date): Promise<void>;

  /** Return overview for both current and previous period with computed changes */
  getOverviewComparison(
    clubId: string,
    currentFrom: Date,
    currentTo: Date,
    previousFrom: Date,
    previousTo: Date,
  ): Promise<PeriodComparison<AnalyticsOverview>>;
}
