// ─── Notification preferences API ──────────────────────────────────────────
//
// GET  /api/user/notifications → current preferences
// PUT  /api/user/notifications → update preferences
//
// Both require authentication.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { notificationPort } from "@/infra/notifications";
import type { NotificationPreferences } from "@/core/ports/notification-port";

/**
 * GET /api/user/notifications
 * Return the authenticated user's current notification preferences.
 * Defaults to all enabled if no row exists yet.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await notificationPort.getPreferences(session.user.id);

  return NextResponse.json({ preferences: prefs });
}

/**
 * PUT /api/user/notifications
 * Update notification preferences for the authenticated user.
 * Accepts partial updates — only provided fields are changed.
 */
export async function PUT(request: NextRequest) {
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

  // Read current preferences to merge partial updates
  const current = await notificationPort.getPreferences(session.user.id);

  const updated: NotificationPreferences = {
    emailEnabled: typeof input.emailEnabled === "boolean" ? input.emailEnabled : current.emailEnabled,
    whatsAppEnabled: typeof input.whatsAppEnabled === "boolean" ? input.whatsAppEnabled : current.whatsAppEnabled,
    pushEnabled: typeof input.pushEnabled === "boolean" ? input.pushEnabled : current.pushEnabled,
  };

  const result = await notificationPort.updatePreferences(session.user.id, updated);

  return NextResponse.json({ preferences: result });
}
