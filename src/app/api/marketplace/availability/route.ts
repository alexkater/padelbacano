import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { CourtAvailability, CourtAvailabilitySlot, MaintenanceBlock } from "@/core/entities/marketplace";
import { marketplaceSearchRepo } from "@/infra/db/repositories/marketplace-search-repo";
import { COT_TIME_ZONE, formatCOT } from "@/infra/timezone/cot";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

const querySchema = z.object({
  clubId: z.uuid(),
  date: z.iso.date(),
  sport: z.enum(["padel", "tenis"]).optional(),
});

const json = (body: unknown, status = 200): NextResponse =>
  NextResponse.json(body, { status, headers: corsHeaders });

type COTDisplay = {
  readonly startTimeCOT: string;
  readonly endTimeCOT: string;
  readonly displayTime: string;
  readonly timezone: typeof COT_TIME_ZONE;
};

type SlotWithCOT = CourtAvailabilitySlot & COTDisplay;
type MaintenanceBlockWithCOT = MaintenanceBlock & COTDisplay;
type AvailabilityWithCOT = Omit<CourtAvailability, "slots" | "maintenanceBlocks"> & {
  readonly slots: readonly SlotWithCOT[];
  readonly maintenanceBlocks: readonly MaintenanceBlockWithCOT[];
};

function cotDisplay(startTime: string, endTime: string): COTDisplay {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return {
    startTimeCOT: formatCOT(start, "yyyy-MM-dd'T'HH:mm:ss-05:00"),
    endTimeCOT: formatCOT(end, "yyyy-MM-dd'T'HH:mm:ss-05:00"),
    displayTime: `${formatCOT(start, "HH:mm")} - ${formatCOT(end, "HH:mm")} COT`,
    timezone: COT_TIME_ZONE,
  };
}

function withCOTDisplay(court: CourtAvailability): AvailabilityWithCOT {
  return {
    ...court,
    slots: court.slots.map((slot) => ({ ...slot, ...cotDisplay(slot.startTime, slot.endTime) })),
    maintenanceBlocks: court.maintenanceBlocks.map((block) => ({ ...block, ...cotDisplay(block.startTime, block.endTime) })),
  };
}

export function OPTIONS(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = querySchema.safeParse({
    clubId: request.nextUrl.searchParams.get("clubId"),
    date: request.nextUrl.searchParams.get("date"),
    sport: request.nextUrl.searchParams.get("sport") ?? undefined,
  });

  if (!params.success) {
    return json(
      {
        success: false,
        error: "clubId (UUID) and date (YYYY-MM-DD) are required; sport must be padel or tenis when provided",
      },
      400
    );
  }

  const clubExists = await marketplaceSearchRepo.clubExists(params.data.clubId);
  if (!clubExists) {
    return json({ success: false, error: "Club not found" }, 404);
  }

  const data = await marketplaceSearchRepo.getAvailability(
    params.data.clubId,
    params.data.date,
    params.data.sport
  );

  return json({ success: true, data: data.map(withCOTDisplay) });
}
