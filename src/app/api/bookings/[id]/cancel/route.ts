import type { NextRequest } from "next/server";
import { cancelBookingRequest } from "../../_cancel";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return cancelBookingRequest(request, id);
}
