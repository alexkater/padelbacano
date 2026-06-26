import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gt, lt } from "drizzle-orm";
import { z } from "zod";
import { v4 as uuid } from "@/infra/db/uuid";
import { db, schema } from "@/infra/db/index";
import { isAccessResponse, overlaps, requireAdminCourtAccess } from "./maintenance-admin";

const maintenanceBlockSchema = z.object({
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  reason: z.string().trim().min(1).max(240),
});

type MaintenanceParams = {
  readonly params: Promise<{ readonly courtId: string }>;
};

export async function GET(_request: NextRequest, { params }: MaintenanceParams): Promise<NextResponse> {
  const { courtId } = await params;
  const access = await requireAdminCourtAccess(courtId);
  if (isAccessResponse(access)) return access;

  const blocks = await db
    .select()
    .from(schema.maintenanceBlocks)
    .where(eq(schema.maintenanceBlocks.courtId, access.courtId))
    .orderBy(asc(schema.maintenanceBlocks.startTime));

  return NextResponse.json({ blocks });
}

export async function POST(request: NextRequest, { params }: MaintenanceParams): Promise<NextResponse> {
  const { courtId } = await params;
  const access = await requireAdminCourtAccess(courtId);
  if (isAccessResponse(access)) return access;

  const parsed = maintenanceBlockSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "startTime, endTime and reason are required" },
      { status: 400 }
    );
  }

  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(parsed.data.endTime);
  if (startTime >= endTime) {
    return NextResponse.json({ error: "startTime must be before endTime" }, { status: 400 });
  }

  const existingBlocks = await db
    .select()
    .from(schema.maintenanceBlocks)
    .where(
      and(
        eq(schema.maintenanceBlocks.courtId, access.courtId),
        lt(schema.maintenanceBlocks.startTime, endTime),
        gt(schema.maintenanceBlocks.endTime, startTime)
      )
    );

  if (existingBlocks.some((block) => overlaps(startTime, endTime, block.startTime, block.endTime))) {
    return NextResponse.json({ error: "Maintenance block overlaps an existing block" }, { status: 409 });
  }

  const block = {
    id: uuid(),
    courtId: access.courtId,
    startTime,
    endTime,
    reason: parsed.data.reason,
    createdBy: access.userId,
  };

  await db.insert(schema.maintenanceBlocks).values(block);

  return NextResponse.json({ block }, { status: 201 });
}
