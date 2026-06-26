// ─── Notification port ──────────────────────────────────────────────────────

/**
 * Types of notification events that can trigger a notification dispatch.
 */
export const NOTIFICATION_EVENT_TYPES = [
  "booking_created",
  "booking_cancelled",
  "tournament_registered",
  "club_approved",
  "club_rejected",
  "payment_received",
] as const;
export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

/**
 * Delivery channel for a notification.
 */
export const NOTIFICATION_CHANNELS = ["email", "whatsapp", "push"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/**
 * Status of a notification delivery attempt.
 */
export const NOTIFICATION_LOG_STATUSES = ["pending", "sent", "failed"] as const;
export type NotificationLogStatus = (typeof NOTIFICATION_LOG_STATUSES)[number];

/**
 * A notification event represents a domain event that may trigger
 * one or more notification dispatches across different channels.
 */
export type NotificationEvent = {
  /** Unique event identifier */
  id: string;
  /** The type of event that occurred */
  type: NotificationEventType;
  /** The user who is the subject/recipient of this event */
  userId: string;
  /** The club this event relates to */
  clubId: string;
  /** Event-specific payload (varies by event type) */
  payload: Record<string, unknown>;
  /** When the event was created */
  createdAt: Date;
};

/**
 * Email notification payload.
 */
export type EmailNotification = {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** HTML body content */
  htmlBody: string;
  /** Optional template identifier for provider-based sending */
  templateId?: string;
};

/**
 * WhatsApp notification payload.
 * Phone numbers use +57 format for Colombia.
 */
export type WhatsAppNotification = {
  /** Recipient phone number in +57 format (e.g. +573001234567) */
  to: string;
  /** WhatsApp template name registered with the Business API */
  templateName: string;
  /** Template parameter values */
  params: Record<string, string>;
};

/**
 * Push notification payload for web push / PWA.
 */
export type PushNotification = {
  /** Target user ID */
  userId: string;
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** Optional icon URL */
  icon?: string;
  /** Optional custom data payload */
  data?: Record<string, string>;
};

/**
 * User notification preferences.
 * Controls which channels are enabled per user.
 */
export type NotificationPreferences = {
  /** Whether email notifications are enabled */
  emailEnabled: boolean;
  /** Whether WhatsApp notifications are enabled */
  whatsAppEnabled: boolean;
  /** Whether push notifications are enabled */
  pushEnabled: boolean;
};

/**
 * Log entry for a notification delivery attempt.
 */
export type NotificationLog = {
  /** Unique log entry ID */
  id: string;
  /** The event type that triggered this notification */
  eventType: NotificationEventType;
  /** The delivery channel used */
  channel: NotificationChannel;
  /** Delivery status */
  status: NotificationLogStatus;
  /** Number of retry attempts so far */
  retryCount: number;
  /** When the notification was created/queued */
  createdAt: Date;
};

/**
 * Core notification port.
 *
 * Implementations handle actual delivery via SMTP, WhatsApp Business API,
 * or Web Push. This port is consumed by use cases that produce domain events.
 */
export interface INotificationPort {
  /** Send an email notification */
  sendEmail(event: NotificationEvent, email: EmailNotification): Promise<boolean>;

  /** Send a WhatsApp notification */
  sendWhatsApp(event: NotificationEvent, whatsapp: WhatsAppNotification): Promise<boolean>;

  /** Send a push notification */
  sendPush(notification: PushNotification): Promise<boolean>;

  /** Get notification preferences for a user */
  getPreferences(userId: string): Promise<NotificationPreferences>;

  /** Update notification preferences for a user */
  updatePreferences(userId: string, prefs: NotificationPreferences): Promise<NotificationPreferences>;
}
