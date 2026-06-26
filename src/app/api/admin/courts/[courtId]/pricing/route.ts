import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gt, lt } from "drizzle-orm";
import { z } from "zod";
import { v4 as uuid } from "@/infra/db/uuid";
import { db, schema } from "@/infra/db/index";
import {
  isAccessResponse,
  overlaps,
  requireAdminCourtAccess,
} from "../maintenance/maintenance-admin";

const pricingEntrySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  priceInCents: z.number().int().positive(),
  isPeak: z.boolean().default(false),
});

type PricingParams = {
  readonly params: Promise<{ readonly courtId: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: PricingParams
): Promise<NextResponse> {
  const { courtId } = await params;
  const access = await requireAdminCourtAccess(courtId);
  if (isAccessResponse(access)) return access;

  const entries = await db
    .select()
    .from(schema.courtPricing)
    .where(eq(schema.courtPricing.courtId, access.courtId))
    .orderBy(asc(schema.courtPricing.weekday), asc(schema.courtPricing.startTime));

  return NextResponse.json({ entries });
}

export async function POST(
  request: NextRequest,
  { params }: PricingParams
): Promise<NextResponse> {
  const { courtId } = await params;
  const access = await requireAdminCourtAccess(courtId);
  if (isAccessResponse(access)) return access;

  const parsed = pricingEntrySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid pricing data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { weekday, priceInCents, isPeak } = parsed.data;
  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(parsed.data.endTime);

  if (startTime >= endTime) {
    return NextResponse.json(
      { error: "startTime must be before endTime" },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(schema.courtPricing)
    .where(
      and(
        eq(schema.courtPricing.courtId, access.courtId),
        eq(schema.courtPricing.weekday, weekday),
        lt(schema.courtPricing.startTime, endTime),
        gt(schema.courtPricing.endTime, startTime)
      )
    );

  if (
    existing.some((row) => overlaps(startTime, endTime, row.startTime, row.endTime))
  ) {
    return NextResponse.json(
      { error: "Pricing entry overlaps an existing entry for this weekday" },
      { status: 409 }
    );
  }

  const entry = {
    id: uuid(),
    courtId: access.courtId,
    weekday,
    startTime,
    endTime,
    priceInCents,
    isPeak,
  };

  await db.insert(schema.courtPricing).values(entry);

  return NextResponse.json({ entry }, { status: 201 });
}
