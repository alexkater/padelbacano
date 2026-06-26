import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { analyticsRepo } from "@/infra/db/repositories";
import type { AnalyticsOverview } from "@/core/entities/analytics";
import type { PeriodComparison } from "@/core/entities/analytics";

function parseDateParam(value: string | null, fallbackDays: number): Date {
  if (!value) {
    const d = new Date();
    d.setDate(d.getDate() - fallbackDays);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date(Date.now() - fallbackDays * 86400000) : d;
}

function endOfDay(d: Date): Date {
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return end;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "club_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clubId = session.user.clubId;
  if (!clubId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = parseDateParam(searchParams.get("from"), 30);
  const toParam = searchParams.get("to");
  const to = toParam ? endOfDay(new Date(toParam)) : new Date();

  const overview = await analyticsRepo.getOverview(clubId, from, to);
  const revenue = await analyticsRepo.getRevenueReport(clubId, from, to);

  // Period comparison (optional: compareFrom + compareTo triggers it)
  const compareFromParam = searchParams.get("compareFrom");
  const compareToParam = searchParams.get("compareTo");
  let comparison: PeriodComparison<AnalyticsOverview> | null = null;

  if (compareFromParam && compareToParam) {
    const cf = parseDateParam(compareFromParam, 30);
    const ct = endOfDay(new Date(compareToParam));
    comparison = await analyticsRepo.getOverviewComparison(clubId, from, to, cf, ct);
  }

  return NextResponse.json({ overview, revenue, comparison });
}
