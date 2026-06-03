import { NextResponse } from "next/server";
import { schoolRepo } from "@/infra/db/repositories";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guestId = "00000000-0000-0000-0000-000000000000";
  const enrollment = await schoolRepo.enrollStudent(id, guestId);
  return NextResponse.json({ enrollment }, { status: 201 });
}
