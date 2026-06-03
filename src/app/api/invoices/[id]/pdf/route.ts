import { NextResponse } from "next/server";
import { invoiceRepo } from "@/infra/db/repositories";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await invoiceRepo.findById(id);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  const pdf = await invoiceRepo.generatePDF(invoice);
  return new NextResponse(pdf.toString("utf-8"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
