import { and, eq, gt, lt } from "drizzle-orm";
import type {
  ClubPublicDetail,
  ClubPublicPricing,
  CourtAvailability,
  MarketplaceSearchPort,
  SearchFilters,
  SearchResponse,
} from "@/core/entities/marketplace";
import { db, schema } from "../index";

type ClubConfigRow = typeof schema.clubConfigs.$inferSelect;
type ClubRow = typeof schema.clubs.$inferSelect;
type CourtRow = typeof schema.courts.$inferSelect;
type PricingRow = typeof schema.courtPricing.$inferSelect;
type BookingRow = typeof schema.bookings.$inferSelect;
type MaintenanceRow = typeof schema.maintenanceBlocks.$inferSelect;
type Sport = "padel" | "tenis";

type SlotPricing = {
  readonly startMinute: number;
  readonly endMinute: number;
  readonly priceInCents: number;
  readonly isPeak: boolean;
};

const publicPricingFromConfig = (config: ClubConfigRow): ClubPublicPricing => ({
  peakPriceCents: config.pricing.peakPriceInCents,
  offPeakPriceCents: config.pricing.offPeakPriceInCents,
  currency: config.pricing.currency,
});

const clubDetailFromRows = (
  config: ClubConfigRow,
  club: ClubRow,
  courts: readonly CourtRow[]
): ClubPublicDetail => {
  const publicCourts = courts.map((court) => ({
    id: court.id,
    name: court.name,
    courtType: court.courtType,
    indoor: court.indoor,
  }));
  const courtTypes = [...new Set(publicCourts.map((court) => court.courtType))];
  const pricing = publicPricingFromConfig(config);

  return {
    id: club.id,
    slug: config.slug,
    name: config.name,
    city: config.city,
    courtCount: publicCourts.length,
    minPriceCents: Math.min(pricing.peakPriceCents, pricing.offPeakPriceCents),
    nextAvailableSlot: null,
    isVerified: config.verified,
    courtTypes,
    latitude: null,
    longitude: null,
    courts: publicCourts,
    pricing,
    address: club.contact.address,
    googleMapsUrl: club.contact.googleMapsUrl,
    logoUrl: config.logoUrl ?? club.theme.logoUrl,
    photos: club.content.hero.photos,
    amenities: [],
    cancellationPolicy: {
      minHoursBefore: config.cancellationPolicy.minHoursBefore,
      penaltyPercent: config.cancellationPolicy.penaltyPercent,
      summary: config.cancellationPolicy.summary,
    },
    openingHours: club.content.openingHours,
    description: club.content.hero.description,
  };
};

const minutesInDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();

const slotDate = (date: Date, minute: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(minute / 60), minute % 60, 0, 0);

const overlaps = (startTime: Date, endTime: Date, blockStart: Date, blockEnd: Date): boolean =>
  blockStart < endTime && blockEnd > startTime;

const isToday = (date: Date, now: Date): boolean =>
  date.getFullYear() === now.getFullYear() &&
  date.getMonth() === now.getMonth() &&
  date.getDate() === now.getDate();

const toSlotPricing = (row: PricingRow): SlotPricing => ({
  startMinute: minutesInDay(row.startTime),
  endMinute: minutesInDay(row.endTime),
  priceInCents: row.priceInCents,
  isPeak: row.isPeak,
});

const byCourtId = <TRow extends { readonly courtId: string }>(rows: readonly TRow[]): Map<string, TRow[]> => {
  const grouped = new Map<string, TRow[]>();
  for (const row of rows) {
    const current = grouped.get(row.courtId) ?? [];
    current.push(row);
    grouped.set(row.courtId, current);
  }
  return grouped;
};

