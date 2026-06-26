import { NextRequest, NextResponse } from "next/server";
import { clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  let club = await clubRepo.findBySlug(slug);
  if (!club && slug === CLUB_CONFIG.slug) {
    club = (await clubRepo.listAll())[0] ?? null;
  }
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  return NextResponse.json({ theme: club.theme });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const club = await clubRepo.findBySlug(slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const updated = await clubRepo.updateTheme(club.id, {
    primaryColor: body.primaryColor ?? club.theme.primaryColor,
    surfaceColor: body.surfaceColor ?? club.theme.surfaceColor,
    fontFamily: body.fontFamily ?? club.theme.fontFamily,
    logoUrl: body.logoUrl !== undefined ? body.logoUrl : club.theme.logoUrl,
    borderRadius: body.borderRadius ?? club.theme.borderRadius,
  });

  return NextResponse.json({ theme: updated.theme });
}
