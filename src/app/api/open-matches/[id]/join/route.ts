import { NextResponse } from "next/server";
import { openMatchRepo } from "@/infra/db/repositories";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guestId = "00000000-0000-0000-0000-000000000000";
  const player = await openMatchRepo.joinMatch(id, guestId);
  const match = await openMatchRepo.findById(id);
  return NextResponse.json({ player, match });
}
