import { NextResponse } from "next/server";
import { partnerPostRepo } from "@/infra/db/repositories";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await partnerPostRepo.deactivate(id);
  return NextResponse.json({ post });
}