export const marketplaceSearchRepo: MarketplaceSearchPort & {
  clubExists(clubId: string): Promise<boolean>;
} = {
  async clubExists(clubId) {
    const row = await db
      .select({ id: schema.clubs.id })
      .from(schema.clubs)
      .where(eq(schema.clubs.id, clubId))
      .limit(1);

    return row.length === 1;
  },

  async search(_filters: SearchFilters): Promise<SearchResponse> {
    return {
      results: [],
      total: 0,
      pageInfo: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      facets: [],
    };
  },

  async getClubDetail(slug: string): Promise<ClubPublicDetail | null> {
    const config = (
      await db
        .select()
        .from(schema.clubConfigs)
        .where(and(eq(schema.clubConfigs.slug, slug), eq(schema.clubConfigs.status, "active")))
        .limit(1)
    )[0];

    if (!config?.clubId) {
      return null;
    }

    const club = (
      await db.select().from(schema.clubs).where(eq(schema.clubs.id, config.clubId)).limit(1)
    )[0];

    if (!club) {
      return null;
    }

    const courts = await db
      .select()
      .from(schema.courts)
      .where(and(eq(schema.courts.clubId, club.id), eq(schema.courts.isActive, true)));

    return clubDetailFromRows(config, club, courts);
  },

  async getAvailability(clubId: string, date: string, sport?: Sport): Promise<CourtAvailability[]> {
    const targetDate = new Date(`${date}T00:00:00`);
    const dayStart = slotDate(targetDate, 0);
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    const weekday = targetDate.getDay();

    const courts = await db
      .select()
      .from(schema.courts)
      .where(
        sport
          ? and(eq(schema.courts.clubId, clubId), eq(schema.courts.isActive, true), eq(schema.courts.sport, sport))
          : and(eq(schema.courts.clubId, clubId), eq(schema.courts.isActive, true))
      );

    const pricingRows = await db
      .select()
      .from(schema.courtPricing)
      .innerJoin(schema.courts, eq(schema.courtPricing.courtId, schema.courts.id))
      .where(
        sport
          ? and(
              eq(schema.courts.clubId, clubId),
              eq(schema.courts.isActive, true),
              eq(schema.courts.sport, sport),
              eq(schema.courtPricing.weekday, weekday)
            )
          : and(
              eq(schema.courts.clubId, clubId),
              eq(schema.courts.isActive, true),
              eq(schema.courtPricing.weekday, weekday)
            )
      );

    const bookingRows = await db
      .select()
      .from(schema.bookings)
      .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
      .where(
        and(
          eq(schema.courts.clubId, clubId),
          eq(schema.bookings.status, "confirmed"),
          lt(schema.bookings.startTime, dayEnd),
          gt(schema.bookings.endTime, dayStart)
        )
      );

    const maintenanceRows = await db
      .select()
      .from(schema.maintenanceBlocks)
      .innerJoin(schema.courts, eq(schema.maintenanceBlocks.courtId, schema.courts.id))
      .where(
        and(
          eq(schema.courts.clubId, clubId),
          lt(schema.maintenanceBlocks.startTime, dayEnd),
          gt(schema.maintenanceBlocks.endTime, dayStart)
        )
      );

    const pricingByCourt = byCourtId(pricingRows.map((row) => row.court_pricing));
    const bookingsByCourt = byCourtId(bookingRows.map((row) => row.bookings));
    const maintenanceByCourt = byCourtId(maintenanceRows.map((row) => row.maintenance_blocks));
    const now = new Date();

    return courts.map((court: CourtRow): CourtAvailability => {
      const courtPricing = (pricingByCourt.get(court.id) ?? []).map(toSlotPricing);
      const courtBookings: BookingRow[] = bookingsByCourt.get(court.id) ?? [];
      const courtMaintenance: MaintenanceRow[] = maintenanceByCourt.get(court.id) ?? [];

      return {
        courtId: court.id,
        courtName: court.name,
        courtType: court.courtType,
        slots: courtPricing
          .map((pricing) => {
            const startTime = slotDate(targetDate, pricing.startMinute);
            const endTime = slotDate(targetDate, pricing.endMinute);
            const booked = courtBookings.some((booking) => overlaps(startTime, endTime, booking.startTime, booking.endTime));
            const blocked = courtMaintenance.some((block) => overlaps(startTime, endTime, block.startTime, block.endTime));
            const past = isToday(targetDate, now) && startTime <= now;

            return {
              courtId: court.id,
              courtName: court.name,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              priceInCents: pricing.priceInCents,
              isPeak: pricing.isPeak,
              isAvailable: !booked && !blocked && !past,
            };
          })
          .filter((slot) => slot.isAvailable),
        maintenanceBlocks: courtMaintenance.map((block) => ({
          startTime: block.startTime.toISOString(),
          endTime: block.endTime.toISOString(),
          reason: block.reason,
        })),
      };
    });
  },
};
