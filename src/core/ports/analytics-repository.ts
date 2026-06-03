import type { AnalyticsOverview, RevenueReport } from "../entities/analytics";

export interface IAnalyticsRepository {
  getOverview(clubId: string, from: Date, to: Date): Promise<AnalyticsOverview>;
  getRevenueReport(clubId: string, from: Date, to: Date): Promise<RevenueReport>;
  computeDailySummary(clubId: string, date: Date): Promise<void>;
}
