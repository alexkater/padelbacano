// ─── Notification dispatch system ──────────────────────────────────────────
//
// Orchestrates email + WhatsApp delivery with retry, logging, and respect
// for user notification_preferences. Used by API routes to fire domain
// events (booking_created, booking_cancelled, club_approved) and have them
// reliably routed to the appropriate channels without blocking the caller.
//
// Retry: 3 attempts with exponential backoff (1s, 4s, 16s).
// Log:  each attempt is recorded in notification_log with status + retryCount.
// Safety: never throws — failures are logged, not propagated.

import { eq } from "drizzle-orm";
import { v4 as uuid } from "@/infra/db/uuid";
import { db, schema } from "@/infra/db";
import type {
  EmailNotification,
  NotificationChannel,
  NotificationEvent,
  WhatsAppNotification,
} from "@/core/ports/notification-port";
import { emailService } from "@/infra/notifications/email-service";
import { sendWhatsAppMessage } from "@/infra/notifications/whatsapp-adapter";

// ─── Config ─────────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS: readonly number[] = [1_000, 4_000, 16_000];

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadPreferences(userId: string): Promise<{
  emailEnabled: boolean;
  whatsAppEnabled: boolean;
  pushEnabled: boolean;
}> {
  const rows = await db
    .select()
    .from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.userId, userId))
    .limit(1);
  const prefs = rows[0];
  return {
    emailEnabled: prefs?.emailEnabled ?? true,
    whatsAppEnabled: prefs?.whatsAppEnabled ?? true,
    pushEnabled: prefs?.pushEnabled ?? true,
  };
}

async function writeLog(
  event: NotificationEvent,
  channel: NotificationChannel,
  status: "pending" | "sent" | "failed",
  retryCount: number,
  error: string | null = null,
): Promise<void> {
  await db.insert(schema.notificationLogs).values({
    id: uuid(),
    userId: event.userId,
    eventType: event.type,
    channel,
    status,
    retryCount,
    error,
    createdAt: new Date(),
  });
}

/**
 * Deliver a notification through a single channel with up to 3 retries.
 *
 * Each attempt is logged to `notification_log`. Returns `true` if any
 * attempt succeeded, `false` if all attempts failed. Never throws.
 *
 * This is also exported for cases where the caller needs direct control
 * (e.g. sending to an unregistered email address in the approval flow).
 */
export async function deliverWithRetry(
  event: NotificationEvent,
  channel: NotificationChannel,
  attempt: () => Promise<boolean>,
): Promise<boolean> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    let ok = false;
    let error: string | null = null;

    try {
      ok = await attempt();
      if (!ok) {
        error = "Provider returned false";
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : String(err);
    }

    await writeLog(event, channel, ok ? "sent" : "failed", i, ok ? null : error);

    if (ok) return true;

    // Wait before the next retry (skip on the last iteration)
    if (i < MAX_RETRIES - 1) {
      await sleep(RETRY_DELAYS_MS[i] ?? 1_000);
    }
  }

  return false;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Send an email notification with retry.
 *
 * Checks the user's notification_preferences first. If email is disabled
 * the attempt is logged as "failed" and the function returns `false`.
 *
 * Never throws — errors are caught, logged, and swallowed.
 */
export async function dispatchEmail(
  event: NotificationEvent,
  email: EmailNotification,
): Promise<boolean> {
  const prefs = await loadPreferences(event.userId);
  if (!prefs.emailEnabled) {
    await writeLog(event, "email", "failed", 0, "Email notifications disabled by user");
    return false;
  }

  return deliverWithRetry(event, "email", () =>
    emailService.sendNotificationEmail({ event, email }),
  );
}

/**
 * Send a WhatsApp notification with retry.
 *
 * Checks the user's notification_preferences first. If WhatsApp is disabled
 * the attempt is logged as "failed" and the function returns `false`.
 *
 * Never throws — errors are caught, logged, and swallowed.
 */
export async function dispatchWhatsApp(
  event: NotificationEvent,
  whatsapp: WhatsAppNotification,
): Promise<boolean> {
  const prefs = await loadPreferences(event.userId);
  if (!prefs.whatsAppEnabled) {
    await writeLog(event, "whatsapp", "failed", 0, "WhatsApp notifications disabled by user");
    return false;
  }

  return deliverWithRetry(event, "whatsapp", () => sendWhatsAppMessage(whatsapp));
}
