import { eq } from "drizzle-orm";
import { db, schema } from "@/infra/db";
import { uuid } from "@/infra/db/uuid";
import { minutes, type OnboardingPricingEntry, type OnboardingSubmissionData } from "./_validation";

type PricingRange = {
  readonly courtId: string;
  readonly weekday: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly priceInCents: number;
  readonly isPeak: boolean;
};

type OnboardingPrices = {
  readonly peakPriceInCents: number;
  readonly offPeakPriceInCents: number;
};

type ClubInsertContext = OnboardingPrices & {
  readonly clubId: string;
  readonly now: Date;
};

type ClubInsert = typeof schema.clubs.$inferInsert;
type ClubConfigInsert = typeof schema.clubConfigs.$inferInsert;
type OnboardingApplicationInsert = typeof schema.onboardingApplications.$inferInsert;

class OnboardingPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OnboardingPersistenceError";
  }
}

export async function slugExists(slug: string): Promise<boolean> {
  const [clubRows, configRows, applicationRows] = await Promise.all([
    db.select({ id: schema.clubs.id }).from(schema.clubs).where(eq(schema.clubs.slug, slug)).limit(1),
    db.select({ id: schema.clubConfigs.id }).from(schema.clubConfigs).where(eq(schema.clubConfigs.slug, slug)).limit(1),
    db.select({ id: schema.onboardingApplications.id }).from(schema.onboardingApplications).where(eq(schema.onboardingApplications.slug, slug)).limit(1),
  ]);

  return clubRows.length > 0 || configRows.length > 0 || applicationRows.length > 0;
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "23505";
}

export async function createPendingClub(data: OnboardingSubmissionData): Promise<string> {
  const clubId = uuid();
  const now = new Date();
  const prices = {
    peakPriceInCents: Math.max(...data.step3.pricing.map((entry) => entry.peakPriceCents)),
    offPeakPriceInCents: Math.min(...data.step3.pricing.map((entry) => entry.offPeakPriceCents)),
  };
  const courtRows = data.step2.courts.map((court, index) => ({
    id: uuid(),
    clubId,
    name: court.name,
    courtType: court.surface,
    sport: court.sport,
    surface: court.surface,
    indoor: court.indoor,
    lighting: court.lighting,
    isActive: true,
    order: index + 1,
  }));
  const pricingRows = data.step3.pricing.flatMap((entry) =>
    pricingRanges(courtIdForIndex(courtRows, entry.courtIndex), entry, data.step4).map((range) => ({
      id: uuid(),
      courtId: range.courtId,
      weekday: range.weekday,
      startTime: timeDate(range.weekday, range.startTime),
      endTime: timeDate(range.weekday, range.endTime),
      priceInCents: range.priceInCents,
      isPeak: range.isPeak,
    }))
  );

  await db.transaction(async (tx) => {
    await tx.insert(schema.clubs).values(clubInsert(data, { clubId, now, ...prices }));
    await tx.insert(schema.clubConfigs).values(configInsert(data, { clubId, ...prices }));
    await tx.insert(schema.courts).values(courtRows);
    await tx.insert(schema.courtPricing).values(pricingRows);
    await tx.insert(schema.onboardingApplications).values(applicationInsert(data));
  });

  return clubId;
}

function courtIdForIndex(courtRows: readonly { readonly id: string }[], courtIndex: number): string {
  const row = courtRows[courtIndex];
  if (!row) throw new OnboardingPersistenceError(`Court index ${courtIndex} was not validated`);
  return row.id;
}

function timeDate(weekday: number, time: string): Date {
  const day = (4 + weekday).toString().padStart(2, "0");
  return new Date(`2026-01-${day}T${time}:00-05:00`);
}

function pricingRanges(
  courtId: string,
  entry: OnboardingPricingEntry,
  schedule: OnboardingSubmissionData["step4"]
): PricingRange[] {
  return [
    { courtId, weekday: entry.dayOfWeek, startTime: schedule.openingTime, endTime: entry.startTime, priceInCents: entry.offPeakPriceCents, isPeak: false },
    { courtId, weekday: entry.dayOfWeek, startTime: entry.startTime, endTime: entry.endTime, priceInCents: entry.peakPriceCents, isPeak: true },
    { courtId, weekday: entry.dayOfWeek, startTime: entry.endTime, endTime: schedule.closingTime, priceInCents: entry.offPeakPriceCents, isPeak: false },
  ].filter((range) => minutes(range.startTime) < minutes(range.endTime));
}

function clubInsert(data: OnboardingSubmissionData, context: ClubInsertContext): ClubInsert {
  return {
    id: context.clubId,
    slug: data.step1.slug,
    name: data.step1.clubName,
    city: data.step1.city,
    department: data.step1.department,
    pricing: { memberPrice: context.offPeakPriceInCents, nonMemberPrice: context.peakPriceInCents, currency: "COP" },
    theme: { primaryColor: "#0f766e", surfaceColor: "#ffffff", fontFamily: "Inter", logoUrl: null, borderRadius: "md" as const },
    cancellationPolicy: { minHoursBefore: 2, penaltyPercent: 100, allowRefund: true },
    contact: { phone: data.step1.contactPhone, email: data.step1.contactEmail, whatsapp: data.step1.contactPhone, address: `${data.step1.city}, ${data.step1.department}`, googleMapsUrl: null },
    content: {
      hero: { title: data.step1.clubName, subtitle: `Reserva pádel en ${data.step1.city}`, description: `Club pendiente de aprobación en ${data.step1.city}.`, heroImageUrl: null, photos: [] },
      about: `Club registrado por ${data.step1.contactName}.`,
      prices: `Desde COP ${context.offPeakPriceInCents} centavos.`,
      openingHours: `${data.step4.openingTime}-${data.step4.closingTime}`,
    },
    createdAt: context.now,
    updatedAt: context.now,
  };
}

function configInsert(data: OnboardingSubmissionData, context: OnboardingPrices & { readonly clubId: string }): ClubConfigInsert {
  return {
    id: uuid(),
    clubId: context.clubId,
    slug: data.step1.slug,
    name: data.step1.clubName,
    city: data.step1.city,
    department: data.step1.department,
    nit: data.step1.nit,
    phone: data.step1.contactPhone,
    email: data.step1.contactEmail,
    logoUrl: null,
    heroImageUrl: null,
    domain: null,
    theme: { primaryColor: "#0f766e", surfaceColor: "#ffffff", fontFamily: "Inter", logoUrl: null, borderRadius: "md" as const },
    pricing: { currency: "COP", peakPriceInCents: context.peakPriceInCents, offPeakPriceInCents: context.offPeakPriceInCents, memberDiscountPercent: 0 },
    modules: { social: false, payments: false, tournaments: false, analytics: false, invoicing: false, school: false, loyalty: false },
    status: "pending_approval" as const,
    verified: false,
    cancellationPolicy: { minHoursBefore: 2, penaltyPercent: 100, allowRefund: true, summary: "Cancelación gratuita hasta 2 horas antes." },
  };
}

function applicationInsert(data: OnboardingSubmissionData): OnboardingApplicationInsert {
  return {
    id: uuid(),
    clubName: data.step1.clubName,
    slug: data.step1.slug,
    city: data.step1.city,
    department: data.step1.department,
    nit: data.step1.nit,
    contactName: data.step1.contactName,
    contactPhone: data.step1.contactPhone,
    contactEmail: data.step1.contactEmail,
    status: "pending_approval" as const,
  };
}
