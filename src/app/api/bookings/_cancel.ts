import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/infra/auth/config";
import { db, schema } from "@/infra/db";
import { v4 as uuid } from "@/infra/db/uuid";
import { COT_TIME_ZONE, formatCOT } from "@/infra/timezone/cot";
import { dispatchEmail, dispatchWhatsApp } from "@/infra/notifications/dispatch";

const FREE_CANCELLATION_HOURS = 2;
const CANCELLATION_REASONS = ["Cambio de planes", "No puedo asistir", "Otro"] as const;

const cancelRequestSchema = z.object({
  reason: z.enum(CANCELLATION_REASONS).optional(),
});

type CancelRequestBody = z.infer<typeof cancelRequestSchema>;
type BookingCancellationContext = {
  readonly booking: typeof schema.bookings.$inferSelect;
  readonly court: typeof schema.courts.$inferSelect;
  readonly club: typeof schema.clubs.$inferSelect;
  readonly user: typeof schema.users.$inferSelect;
  readonly profile: typeof schema.userProfiles.$inferSelect | null;
};
type Actor = { readonly id: string; readonly role: "player" | "club_admin" };

class CancelRouteError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message);
    this.name = "CancelRouteError";
  }
}

async function readCancelBody(request: NextRequest): Promise<CancelRequestBody> {
  const text = await request.text();
  if (text.trim() === "") return {};

  try {
    const payload: unknown = JSON.parse(text);
    const parsed = cancelRequestSchema.safeParse(payload);
    if (!parsed.success) throw new CancelRouteError("Invalid cancellation reason", 400, "INVALID_REASON");
    return parsed.data;
  } catch (error) {
    if (error instanceof CancelRouteError) throw error;
    if (error instanceof SyntaxError) throw new CancelRouteError("Invalid JSON body", 400, "INVALID_JSON");
    throw error;
  }
}

