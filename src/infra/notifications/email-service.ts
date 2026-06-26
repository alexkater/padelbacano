import nodemailer from "nodemailer";
import { z } from "zod";
import type { EmailPayload, IEmailService } from "@/core/ports/email-service";
import type { EmailNotification, NotificationEvent } from "@/core/ports/notification-port";
import { env } from "@/infra/env";

const COT_TIME_ZONE = "America/Bogota";
const DEFAULT_POLICY_PATH = "/politicas/cancelacion";

const templateIds = ["booking_confirmation", "booking_cancellation", "club_approved", "club_rejected"] as const;
type EmailTemplateId = (typeof templateIds)[number];

type SmtpConfig = {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly pass: string;
  readonly from: string;
};

type NotificationEmailRequest = {
  readonly event: NotificationEvent;
  readonly email: EmailNotification;
};

type RenderedEmail = {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
};

const bookingPayloadSchema = z.object({
  clubName: z.string().optional(),
  courtName: z.string().optional(),
  startTime: z.union([z.string(), z.date()]).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  duration: z.number().int().positive().optional(),
  priceInCents: z.number().int().nonnegative().optional(),
  price: z.number().int().nonnegative().optional(),
  cancellationPolicyUrl: z.string().optional(),
  cancellationPolicyLink: z.string().optional(),
});

const clubApprovedPayloadSchema = z.object({
  clubName: z.string().optional(),
  dashboardUrl: z.string().optional(),
});

const clubRejectedPayloadSchema = z.object({
  clubName: z.string().optional(),
  reason: z.string().optional(),
});

function parseSmtpConfig(): SmtpConfig | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    return null;
  }

  return {
    host: env.SMTP_HOST,
    port: Number.parseInt(env.SMTP_PORT ?? "587", 10),
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateTime(value: string | Date | undefined): { readonly date: string; readonly time: string } {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { date: "Fecha por confirmar", time: "Hora por confirmar" };
  }

  return {
    date: new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeZone: COT_TIME_ZONE }).format(date),
    time: new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: COT_TIME_ZONE }).format(date),
  };
}

