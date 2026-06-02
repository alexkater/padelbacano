import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/infra/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  const club = db.select().from(schema.clubs).where(eq(schema.clubs.slug, slug)).get();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const current = club.cancellationPolicy;
  const merged = {
    minHoursBefore: body.minHoursBefore ?? current.minHoursBefore,
    penaltyPercent: body.penaltyPercent ?? current.penaltyPercent,
    allowRefund: body.allowRefund ?? current.allowRefund,
  };

  db.update(schema.clubs)
    .set({ cancellationPolicy: merged, updatedAt: new Date() })
    .where(eq(schema.clubs.slug, slug))
    .run();

  return NextResponse.json({ cancellationPolicy: merged });
}
