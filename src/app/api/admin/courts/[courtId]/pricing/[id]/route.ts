import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, lt, gt } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/infra/db/index";
import {
  isAccessResponse,
  overlaps,
  requireAdminCourtAccess,
} from "../../maintenance/maintenance-admin";

const pricingUpdateSchema = z.object({
  weekday: z.number().int().min(0).max(6).optional(),
  startTime: z.iso.datetime().optional(),
  endTime: z.iso.datetime().optional(),
  priceInCents: z.number().int().positive().optional(),
  isPeak: z.boolean().optional(),
});

type PricingEntryParams = {
  readonly params: Promise<{ readonly courtId: string; readonly id: string }>;
};

export async function PUT(
  request: NextRequest,
  { params }: PricingEntryParams
): Promise<NextResponse> {
  const { courtId, id } = await params;
  const access = await requireAdminCourtAccess(courtId);
  if (isAccessResponse(access)) return access;

  const existing = (await db
    .select()
    .from(schema.courtPricing)
    .where(and(eq(schema.courtPricing.id, id), eq(schema.courtPricing.courtId, access.courtId)))
    .limit(1))[0];

  if (!existing) {
    return NextResponse.json({ error: "Pricing entry not found" }, { status: 404 });
  }

  const parsed = pricingUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const newStartTime = parsed.data.startTime ? new Date(parsed.data.startTime) : existing.startTime;
  const newEndTime = parsed.data.endTime ? new Date(parsed.data.endTime) : existing.endTime;

  if (newStartTime >= newEndTime) {
    return NextResponse.json({ error: "startTime must be before endTime" }, { status: 400 });
  }

  const weekday = parsed.data.weekday ?? existing.weekday;

  // Check for overlapping entries (excluding self)
  const others = await db
    .select()
    .from(schema.courtPricing)
    .where(
      and(
        eq(schema.courtPricing.courtId, access.courtId),
        eq(schema.courtPricing.weekday, weekday),
        ne(schema.courtPricing.id, id),
        lt(schema.courtPricing.startTime, newEndTime),
        gt(schema.courtPricing.endTime, newStartTime)
      )
    );

  if (others.some((row) => overlaps(newStartTime, newEndTime, row.startTime, row.endTime))) {
    return NextResponse.json(
      { error: "Updated pricing overlaps an existing entry" },
      { status: 409 }
    );
  }

  const [updated] = await db
    .update(schema.courtPricing)
    .set({
      weekday,
      startTime: newStartTime,
      endTime: newEndTime,
      priceInCents: parsed.data.priceInCents ?? existing.priceInCents,
      isPeak: parsed.data.isPeak ?? existing.isPeak,
    })
    .where(eq(schema.courtPricing.id, id))
    .returning();

  return NextResponse.json({ entry: updated ?? null });
}

export async function DELETE(
  _request: NextRequest,
  { params }: PricingEntryParams
): Promise<NextResponse> {
  const { courtId, id } = await params;
  const access = await requireAdminCourtAccess(courtId);
  if (isAccessResponse(access)) return access;

  const entry = (await db
    .select({ id: schema.courtPricing.id })
    .from(schema.courtPricing)
    .where(and(eq(schema.courtPricing.id, id), eq(schema.courtPricing.courtId, access.courtId)))
    .limit(1))[0];

  if (!entry) {
    return NextResponse.json({ error: "Pricing entry not found" }, { status: 404 });
  }

  await db.delete(schema.courtPricing).where(eq(schema.courtPricing.id, entry.id));

  return NextResponse.json({ success: true });
}