function formatCop(cents: number | undefined): string {
  if (cents === undefined) {
    return "Por confirmar";
  }

  return new Intl.NumberFormat("es-CO", { currency: "COP", style: "currency", maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

function appUrl(path: string): string {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    return path;
  }

  return new URL(path, baseUrl).toString();
}

function templateIdFor(event: NotificationEvent, email: EmailNotification): EmailTemplateId | null {
  if (email.templateId === "booking_confirmation") return "booking_confirmation";
  if (email.templateId === "booking_cancellation") return "booking_cancellation";
  if (email.templateId === "club_approved") return "club_approved";
  if (email.templateId === "club_rejected") return "club_rejected";

  if (event.type === "booking_created") return "booking_confirmation";
  if (event.type === "booking_cancelled") return "booking_cancellation";
  if (event.type === "club_approved") return "club_approved";
  if (event.type === "club_rejected") return "club_rejected";

  return null;
}

function renderBookingTemplate(request: NotificationEmailRequest, variant: "confirmation" | "cancellation"): RenderedEmail {
  const parsed = bookingPayloadSchema.safeParse(request.event.payload);
  const payload = parsed.success ? parsed.data : {};
  const fallbackDateTime = formatDateTime(payload.startTime);
  const clubName = payload.clubName ?? "PádelBacano";
  const date = payload.date ?? fallbackDateTime.date;
  const time = payload.time ?? fallbackDateTime.time;
  const priceInCents = payload.priceInCents ?? payload.price;
  const policyUrl = payload.cancellationPolicyUrl ?? payload.cancellationPolicyLink ?? appUrl(DEFAULT_POLICY_PATH);
  const title = variant === "confirmation" ? "Reserva confirmada" : "Reserva cancelada";

  return {
    to: request.email.to,
    subject: `${title} — ${clubName}`,
    html: `
      <main style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <h1>${escapeHtml(title)}</h1>
        <p>Hola, estos son los detalles de tu reserva en <strong>${escapeHtml(clubName)}</strong>.</p>
        <ul>
          <li><strong>Club:</strong> ${escapeHtml(clubName)}</li>
          <li><strong>Cancha:</strong> ${escapeHtml(payload.courtName ?? "Por confirmar")}</li>
          <li><strong>Fecha:</strong> ${escapeHtml(date)} (COT)</li>
          <li><strong>Hora:</strong> ${escapeHtml(time)} (COT)</li>
          <li><strong>Duración:</strong> ${escapeHtml(String(payload.duration ?? "Por confirmar"))} min</li>
          <li><strong>Precio:</strong> ${escapeHtml(formatCop(priceInCents))}</li>
        </ul>
        <p>Consulta la política de cancelación aquí: <a href="${escapeHtml(policyUrl)}">Política de cancelación</a>.</p>
      </main>
    `,
  };
}

function renderClubApprovedTemplate(request: NotificationEmailRequest): RenderedEmail {
  const parsed = clubApprovedPayloadSchema.safeParse(request.event.payload);
  const payload = parsed.success ? parsed.data : {};
  const clubName = payload.clubName ?? "tu club";
  const dashboardUrl = payload.dashboardUrl ?? appUrl("/admin");

  return {
    to: request.email.to,
    subject: "¡Tu club ha sido aprobado! — PádelBacano",
    html: `
      <main style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <h1>¡Tu club ha sido aprobado!</h1>
        <p>El club <strong>${escapeHtml(clubName)}</strong> ya puede empezar a recibir reservas en PádelBacano.</p>
        <p>Entra al panel para completar horarios, canchas, precios y políticas de cancelación.</p>
        <p><a href="${escapeHtml(dashboardUrl)}">Abrir panel de administración</a></p>
      </main>
    `,
  };
}

function renderClubRejectedTemplate(request: NotificationEmailRequest): RenderedEmail {
  const parsed = clubRejectedPayloadSchema.safeParse(request.event.payload);
  const payload = parsed.success ? parsed.data : {};
  const clubName = payload.clubName ?? "tu club";
  const reason = payload.reason ?? "No se ha especificado un motivo.";

  return {
    to: request.email.to,
    subject: "Solicitud de club no aprobada — PádelBacano",
    html: `
      <main style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <h1>Solicitud no aprobada</h1>
        <p>La solicitud del club <strong>${escapeHtml(clubName)}</strong> no ha sido aprobada.</p>
        <p><strong>Motivo:</strong> ${escapeHtml(reason)}</p>
        <p>Si tienes dudas, contáctanos respondiendo a este correo.</p>
      </main>
    `,
  };
}

function renderNotificationEmail(request: NotificationEmailRequest): RenderedEmail {
  const templateId = templateIdFor(request.event, request.email);
  switch (templateId) {
    case "booking_confirmation":
      return renderBookingTemplate(request, "confirmation");
    case "booking_cancellation":
      return renderBookingTemplate(request, "cancellation");
    case "club_approved":
      return renderClubApprovedTemplate(request);
    case "club_rejected":
      return renderClubRejectedTemplate(request);
    case null:
      return { to: request.email.to, subject: request.email.subject, html: request.email.htmlBody };
  }
}

class SmtpEmailService implements IEmailService {
  private readonly smtpConfig: SmtpConfig | null;
  private readonly provider: string;

  constructor() {
    this.smtpConfig = parseSmtpConfig();
    this.provider = process.env.EMAIL_PROVIDER ?? (this.smtpConfig ? "smtp" : "log");
  }

  async send(payload: EmailPayload): Promise<boolean> {
    return this.deliver(payload);
  }

  async sendNotificationEmail(request: NotificationEmailRequest): Promise<boolean> {
    return this.deliver(renderNotificationEmail(request));
  }

  async sendBookingConfirmation(userEmail: string, bookingDetails: Parameters<IEmailService["sendBookingConfirmation"]>[1]) {
    return this.deliver({
      to: userEmail,
      subject: `Reserva confirmada — ${bookingDetails.clubName}`,
      html: renderBookingTemplate(
        {
          event: {
            id: "direct-booking-confirmation",
            type: "booking_created",
            userId: "direct",
            clubId: "direct",
            payload: bookingDetails,
            createdAt: new Date(),
          },
          email: { to: userEmail, subject: "", htmlBody: "", templateId: "booking_confirmation" },
        },
        "confirmation"
      ).html,
    });
  }

  async sendClubRejectionNotice(userEmail: string, details: { clubName: string; reason: string }) {
    return this.deliver({
      to: userEmail,
      subject: "Solicitud de club no aprobada — PádelBacano",
      html: `
        <main style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
          <h1>Solicitud no aprobada</h1>
          <p>La solicitud del club <strong>${escapeHtml(details.clubName)}</strong> no ha sido aprobada.</p>
          <p><strong>Motivo:</strong> ${escapeHtml(details.reason)}</p>
          <p>Si tienes dudas, contáctanos respondiendo a este correo.</p>
        </main>
      `,
    });
  }

  async sendCancellationNotice(userEmail: string, bookingDetails: Parameters<IEmailService["sendCancellationNotice"]>[1]) {
    return this.deliver({
      to: userEmail,
      subject: `Reserva cancelada — ${bookingDetails.clubName}`,
      html: renderBookingTemplate(
        {
          event: {
            id: "direct-booking-cancellation",
            type: "booking_cancelled",
            userId: "direct",
            clubId: "direct",
            payload: bookingDetails,
            createdAt: new Date(),
          },
          email: { to: userEmail, subject: "", htmlBody: "", templateId: "booking_cancellation" },
        },
        "cancellation"
      ).html,
    });
  }

  private async deliver(payload: EmailPayload): Promise<boolean> {
    // Mock provider: simulate success without external dependency
    if (this.provider === "mock") {
      console.info("[email:mock] Mock email send (would send to", payload.to, ")", { subject: payload.subject });
      return true;
    }

    if (!this.smtpConfig) {
      console.info("SMTP not configured; email logged instead of sent", {
        to: payload.to,
        subject: payload.subject,
      });
      return false;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
        secure: this.smtpConfig.port === 465,
        auth: { user: this.smtpConfig.user, pass: this.smtpConfig.pass },
      });
      await transporter.sendMail({ from: this.smtpConfig.from, to: payload.to, subject: payload.subject, html: payload.html });
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error("SMTP email send failed", { message: error.message, to: payload.to, subject: payload.subject });
        return false;
      }
      throw error;
    }
  }
}

export const emailService = new SmtpEmailService();
