import { NextResponse } from "next/server";
import { clubRepo } from "@/infra/db/repositories";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const club = await clubRepo.findBySlug(slug);

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Return only public fields (no internal IDs exposed unnecessarily)
  return NextResponse.json({
    id: club.id,
    name: club.name,
    slug: club.slug,
    pricing: club.pricing,
    theme: club.theme,
    contact: club.contact,
    content: club.content,
    cancellationPolicy: club.cancellationPolicy,
    courts: club.courts.map((c) => ({
      id: c.id,
      name: c.name,
      courtType: c.courtType,
      indoor: c.indoor,
    })),
  });
}
