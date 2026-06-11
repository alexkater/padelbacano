import { NextRequest, NextResponse } from "next/server";
import { clubRepo } from "@/infra/db/repositories";

/**
 * GET /api/clubs?city=Bogotá
 * Returns a list of available clubs, optionally filtered by city.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  const clubs = await clubRepo.listAll();

  const filtered = city
    ? clubs.filter((c) =>
        c.contact.address.toLowerCase().includes(city.toLowerCase())
      )
    : clubs;

  const result = filtered.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    city: c.contact.address.split(",")[0]?.trim() ?? c.contact.address,
    courtCount: c.courts?.length ?? 0,
  }));

  return NextResponse.json({ clubs: result });
}
