import { NextResponse } from "next/server";
import { marketplaceSearchRepo } from "@/infra/db/repositories";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

type RouteContext = {
  readonly params: Promise<{ readonly slug: string }>;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const club = await marketplaceSearchRepo.getClubDetail(slug);

  if (!club) {
    return NextResponse.json(
      { success: false, error: "Club no encontrado" },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { success: true, data: club },
    { headers: CORS_HEADERS }
  );
}
