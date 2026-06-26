import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { SearchFilters, SearchResponse } from "@/core/entities/marketplace";
import { searchMarketplaceClubs } from "@/infra/marketplace/search-marketplace-clubs-service";
import { COT_TIME_ZONE, formatCOT } from "@/infra/timezone/cot";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

const searchQuerySchema = z
  .object({
    city: z.string().trim().min(1).optional(),
    date: z.iso.date().optional(),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "time must be HH:mm").optional(),
    timeStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "timeStart must be HH:mm").optional(),
    timeEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "timeEnd must be HH:mm").optional(),
    priceMin: z.coerce.number().int().min(0).optional(),
    priceMax: z.coerce.number().int().min(0).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    sport: z.enum(["padel", "tenis"]).optional(),
    courtType: z.enum(["glass", "panoramic", "wall"]).optional(),
    indoor: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
    limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  })
  .refine(
    (query) => {
      const minimumPrice = query.priceMin ?? query.minPrice;
      const maximumPrice = query.priceMax ?? query.maxPrice;

      return minimumPrice === undefined || maximumPrice === undefined || minimumPrice <= maximumPrice;
    },
    { message: "priceMin must be less than or equal to priceMax" }
  )
  .refine(
    (query) => query.timeStart === undefined || query.timeEnd === undefined || query.timeStart <= query.timeEnd,
    { message: "timeStart must be less than or equal to timeEnd" }
  );

function queryParamsToRecord(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return params;
}

function formatOptionalSlotCOT(slot: string | null): string | null {
  return slot ? formatCOT(new Date(slot), "yyyy-MM-dd'T'HH:mm:ss-05:00") : null;
}

function withSearchCOTDisplay(data: SearchResponse) {
  return {
    ...data,
    results: data.results.map((result) => ({
      ...result,
      nextAvailableSlotCOT: formatOptionalSlotCOT(result.nextAvailableSlot),
      timezone: COT_TIME_ZONE,
    })),
  };
}

function toSearchFilters(query: z.infer<typeof searchQuerySchema>): SearchFilters {
  return {
    ...(query.city !== undefined ? { city: query.city } : {}),
    ...(query.date !== undefined ? { date: query.date } : {}),
    ...(query.time !== undefined ? { time: query.time } : {}),
    ...(query.timeStart !== undefined ? { timeStart: query.timeStart } : {}),
    ...(query.timeEnd !== undefined ? { timeEnd: query.timeEnd } : {}),
    ...(query.priceMin !== undefined || query.minPrice !== undefined
      ? { minPriceCents: query.priceMin ?? query.minPrice }
      : {}),
    ...(query.priceMax !== undefined || query.maxPrice !== undefined
      ? { maxPriceCents: query.priceMax ?? query.maxPrice }
      : {}),
    ...(query.sport !== undefined ? { sport: query.sport } : {}),
    ...(query.courtType !== undefined ? { courtType: query.courtType } : {}),
    ...(query.indoor !== undefined ? { indoor: query.indoor } : {}),
    page: query.page,
    limit: query.limit,
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const parsedQuery = searchQuerySchema.safeParse(queryParamsToRecord(request.nextUrl.searchParams));

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid search parameters",
        details: parsedQuery.error.issues.map((issue) => issue.message),
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const data = await searchMarketplaceClubs.execute(toSearchFilters(parsedQuery.data));

    return NextResponse.json({ success: true, data: withSearchCOTDisplay(data) }, { headers: CORS_HEADERS });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: "Marketplace search is temporarily unavailable" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    throw error;
  }
}
