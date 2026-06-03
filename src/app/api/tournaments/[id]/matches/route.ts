import { NextResponse } from "next/server";
import { tournamentRepo } from "@/infra/db/repositories";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matches = await tournamentRepo.listMatches(id);
  return NextResponse.json({ matches });
}
