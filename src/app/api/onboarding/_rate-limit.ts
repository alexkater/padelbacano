import { NextResponse, type NextRequest } from "next/server";

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

type RateLimitBucket = {
  readonly count: number;
  readonly resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

export function rateLimitResponse(request: NextRequest): NextResponse | null {
  const now = Date.now();
  const ip = clientIp(request);
  const bucket = rateLimitBuckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  rateLimitBuckets.set(ip, { count: bucket.count + 1, resetAt: bucket.resetAt });
  return null;
}
