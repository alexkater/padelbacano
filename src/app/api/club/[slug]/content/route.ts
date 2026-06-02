import { NextRequest, NextResponse } from "next/server";
import { clubRepo } from "@/infra/db/repositories";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  const club = await clubRepo.findBySlug(slug);
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const updated = await clubRepo.updateContent(club.id, body);
  return NextResponse.json({ content: updated.content });
}
