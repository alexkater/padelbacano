import { NextRequest, NextResponse } from "next/server";
import { invoiceRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("prefix") || "FE";
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const next = await invoiceRepo.getNextConsecutive(club.id, prefix);
  return NextResponse.json({ prefix, nextNumber: next, formatted: `${prefix}-${String(next).padStart(5, "0")}` });
}
