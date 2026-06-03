import { NextRequest, NextResponse } from "next/server";
import { paymentRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";
import { getPaymentGateway } from "@/modules/payments/gateways";

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const method = body.method as string;
  const amount = body.amount as number;
  if (!method || !amount) return NextResponse.json({ error: "method and amount required" }, { status: 400 });
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const guestId = "00000000-0000-0000-0000-000000000000";
  const tx = await paymentRepo.createTransaction({ clubId: club.id, userId: guestId, amount, currency: "COP", method: method as any });
  const gateway = getPaymentGateway(method as any);
  const methods = await paymentRepo.listMethods(club.id);
  const config = methods.find(m => m.provider === method)?.config || {};
  const result = await gateway.initiatePayment({ amount, currency: "COP", description: `Reserva ${CLUB_CONFIG.shortName}`, customerEmail: "guest@padel.app", customerName: "Jugador", reference: tx.id }, config);
  if (result.success) await paymentRepo.updateStatus(tx.id, "completed", result.gatewayRef);
  else await paymentRepo.updateStatus(tx.id, "failed");
  return NextResponse.json({ transaction: tx, payment: result });
}
