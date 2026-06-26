import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { analyticsRepo } from "@/infra/db/repositories";

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
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
  const toDate = to ? (() => { const d = new Date(to); d.setHours(23, 59, 59, 999); return d; })() : new Date();

  const report = await analyticsRepo.getRevenueReport(clubId, fromDate, toDate);

  // Period comparison (optional)
  const compareFrom = searchParams.get("compareFrom");
  const compareTo = searchParams.get("compareTo");
  if (compareFrom && compareTo) {
    const cf = new Date(compareFrom);
    const ct = new Date(compareTo);
    ct.setHours(23, 59, 59, 999);
    const previous = await analyticsRepo.getRevenueReport(clubId, cf, ct);
    return NextResponse.json({ report, comparison: { current: report, previous } });
  }

  return NextResponse.json({ report });
}
