import { NextResponse } from "next/server";
import { announcementRepo } from "@/infra/db/repositories";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await announcementRepo.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  await announcementRepo.delete(id);
  return NextResponse.json({ deleted: true });
}
