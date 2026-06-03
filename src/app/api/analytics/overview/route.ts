import { NextRequest, NextResponse } from "next/server";
import { analyticsRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
  const toDate = to ? new Date(to) : new Date();
  const overview = await analyticsRepo.getOverview(club.id, fromDate, toDate);
  const revenueReport = await analyticsRepo.getRevenueReport(club.id, fromDate, toDate);
  return NextResponse.json({ overview, revenue: revenueReport });
}
