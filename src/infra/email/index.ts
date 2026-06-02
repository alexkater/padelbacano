// ─── Email service — Nodemailer implementation ─────────────────────────────
// Implements IEmailService port.
// Falls back to console.log if no SMTP configured.

import type { IEmailService, EmailPayload } from "@/core/ports/email-service";

function createEmailService(): IEmailService {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;

  if (!smtpHost) {
    // Dev mode: log emails to console instead of sending
    return {
      async send(payload: EmailPayload) {
        console.log("─── EMAIL (dev mode) ───");
        console.log(`To: ${payload.to}`);
        console.log(`Subject: ${payload.subject}`);
        console.log(`Body: ${payload.html.slice(0, 200)}...`);
        return true;
      },

      async sendBookingConfirmation(userEmail, details) {
        return this.send({
          to: userEmail,
          subject: `Booking confirmed — ${details.clubName}`,
          html: `
            <h2>Booking Confirmed</h2>
            <p><strong>Club:</strong> ${details.clubName}</p>
            <p><strong>Court:</strong> ${details.courtName}</p>
            <p><strong>Date:</strong> ${details.date}</p>
            <p><strong>Time:</strong> ${details.time}</p>
            <p><strong>Duration:</strong> ${details.duration} min</p>
          `,
        });
      },

      async sendCancellationNotice(userEmail, details) {
        return this.send({
          to: userEmail,
          subject: `Booking cancelled — ${details.clubName}`,
          html: `
            <h2>Booking Cancelled</h2>
            <p><strong>Club:</strong> ${details.clubName}</p>
            <p><strong>Court:</strong> ${details.courtName}</p>
            <p><strong>Date:</strong> ${details.date}</p>
            <p><strong>Time:</strong> ${details.time}</p>
          `,
        });
      },
    };
  }

  // Production: real SMTP via Nodemailer
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort ?? "587"),
    secure: smtpPort === "465",
  });

  return {
    async send(payload) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM ?? "noreply@elrematepadel.com",
          ...payload,
        });
        return true;
      } catch (err) {
        console.error("Email send failed:", err);
        return false;
      }
    },

    async sendBookingConfirmation(userEmail, details) {
      return this.send({
        to: userEmail,
        subject: `Reserva confirmada — ${details.clubName}`,
        html: `
          <h2>Reserva Confirmada</h2>
          <p><strong>Club:</strong> ${details.clubName}</p>
          <p><strong>Pista:</strong> ${details.courtName}</p>
          <p><strong>Fecha:</strong> ${details.date}</p>
          <p><strong>Hora:</strong> ${details.time}</p>
          <p><strong>Duración:</strong> ${details.duration} min</p>
        `,
      });
    },

    async sendCancellationNotice(userEmail, details) {
      return this.send({
        to: userEmail,
        subject: `Reserva cancelada — ${details.clubName}`,
        html: `
          <h2>Reserva Cancelada</h2>
          <p><strong>Club:</strong> ${details.clubName}</p>
          <p><strong>Pista:</strong> ${details.courtName}</p>
          <p><strong>Fecha:</strong> ${details.date}</p>
          <p><strong>Hora:</strong> ${details.time}</p>
        `,
      });
    },
  };
}

export const emailService = createEmailService();
