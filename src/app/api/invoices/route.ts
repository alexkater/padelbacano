import { NextRequest, NextResponse } from "next/server";
import { invoiceRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

export async function GET() {
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  const invoices = await invoiceRepo.listByClub(club.id);
  return NextResponse.json({ invoices });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const items = (body.items as any[]) || [];
  const subtotal = items.reduce((s: number, i: any) => s + (i.unitPrice * i.quantity), 0);
  const taxRate = 1900; // 19% IVA Colombia
  const taxAmount = Math.round(subtotal * taxRate / 10000);
  const total = subtotal + taxAmount;
  const prefix = (body.prefix as string) || "FE";
  const consecutive = await invoiceRepo.getNextConsecutive(club.id, prefix);
  const guestId = "00000000-0000-0000-0000-000000000000";

  const invoice = await invoiceRepo.create({
    clubId: club.id, userId: (body.userId as string) || guestId,
    invoiceNumber: `${prefix}-${String(consecutive).padStart(5, "0")}`,
    prefix, consecutive,
    issueDate: new Date(), dueDate: body.dueDate ? new Date(body.dueDate as string) : null,
    subtotal, taxRate, taxAmount, total, currency: "COP", status: "draft",
    customerName: (body.customerName as string) || "Cliente",
    customerDocument: (body.customerDocument as string) || null,
    customerDocumentType: (body.customerDocumentType as any) || null,
    customerEmail: (body.customerEmail as string) || null,
    customerPhone: (body.customerPhone as string) || null,
    customerAddress: (body.customerAddress as string) || null,
    paymentMethod: (body.paymentMethod as string) || null,
    notes: (body.notes as string) || null,
  }, items.map((i: any) => ({
    description: i.description, quantity: i.quantity || 1,
    unitPrice: i.unitPrice, subtotal: i.unitPrice * (i.quantity || 1),
    bookingId: i.bookingId || null,
  })));

  return NextResponse.json({ invoice }, { status: 201 });
}
