import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { db, schema } from "@/infra/db/index";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "@/infra/db/uuid";
import { userRepo } from "@/infra/db/repositories";
import type { NotificationEvent } from "@/core/ports/notification-port";
import { deliverWithRetry, dispatchEmail } from "@/infra/notifications/dispatch";
import { emailService } from "@/infra/notifications/email-service";

type PutBody = {
  action: "approve" | "reject";
  rejectionReason?: string;
};

/**
 * PUT /api/admin/approvals/[id]
 * Approve or reject a pending onboarding application. Platform admin only.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "platform_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const application = (await db
    .select()
    .from(schema.onboardingApplications)
    .where(eq(schema.onboardingApplications.id, id))
    .limit(1))[0];

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "pending_approval") {
    return NextResponse.json(
      { error: `Application already ${application.status}` },
      { status: 409 }
    );
  }

  let body: PutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  if (body.action === "reject" && (!body.rejectionReason || !body.rejectionReason.trim())) {
    return NextResponse.json(
      { error: "rejectionReason is required for rejection" },
      { status: 400 }
    );
  }

  const now = new Date();

  if (body.action === "approve") {
    // Update the club_configs status to active
    await db
      .update(schema.clubConfigs)
      .set({ status: "active" })
      .where(eq(schema.clubConfigs.slug, application.slug));

    // Update the onboarding application
    await db
      .update(schema.onboardingApplications)
      .set({
        status: "approved",
        reviewedBy: session.user.id,
        reviewedAt: now,
      })
      .where(eq(schema.onboardingApplications.id, id));

    // Send approval notification via dispatch system (with retry + logging)
    await notifyClubApproved(application, session.user.id);
  } else {
    // Update the onboarding application
    await db
      .update(schema.onboardingApplications)
      .set({
        status: "rejected",
        reviewedBy: session.user.id,
        reviewedAt: now,
        rejectionReason: body.rejectionReason!.trim(),
      })
      .where(eq(schema.onboardingApplications.id, id));

    // Send rejection notification via dispatch system (with retry + logging)
    await notifyClubRejected(application, session.user.id, body.rejectionReason!.trim());
  }

  const updated = (await db
    .select()
    .from(schema.onboardingApplications)
    .where(eq(schema.onboardingApplications.id, id))
    .limit(1))[0];

  return NextResponse.json({ application: updated });
}

/**
 * Notify the applicant that their club was approved, using the dispatch
 * system (retry + logging). If the contact email matches a registered user,
 * their notification preferences are respected.
 */
async function notifyClubApproved(
  application: typeof schema.onboardingApplications.$inferSelect,
  reviewerId: string,
): Promise<void> {
  const user = await userRepo.findByEmail(application.contactEmail);
  const userId = user?.id ?? reviewerId;

  const event: NotificationEvent = {
    id: uuid(),
    type: "club_approved",
    userId,
    clubId: "",
    payload: {
      clubName: application.clubName,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin`,
    },
    createdAt: new Date(),
  };

  if (user) {
    await dispatchEmail(event, {
      to: application.contactEmail,
      subject: "¡Tu club ha sido aprobado! — PádelBacano",
      htmlBody: `
        <main style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
          <h1>¡Tu club ha sido aprobado!</h1>
          <p>El club <strong>${escapeHtml(application.clubName)}</strong> ya puede empezar a recibir reservas en PádelBacano.</p>
          <p>Entra al panel para completar horarios, canchas, precios y políticas de cancelación.</p>
        </main>
      `,
      templateId: "club_approved",
    });
  } else {
    // No registered user — send directly with retry + logging
    await deliverWithRetry(event, "email", () =>
      emailService.send({
        to: application.contactEmail,
        subject: "¡Tu club ha sido aprobado! — PádelBacano",
        html: `
          <main style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
            <h1>¡Tu club ha sido aprobado!</h1>
            <p>El club <strong>${escapeHtml(application.clubName)}</strong> ya puede empezar a recibir reservas en PádelBacano.</p>
            <p>Entra al panel para completar horarios, canchas, precios y políticas de cancelación.</p>
          </main>
        `,
      }),
    );
  }
}

/**
 * Notify the applicant that their club was rejected, using the dispatch
 * system (retry + logging). If the contact email matches a registered user,
 * their notification preferences are respected.
 */
async function notifyClubRejected(
  application: typeof schema.onboardingApplications.$inferSelect,
  reviewerId: string,
  reason: string,
): Promise<void> {
  const user = await userRepo.findByEmail(application.contactEmail);
  const userId = user?.id ?? reviewerId;

  const event: NotificationEvent = {
    id: uuid(),
    type: "club_rejected",
    userId,
    clubId: "",
    payload: {
      clubName: application.clubName,
      reason,
    },
    createdAt: new Date(),
  };

  if (user) {
    await dispatchEmail(event, {
      to: application.contactEmail,
      subject: "Solicitud de club no aprobada — PádelBacano",
      htmlBody: `
        <main style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
          <h1>Solicitud no aprobada</h1>
          <p>La solicitud del club <strong>${escapeHtml(application.clubName)}</strong> no ha sido aprobada.</p>
          <p><strong>Motivo:</strong> ${escapeHtml(reason)}</p>
          <p>Si tienes dudas, contáctanos respondiendo a este correo.</p>
        </main>
      `,
      templateId: "club_rejected",
    });
  } else {
    await deliverWithRetry(event, "email", () =>
      emailService.send({
        to: application.contactEmail,
        subject: "Solicitud de club no aprobada — PádelBacano",
        html: `
          <main style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
            <h1>Solicitud no aprobada</h1>
            <p>La solicitud del club <strong>${escapeHtml(application.clubName)}</strong> no ha sido aprobada.</p>
            <p><strong>Motivo:</strong> ${escapeHtml(reason)}</p>
            <p>Si tienes dudas, contáctanos respondiendo a este correo.</p>
          </main>
        `,
      }),
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
