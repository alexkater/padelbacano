import { NextRequest, NextResponse } from "next/server";
import { invoiceRepo } from "@/infra/db/repositories";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  const status = body.status as string;
  const invoice = await invoiceRepo.updateStatus(id, status as any, {
    cufe: body.cufe as string,
    dianStatus: body.dianStatus as any,
  });
  return NextResponse.json({ invoice });
}
