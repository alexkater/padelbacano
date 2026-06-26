import { NextRequest, NextResponse } from "next/server";
import { listPublicClubSummaries } from "@/infra/tenant/public-club-profile-service";

/**
 * GET /api/clubs?city=Bogotá
 * Returns active clubs from DB-backed club_configs, optionally filtered by city.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clubs = await listPublicClubSummaries(searchParams.get("city"));

  return NextResponse.json({ clubs });
}
