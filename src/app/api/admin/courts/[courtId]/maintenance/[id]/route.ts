import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/infra/db/index";
import { isAccessResponse, requireAdminCourtAccess } from "../maintenance-admin";

type DeleteParams = {
  readonly params: Promise<{ readonly courtId: string; readonly id: string }>;
};

export async function DELETE(_request: NextRequest, { params }: DeleteParams): Promise<NextResponse> {
  const { courtId, id } = await params;
  const access = await requireAdminCourtAccess(courtId);
  if (isAccessResponse(access)) return access;

  const block = (await db
    .select({ id: schema.maintenanceBlocks.id })
    .from(schema.maintenanceBlocks)
    .where(
      and(
        eq(schema.maintenanceBlocks.id, id),
        eq(schema.maintenanceBlocks.courtId, access.courtId)
      )
    )
    .limit(1))[0];

  if (!block) {
    return NextResponse.json({ error: "Maintenance block not found" }, { status: 404 });
  }

  await db.delete(schema.maintenanceBlocks).where(eq(schema.maintenanceBlocks.id, block.id));

  return NextResponse.json({ success: true });
}
