import { NextRequest, NextResponse } from "next/server";
import { paymentRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";
import { listGateways } from "@/modules/payments/gateways";

export async function GET() {
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const methods = await paymentRepo.listMethods(club.id);
  const gateways = listGateways();
  return NextResponse.json({ methods, available: gateways.map(g => ({ provider: g.provider, name: g.displayName })) });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const provider = body.provider as string;
  const config = (body.config as Record<string, string>) || {};
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const method = await paymentRepo.enableMethod(club.id, provider as any, config);
  return NextResponse.json({ method }, { status: 201 });
}
