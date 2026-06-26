// ─── Push send API ───────────────────────────────────────────────────────────
//
// POST /api/push/send → delivers a push notification to a user
//
// Requires authentication (admin only in production, for now any authed user
// can push to themselves — used by the profile page for testing).

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import webpush from "web-push";
import { auth } from "@/infra/auth/config";
import { db, schema } from "@/infra/db";
import { env } from "@/infra/env";

// Configure VAPID details once
const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
const vapidSubject = env.VAPID_SUBJECT ?? "mailto:admin@padelbacano.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
};

/**
 * POST /api/push/send
 * Sends a push notification to all subscriptions owned by the specified user.
 * Body: { userId, title, body, icon?, data? }
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

  // The target userId — defaults to the sender's own ID
  const targetUserId = typeof input.userId === "string" ? input.userId : session.user.id;

  const payload: PushPayload = {
    title: typeof input.title === "string" ? input.title : "PádelBacano",
    body: typeof input.body === "string" ? input.body : "",
    icon: typeof input.icon === "string" ? input.icon : "/icon.png",
    data: input.data && typeof input.data === "object" ? (input.data as Record<string, string>) : {},
  };

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 500 }
    );
  }

  // Fetch all subscriptions for the target user
  const subscriptions = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userId, targetUserId));

  if (subscriptions.length === 0) {
    return NextResponse.json(
      { error: "No push subscriptions found for user" },
      { status: 404 }
    );
  }

  const payloadJson = JSON.stringify(payload);
  const results: { endpoint: string; ok: boolean; error?: string }[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payloadJson
      );
      results.push({ endpoint: sub.endpoint, ok: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      // If the subscription is expired/invalid (410 Gone), remove it
      if (err instanceof webpush.WebPushError && err.statusCode === 410) {
        await db
          .delete(schema.pushSubscriptions)
          .where(eq(schema.pushSubscriptions.endpoint, sub.endpoint));
      }

      results.push({ endpoint: sub.endpoint, ok: false, error: message });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return NextResponse.json({
    sent,
    failed,
    total: subscriptions.length,
    details: results,
  });
}