async function loadCancellationContext(bookingId: string): Promise<BookingCancellationContext | null> {
  const rows = await db
    .select({
      booking: schema.bookings,
      court: schema.courts,
      club: schema.clubs,
      user: schema.users,
      profile: schema.userProfiles,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .innerJoin(schema.clubs, eq(schema.courts.clubId, schema.clubs.id))
    .innerJoin(schema.users, eq(schema.bookings.userId, schema.users.id))
    .leftJoin(
      schema.userProfiles,
      and(eq(schema.userProfiles.userId, schema.bookings.userId), eq(schema.userProfiles.clubId, schema.courts.clubId))
    )
    .where(eq(schema.bookings.id, bookingId))
    .limit(1);

  return rows[0] ?? null;
}

async function canActorCancel(ctx: BookingCancellationContext, actor: Actor): Promise<boolean> {
  if (ctx.booking.userId === actor.id) return true;
  if (actor.role !== "club_admin") return false;

  const rows = await db
    .select({ id: schema.userProfiles.id })
    .from(schema.userProfiles)
    .where(
      and(
        eq(schema.userProfiles.userId, actor.id),
        eq(schema.userProfiles.clubId, ctx.court.clubId),
        eq(schema.userProfiles.role, "admin")
      )
    )
    .limit(1);

  return rows.length > 0;
}

function isLateCancellation(startTime: Date, now: Date): boolean {
  const freeUntil = startTime.getTime() - FREE_CANCELLATION_HOURS * 60 * 60 * 1000;
  return now.getTime() > freeUntil;
}

async function sendCancellationNotifications(
  ctx: BookingCancellationContext,
  reason: string | null,
  late: boolean,
  cancelledAt: Date
): Promise<void> {
  const event = {
    id: uuid(),
    type: "booking_cancelled" as const,
    userId: ctx.booking.userId,
    clubId: ctx.court.clubId,
    payload: {
      bookingId: ctx.booking.id,
      courtName: ctx.court.name,
      clubName: ctx.club.name,
      reason,
      late,
      cancelledAt: cancelledAt.toISOString(),
    },
    createdAt: cancelledAt,
  };
  const date = formatCOT(ctx.booking.startTime, "yyyy-MM-dd");
  const time = formatCOT(ctx.booking.startTime, "HH:mm");
  const reasonLine = reason ? `<p>Motivo: ${reason}</p>` : "";
  const policyLine = late
    ? "<p>Cancelación tardía: aplica la política del club para reservas canceladas con menos de 2 horas.</p>"
    : "<p>Cancelación gratuita registrada dentro de la ventana permitida.</p>";

  const whatsappTo: string | null =
    ctx.profile?.phone ?? ctx.club.contact.whatsapp ?? ctx.club.contact.phone ?? null;

  await Promise.allSettled([
    dispatchEmail(event, {
      to: ctx.user.email,
      subject: `Reserva cancelada en ${ctx.club.name}`,
      htmlBody: `<h1>Reserva cancelada</h1><p>Tu reserva en ${ctx.court.name} para ${date} a las ${time} fue cancelada.</p>${reasonLine}${policyLine}`,
    }),
    ...(whatsappTo
      ? [
          dispatchWhatsApp(event, {
            to: whatsappTo,
            templateName: "booking_cancelled",
            params: {
              clubName: ctx.club.name,
              courtName: ctx.court.name,
              date,
              time,
              reason: reason ?? "Sin motivo indicado",
              policy: late ? "Cancelación tardía" : "Cancelación gratuita",
            },
          }),
        ]
      : []),
  ]);
}

async function cancelBookingTransaction(
  ctx: BookingCancellationContext,
  actor: Actor,
  reason: string | null,
  late: boolean,
  cancelledAt: Date
): Promise<typeof schema.bookings.$inferSelect> {
  const refundAmount = 0;

  return db.transaction(async (tx) => {
    const updatedRows = await tx
      .update(schema.bookings)
      .set({ status: "cancelled", updatedAt: cancelledAt })
      .where(eq(schema.bookings.id, ctx.booking.id))
      .returning();
    const updated = updatedRows[0];
    if (!updated) throw new CancelRouteError("Booking not found", 404, "BOOKING_NOT_FOUND");

    await tx.insert(schema.bookingCancellations).values({
      id: uuid(),
      bookingId: ctx.booking.id,
      cancelledBy: actor.id,
      reason,
      refundAmount,
      cancelledAt,
    });

    return updated;
  });
}

export async function cancelBookingRequest(request: NextRequest, bookingId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await readCancelBody(request);
    const ctx = await loadCancellationContext(bookingId);
    if (!ctx) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (ctx.booking.status === "cancelled") return NextResponse.json({ error: "Already cancelled" }, { status: 409 });

    const actor: Actor = { id: userId, role: session.user.role === "club_admin" ? "club_admin" : "player" };
    const allowed = await canActorCancel(ctx, actor);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const cancelledAt = new Date();
    const late = isLateCancellation(ctx.booking.startTime, cancelledAt);
    const reason = body.reason ?? null;
    const booking = await cancelBookingTransaction(ctx, actor, reason, late, cancelledAt);
    await sendCancellationNotifications(ctx, reason, late, cancelledAt);

    return NextResponse.json({
      booking,
      cancellation: {
        reason,
        late,
        cancelledAt: cancelledAt.toISOString(),
        cancelledAtCOT: formatCOT(cancelledAt, "yyyy-MM-dd'T'HH:mm:ss-05:00"),
        bookingTime: {
          startTimeCOT: formatCOT(ctx.booking.startTime, "yyyy-MM-dd'T'HH:mm:ss-05:00"),
          endTimeCOT: formatCOT(ctx.booking.endTime, "yyyy-MM-dd'T'HH:mm:ss-05:00"),
          displayTime: `${formatCOT(ctx.booking.startTime, "HH:mm")} - ${formatCOT(ctx.booking.endTime, "HH:mm")} COT`,
          timezone: COT_TIME_ZONE,
        },
        policy: late ? "late_cancellation" : "free_cancellation",
      },
    });
  } catch (error) {
    if (error instanceof CancelRouteError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }
}
