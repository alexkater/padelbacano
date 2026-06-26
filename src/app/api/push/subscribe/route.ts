// ─── Push subscription API ───────────────────────────────────────────────────
//
// POST /api/push/subscribe → stores a PushSubscription in push_subscriptions
// DELETE /api/push/subscribe → removes a PushSubscription by endpoint
//
// Both require authentication.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/infra/auth/config";
import { db, schema } from "@/infra/db";
import { v4 as uuid } from "@/infra/db/uuid";

/**
 * POST /api/push/subscribe
 * Saves a Web Push subscription for the authenticated user.
 * Body: { endpoint, keys: { p256dh, auth } }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const endpoint = typeof input.endpoint === "string" ? input.endpoint : "";
  const keys = input.keys as Record<string, unknown> | undefined;
  const p256dh = typeof keys?.p256dh === "string" ? keys.p256dh : "";
  const authKey = typeof keys?.auth === "string" ? keys.auth : "";

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json(
      { error: "Missing required fields: endpoint, keys.p256dh, keys.auth" },
      { status: 400 }
    );
  }

  // Upsert: if the same endpoint already exists (e.g. from a different device
  // or re-registration), update the keys and userId.
  const existing = await db
    .select({ id: schema.pushSubscriptions.id })
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.endpoint, endpoint))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(schema.pushSubscriptions)
      .set({ p256dh, auth: authKey, userId: session.user.id })
      .where(eq(schema.pushSubscriptions.id, existing[0].id));

    return NextResponse.json({ status: "updated" });
  }

  await db.insert(schema.pushSubscriptions).values({
    id: uuid(),
    userId: session.user.id,
    endpoint,
    p256dh,
    auth: authKey,
  });

  return NextResponse.json({ status: "subscribed" }, { status: 201 });
}

/**
 * DELETE /api/push/subscribe
 * Removes a push subscription by endpoint.
 * Body: { endpoint }
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const endpoint = typeof input.endpoint === "string" ? input.endpoint : "";

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await db
    .delete(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.endpoint, endpoint));

  return NextResponse.json({ status: "unsubscribed" });
}
