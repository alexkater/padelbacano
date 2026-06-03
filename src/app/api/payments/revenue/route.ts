import { NextRequest, NextResponse } from "next/server";
import { paymentRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const toDate = to ? new Date(to) : new Date();
  const total = await paymentRepo.getTotalRevenue(club.id, fromDate, toDate);
  const transactions = await paymentRepo.listByClub(club.id);
  return NextResponse.json({ revenue: total, currency: "COP", transactions: transactions.filter(t => t.status === "completed").length, period: { from: fromDate, to: toDate } });
}
