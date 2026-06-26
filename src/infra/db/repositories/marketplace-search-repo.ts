import { and, asc, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { CourtType } from "@/core/entities/court";
import type {
  ClubPublicDetail,
  ClubSearchResult,
  CourtAvailability,
  CourtAvailabilitySlot,
  MarketplaceSearchPort,
  SearchFacet,
  SearchFilters,
  SearchResponse,
} from "@/core/entities/marketplace";
import { formatCOT, weekdayCOT } from "@/infra/timezone/cot";
import { db, schema } from "../index";

type Sport = "padel" | "tenis";
type CourtRow = typeof schema.courts.$inferSelect;
type PricingRow = typeof schema.courtPricing.$inferSelect;
type BookingRow = typeof schema.bookings.$inferSelect;
type BlockRow = typeof schema.maintenanceBlocks.$inferSelect;
type DetailRow = Awaited<ReturnType<typeof getDetailRow>>;
type SearchRow = Awaited<ReturnType<typeof getSearchRows>>[number];
type MarketplaceSearchRepo = MarketplaceSearchPort & {
  readonly clubExists: (clubId: string) => Promise<boolean>;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const OPEN_HOUR = 6;
const CLOSE_HOUR = 23;
const DURATIONS = [60, 90] as const;
const PRICE_RANGES = [
  { label: "Hasta $60.000", min: 0, max: 6_000_000 },
  { label: "$60.000 - $90.000", min: 6_000_001, max: 9_000_000 },
  { label: "Más de $90.000", min: 9_000_001, max: 2_147_483_647 },
] as const;

function pageLimit(filters: SearchFilters): { readonly page: number; readonly limit: number } {
  return {
    page: Math.max(1, filters.page ?? DEFAULT_PAGE),
    limit: Math.min(MAX_LIMIT, Math.max(1, filters.limit ?? DEFAULT_LIMIT)),
  };
}

function day(date: string): { readonly start: Date; readonly end: Date; readonly weekday: number } {
  const start = new Date(`${date}T00:00:00-05:00`);
  return { start, end: new Date(`${date}T23:59:59.999-05:00`), weekday: weekdayCOT(start) };
}

function atCot(date: string, hour: number): Date {
  return new Date(`${date}T${String(hour).padStart(2, "0")}:00:00-05:00`);
}

function atCotTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00-05:00`);
}

function minute(value: Date): number {
  return Number(formatCOT(value, "HH")) * 60 + Number(formatCOT(value, "mm"));
}

function conflict(start: Date, end: Date, rowStart: Date, rowEnd: Date): boolean {
  return rowStart < end && rowEnd > start;
}

function baseConditions(): SQL[] {
  return [
    eq(schema.clubConfigs.status, "active"),
    eq(schema.clubConfigs.verified, true),
    eq(schema.courts.isActive, true),
  ];
}

function searchConditions(filters: SearchFilters): SQL[] {
  const conditions = baseConditions();
  if (filters.city) conditions.push(sql`unaccent(${schema.clubConfigs.city}) ilike unaccent(${`%${filters.city}%`})`);
  if (filters.sport) conditions.push(eq(schema.courts.sport, filters.sport));
  if (filters.courtType) conditions.push(eq(schema.courts.courtType, filters.courtType));
  if (filters.indoor !== undefined) conditions.push(eq(schema.courts.indoor, filters.indoor));
  if (filters.minPriceCents !== undefined) conditions.push(gte(schema.courtPricing.priceInCents, filters.minPriceCents));
  if (filters.maxPriceCents !== undefined) conditions.push(lte(schema.courtPricing.priceInCents, filters.maxPriceCents));
  if (filters.date) conditions.push(eq(schema.courtPricing.weekday, day(filters.date).weekday));
  if (filters.date && (filters.time || filters.timeStart)) {
    const start = atCotTime(filters.date, filters.timeStart ?? filters.time ?? "06:00");
    const end = filters.timeEnd ? atCotTime(filters.date, filters.timeEnd) : new Date(start.getTime() + 60 * 60_000);
    conditions.push(sql`not exists (select 1 from ${schema.bookings} where ${schema.bookings.courtId} = ${schema.courts.id} and ${schema.bookings.status} = 'confirmed' and ${schema.bookings.startTime} < ${end} and ${schema.bookings.endTime} > ${start})`);
    conditions.push(sql`not exists (select 1 from ${schema.maintenanceBlocks} where ${schema.maintenanceBlocks.courtId} = ${schema.courts.id} and ${schema.maintenanceBlocks.startTime} < ${end} and ${schema.maintenanceBlocks.endTime} > ${start})`);
  }
  return conditions;
}

async function getSearchRows(filters: SearchFilters, page: number, limit: number) {
  return db.select({
    id: schema.clubs.id,
    slug: schema.clubConfigs.slug,
    name: schema.clubConfigs.name,
    city: schema.clubConfigs.city,
    courtCount: sql<number>`cast(count(distinct ${schema.courts.id}) as int)`,
    minPriceCents: sql<number>`cast(min(${schema.courtPricing.priceInCents}) as int)`,
    courtTypes: sql<CourtType[]>`coalesce(array_agg(distinct ${schema.courts.courtType}), '{}')`,
    isVerified: schema.clubConfigs.verified,
  }).from(schema.clubConfigs)
    .innerJoin(schema.clubs, eq(schema.clubConfigs.clubId, schema.clubs.id))
    .innerJoin(schema.courts, eq(schema.courts.clubId, schema.clubs.id))
    .innerJoin(schema.courtPricing, eq(schema.courtPricing.courtId, schema.courts.id))
    .where(and(...searchConditions(filters)))
    .groupBy(schema.clubs.id, schema.clubConfigs.slug, schema.clubConfigs.name, schema.clubConfigs.city, schema.clubConfigs.verified)
    .orderBy(asc(schema.clubConfigs.city), asc(schema.clubConfigs.name))
    .limit(limit)
    .offset((page - 1) * limit);
}

async function getTotal(filters: SearchFilters): Promise<number> {
  const rows = await db.select({ total: sql<number>`cast(count(distinct ${schema.clubs.id}) as int)` }).from(schema.clubConfigs)
    .innerJoin(schema.clubs, eq(schema.clubConfigs.clubId, schema.clubs.id))
    .innerJoin(schema.courts, eq(schema.courts.clubId, schema.clubs.id))
    .innerJoin(schema.courtPricing, eq(schema.courtPricing.courtId, schema.courts.id))
    .where(and(...searchConditions(filters)));
  return rows[0]?.total ?? 0;
}

async function getFacet(name: string, column: SQL | typeof schema.clubConfigs.city | typeof schema.courts.sport | typeof schema.courts.courtType): Promise<SearchFacet> {
  const rows = await db.select({ label: column, count: sql<number>`cast(count(distinct ${schema.clubs.id}) as int)` }).from(schema.clubConfigs)
    .innerJoin(schema.clubs, eq(schema.clubConfigs.clubId, schema.clubs.id))
    .innerJoin(schema.courts, eq(schema.courts.clubId, schema.clubs.id))
    .where(and(...baseConditions()))
    .groupBy(column)
    .orderBy(asc(column));
  return { name, values: rows.map((row) => ({ label: String(row.label), count: row.count })) };
}

async function getFacets(): Promise<SearchFacet[]> {
  const priceValues = await Promise.all(PRICE_RANGES.map(async (range) => {
    const rows = await db.select({ count: sql<number>`cast(count(distinct ${schema.clubs.id}) as int)` }).from(schema.clubConfigs)
      .innerJoin(schema.clubs, eq(schema.clubConfigs.clubId, schema.clubs.id))
      .innerJoin(schema.courts, eq(schema.courts.clubId, schema.clubs.id))
      .innerJoin(schema.courtPricing, eq(schema.courtPricing.courtId, schema.courts.id))
      .where(and(...baseConditions(), gte(schema.courtPricing.priceInCents, range.min), lte(schema.courtPricing.priceInCents, range.max)));
    return { label: range.label, count: rows[0]?.count ?? 0 };
  }));
  return [
    await getFacet("city", schema.clubConfigs.city),
    await getFacet("sport", schema.courts.sport),
    await getFacet("courtType", schema.courts.courtType),
    { name: "priceRange", values: priceValues },
  ];
}

function rowToResult(row: SearchRow, nextAvailableSlot: string | null): ClubSearchResult {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    courtCount: row.courtCount,
    minPriceCents: row.minPriceCents,
    nextAvailableSlot,
    isVerified: row.isVerified,
    courtTypes: row.courtTypes,
    latitude: null,
    longitude: null,
  };
}

async function getDetailRow(slug: string) {
  const rows = await db.select({ club: schema.clubs, config: schema.clubConfigs }).from(schema.clubConfigs)
    .innerJoin(schema.clubs, eq(schema.clubConfigs.clubId, schema.clubs.id))
    .where(and(eq(schema.clubConfigs.slug, slug), eq(schema.clubConfigs.status, "active"), eq(schema.clubConfigs.verified, true)))
    .limit(1);
  return rows[0] ?? null;
}

function detailToPublic(detail: NonNullable<DetailRow>, courts: readonly CourtRow[], priceRows: readonly PricingRow[]): ClubPublicDetail {
  const prices = priceRows.map((row) => row.priceInCents);
  return {
    id: detail.club.id,
    slug: detail.config.slug,
    name: detail.config.name,
    city: detail.config.city,
    courtCount: courts.length,
    minPriceCents: Math.min(...prices, detail.config.pricing.offPeakPriceInCents),
    nextAvailableSlot: null,
    isVerified: detail.config.verified,
    courtTypes: [...new Set(courts.map((court) => court.courtType))],
    latitude: null,
    longitude: null,
    courts: courts.map((court) => ({ id: court.id, name: court.name, courtType: court.courtType, indoor: court.indoor })),
    pricing: { peakPriceCents: detail.config.pricing.peakPriceInCents, offPeakPriceCents: detail.config.pricing.offPeakPriceInCents, currency: detail.config.pricing.currency },
    address: detail.club.contact.address,
    googleMapsUrl: detail.club.contact.googleMapsUrl,
    logoUrl: detail.config.logoUrl ?? detail.club.theme.logoUrl,
    photos: detail.club.content.hero.photos,
    amenities: [],
    cancellationPolicy: detail.config.cancellationPolicy,
    openingHours: detail.club.content.openingHours,
    description: detail.club.content.hero.description,
  };
}

function priceFor(prices: readonly PricingRow[], start: Date): number | null {
  const time = minute(start);
  return prices.find((row) => minute(row.startTime) <= time && minute(row.endTime) > time)?.priceInCents ?? null;
}

function available(slot: CourtAvailabilitySlot, bookings: readonly BookingRow[], blocks: readonly BlockRow[]): boolean {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  return !bookings.some((booking) => booking.courtId === slot.courtId && conflict(start, end, booking.startTime, booking.endTime)) && !blocks.some((block) => block.courtId === slot.courtId && conflict(start, end, block.startTime, block.endTime));
}

export const marketplaceSearchRepo: MarketplaceSearchRepo = {
  async search(filters) {
    const { page, limit } = pageLimit(filters);
    const [rows, total, facets] = await Promise.all([getSearchRows(filters, page, limit), getTotal(filters), getFacets()]);
    const results = await Promise.all(rows.map(async (row) => {
      const availability = filters.date ? await marketplaceSearchRepo.getAvailability(row.id, filters.date, filters.sport) : [];
      return rowToResult(row, availability.flatMap((court) => court.slots).find((slot) => slot.isAvailable)?.startTime ?? null);
    }));
    const totalPages = Math.ceil(total / limit);
    return { results, total, pageInfo: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 }, facets } satisfies SearchResponse;
  },
  async getClubDetail(slug) {
    const detail = await getDetailRow(slug);
    if (!detail) return null;
    const courts = await db.select().from(schema.courts).where(and(eq(schema.courts.clubId, detail.club.id), eq(schema.courts.isActive, true))).orderBy(asc(schema.courts.order), asc(schema.courts.name));
    const joinedPrices = await db.select({ pricing: schema.courtPricing }).from(schema.courtPricing).innerJoin(schema.courts, eq(schema.courtPricing.courtId, schema.courts.id)).where(eq(schema.courts.clubId, detail.club.id));
    return detailToPublic(detail, courts, joinedPrices.map((row) => row.pricing));
  },
  async getAvailability(clubId, date, sport?: Sport) {
    const bounds = day(date);
    const courtFilters = [eq(schema.courts.clubId, clubId), eq(schema.courts.isActive, true)];
    if (sport) courtFilters.push(eq(schema.courts.sport, sport));
    const [courts, priceRows, bookings, blockRows] = await Promise.all([
      db.select().from(schema.courts).where(and(...courtFilters)).orderBy(asc(schema.courts.order), asc(schema.courts.name)),
      db.select().from(schema.courtPricing).innerJoin(schema.courts, eq(schema.courtPricing.courtId, schema.courts.id)).where(and(eq(schema.courts.clubId, clubId), eq(schema.courtPricing.weekday, bounds.weekday))),
      db.select().from(schema.bookings).where(and(eq(schema.bookings.clubId, clubId), eq(schema.bookings.status, "confirmed"), lt(schema.bookings.startTime, bounds.end), gt(schema.bookings.endTime, bounds.start))),
      db.select().from(schema.maintenanceBlocks).innerJoin(schema.courts, eq(schema.maintenanceBlocks.courtId, schema.courts.id)).where(and(eq(schema.courts.clubId, clubId), lt(schema.maintenanceBlocks.startTime, bounds.end), gt(schema.maintenanceBlocks.endTime, bounds.start))),
    ]);
    return courts.map((court): CourtAvailability => {
      const prices = priceRows.filter((row) => row.court_pricing.courtId === court.id).map((row) => row.court_pricing);
      const blocks = blockRows.filter((row) => row.maintenance_blocks.courtId === court.id).map((row) => row.maintenance_blocks);
      const slots = DURATIONS.flatMap((duration) => Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, index) => {
        const start = atCot(date, OPEN_HOUR + index);
        const end = new Date(start.getTime() + duration * 60_000);
        const price = priceFor(prices, start);
        const peak = prices.find((row) => minute(row.startTime) <= minute(start) && minute(row.endTime) > minute(start))?.isPeak ?? false;
        const slot = { courtId: court.id, courtName: court.name, startTime: start.toISOString(), endTime: end.toISOString(), priceInCents: price ?? 0, isPeak: peak, isAvailable: price !== null };
        const blockedForMaintenance = blocks.some((block) => conflict(start, end, block.startTime, block.endTime));
        return blockedForMaintenance ? [] : [{ ...slot, isAvailable: slot.isAvailable && end <= bounds.end && available(slot, bookings, blocks) }];
      }).flat());
      return { courtId: court.id, courtName: court.name, courtType: court.courtType, slots, maintenanceBlocks: blocks.map((block) => ({ startTime: block.startTime.toISOString(), endTime: block.endTime.toISOString(), reason: block.reason })) };
    });
  },
  async clubExists(clubId) {
    const rows = await db.select({ id: schema.clubs.id }).from(schema.clubs)
      .innerJoin(schema.clubConfigs, eq(schema.clubConfigs.clubId, schema.clubs.id))
      .where(and(eq(schema.clubs.id, clubId), eq(schema.clubConfigs.status, "active"), eq(schema.clubConfigs.verified, true)))
      .limit(1);
    return rows.length > 0;
  },
};
