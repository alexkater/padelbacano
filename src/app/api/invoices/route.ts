import { NextRequest, NextResponse } from "next/server";
import { invoiceRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";
import { auth } from "@/infra/auth/config";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));

  const result = await invoiceRepo.listByClubFiltered(club.id, {
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
    offset,
    limit,
  });

  return NextResponse.json(result);
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
    prefix, consecutive, nit: null,
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
