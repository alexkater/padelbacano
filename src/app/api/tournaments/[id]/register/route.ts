import { NextResponse } from "next/server";
import { tournamentRepo } from "@/infra/db/repositories";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guestId = "00000000-0000-0000-0000-000000000000";
  const registration = await tournamentRepo.register(id, guestId);
  return NextResponse.json({ registration }, { status: 201 });
}
