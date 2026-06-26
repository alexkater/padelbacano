import { NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { invoiceRepo, clubRepo, clubConfigRepo } from "@/infra/db/repositories";
import { generateInvoicePdf, type PdfClubInfo } from "@/lib/pdf-generator";
import fs from "node:fs";
import path from "node:path";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await invoiceRepo.findById(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const isOwner = invoice.userId === session.user.id;
  const isClubAdmin = session.user.role === "club_admin" && session.user.clubId === invoice.clubId;
  const isPlatformAdmin = session.user.role === "platform_admin";

  if (!isOwner && !isClubAdmin && !isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const club = await clubRepo.findById(invoice.clubId);
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  let clubNit: string | null = null;
  let logoPath: string | null = club.theme.logoUrl;
  let clubAddress: string | null = club.contact.address ?? null;
  let clubPhone: string | null = club.contact.phone ?? null;
  let clubEmail: string | null = club.contact.email ?? null;

  const clubConfig = await clubConfigRepo.getBySlug(club.slug);
  if (clubConfig) {
    if (!clubNit) clubNit = clubConfig.contact.nit;
    if (!logoPath) logoPath = clubConfig.contact.logoUrl;
    if (!clubPhone) clubPhone = clubConfig.contact.phone;
    if (!clubEmail) clubEmail = clubConfig.contact.email;
  }

  const clubInfo: PdfClubInfo = {
    name: club.name,
    nit: clubNit,
    address: clubAddress,
    phone: clubPhone,
    email: clubEmail,
  };

  let logoBuffer: Buffer | null = null;
  if (logoPath) {
    try {
      const fullPath = path.join(process.cwd(), "public", logoPath.replace(/^\//, ""));
      if (fs.existsSync(fullPath)) {
        logoBuffer = fs.readFileSync(fullPath);
      }
    } catch {
      // logo is optional
    }
  }

  const pdfBuffer = generateInvoicePdf(invoice, clubInfo, logoBuffer);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="factura-${invoice.invoiceNumber}.pdf"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
