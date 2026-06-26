import { NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { invoiceRepo } from "@/infra/db/repositories";
import { db, schema } from "@/infra/db";
import { eq } from "drizzle-orm";
import { generateUblXml } from "@/infra/invoicing/ubl-xml-generator";

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

  // Verify the authenticated user belongs to the same club as the invoice
  const userClubId = session.user.clubId;
  if (invoice.clubId !== userClubId) {
    return NextResponse.json({ error: "Forbidden: invoice belongs to another club" }, { status: 403 });
  }

  // Fetch club data for the supplier party
  const clubRows = await db
    .select()
    .from(schema.clubs)
    .where(eq(schema.clubs.id, invoice.clubId))
    .limit(1);
  const club = clubRows[0];
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 500 });
  }

  // Fetch club config for NIT
  const configRows = await db
    .select()
    .from(schema.clubConfigs)
    .where(eq(schema.clubConfigs.clubId, invoice.clubId))
    .limit(1);
  const clubConfig = configRows[0];

  const supplierNit = clubConfig?.nit || null;
  const supplierName = club.name;
  const supplierAddress = club.contact?.address || null;
  const supplierPhone = club.contact?.phone || null;
  const supplierEmail = club.contact?.email || null;

  const xml = generateUblXml({
    invoice,
    supplierNit,
    supplierName,
    supplierAddress,
    supplierPhone,
    supplierEmail,
  });

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.xml"`,
    },
  });
}
