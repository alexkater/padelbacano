import { eq } from "drizzle-orm";
import webpush from "web-push";
import type {
  EmailNotification,
  INotificationPort,
  NotificationChannel,
  NotificationEvent,
  NotificationPreferences,
  PushNotification,
  WhatsAppNotification,
} from "@/core/ports/notification-port";
import { db, schema } from "@/infra/db";
import { v4 as uuid } from "@/infra/db/uuid";
import { env } from "@/infra/env";
import { emailService } from "@/infra/notifications/email-service";
import { sendWhatsAppMessage } from "@/infra/notifications/whatsapp-adapter";

// Configure VAPID for web push
const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
const vapidSubject = env.VAPID_SUBJECT ?? "mailto:admin@padelbacano.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailEnabled: true,
  whatsAppEnabled: true,
  pushEnabled: true,
};

async function logNotification(
  event: NotificationEvent,
  channel: NotificationChannel,
  sent: boolean,
  error: string | null = null
): Promise<void> {
  await db.insert(schema.notificationLogs).values({
    id: uuid(),
    userId: event.userId,
    eventType: event.type,
    channel,
    status: sent ? "sent" : "failed",
    retryCount: 0,
    error,
    createdAt: new Date(),
  });
}

export const notificationPort: INotificationPort = {
  async sendEmail(event: NotificationEvent, email: EmailNotification): Promise<boolean> {
    const preferences = await this.getPreferences(event.userId);
    if (!preferences.emailEnabled) {
      await logNotification(event, "email", false, "Email notifications disabled");
      return false;
    }

    try {
      const sent = await emailService.sendNotificationEmail({ event, email });
      await logNotification(event, "email", sent, sent ? null : "Email provider returned false");
      return sent;
    } catch (error) {
      if (error instanceof Error) {
        await logNotification(event, "email", false, error.message);
        return false;
      }
      throw error;
    }
  },

  async sendWhatsApp(event: NotificationEvent, whatsapp: WhatsAppNotification): Promise<boolean> {
    const preferences = await this.getPreferences(event.userId);
    if (!preferences.whatsAppEnabled) {
      await logNotification(event, "whatsapp", false, "WhatsApp notifications disabled");
      return false;
    }

    try {
      const sent = await sendWhatsAppMessage(whatsapp);
      await logNotification(event, "whatsapp", sent, sent ? null : "WhatsApp API returned false");
      return sent;
    } catch (error) {
      if (error instanceof Error) {
        await logNotification(event, "whatsapp", false, error.message);
        return false;
      }
      throw error;
    }
  },

  async sendPush(notification: PushNotification): Promise<boolean> {
    const clubId = notification.data?.clubId;
    if (!clubId) return false;

    const event: NotificationEvent = {
      id: uuid(),
      type: "booking_cancelled",
      userId: notification.userId,
      clubId,
      payload: notification.data ?? {},
      createdAt: new Date(),
    };

    // Mock provider: simulate success without Web Push dependency
    const pushProvider = process.env.PUSH_PROVIDER ?? (vapidPublicKey && vapidPrivateKey ? "webpush" : "log");
    if (pushProvider === "mock") {
      console.info("[push:mock] Mock push notification would send to user", notification.userId, { title: notification.title });
      await logNotification(event, "push", true);
      return true;
    }

    // Check user preferences
    const preferences = await this.getPreferences(notification.userId);
    if (!preferences.pushEnabled) {
      await logNotification(event, "push", false, "Push notifications disabled");
      return false;
    }

    // Find all subscriptions for this user
    const subscriptions = await db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.userId, notification.userId));

    if (subscriptions.length === 0) {
      await logNotification(event, "push", false, "No push subscriptions found");
      return false;
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      await logNotification(event, "push", false, "VAPID keys not configured");
      return false;
    }

    const payload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon ?? "/icon.png",
      data: notification.data ?? {},
    };

    const payloadJson = JSON.stringify(payload);
    let anySent = false;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadJson
        );
        anySent = true;
      } catch (err: unknown) {
        // Remove stale subscriptions (410 Gone)
        if (err instanceof webpush.WebPushError && err.statusCode === 410) {
          await db
            .delete(schema.pushSubscriptions)
            .where(eq(schema.pushSubscriptions.endpoint, sub.endpoint));
        }
      }
    }

    await logNotification(event, "push", anySent, anySent ? null : "All subscriptions failed");
    return anySent;
  },

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const rows = await db
      .select()
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, userId))
      .limit(1);
    const prefs = rows[0];
    return prefs
      ? { emailEnabled: prefs.emailEnabled, whatsAppEnabled: prefs.whatsAppEnabled, pushEnabled: prefs.pushEnabled }
      : DEFAULT_PREFERENCES;
  },

  async updatePreferences(userId: string, prefs: NotificationPreferences): Promise<NotificationPreferences> {
    await db
      .insert(schema.notificationPreferences)
      .values({ userId, ...prefs })
      .onConflictDoUpdate({ target: schema.notificationPreferences.userId, set: prefs });
    return prefs;
  },
};
