import { auth } from "@/infra/auth/config";
import { TenantAccessError, TenantContext } from "@/infra/tenant/tenant-context";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AuthRole } from "@/infra/auth/roles";

type SessionUser = {
  readonly id?: string;
  readonly role?: AuthRole;
  readonly clubId?: string;
  readonly profileId?: string;
};

type SessionLike = {
  readonly user?: SessionUser;
};

type AuthenticatedRequest = NextRequest & {
  readonly auth?: SessionLike | null;
};

type Actor = {
  readonly userId: string;
  readonly role: AuthRole;
  readonly clubId?: string;
  readonly profileId?: string;
};

type RateLimitTier = {
  readonly limit: string;
  readonly remaining: string;
  readonly resetSeconds: string;
};

const MUTATION_METHODS = ["POST", "PUT", "PATCH", "DELETE"] as const;
const SEARCH_RATE_LIMIT = { limit: "120", remaining: "119", resetSeconds: "60" } as const;
const BOOKING_RATE_LIMIT = { limit: "20", remaining: "19", resetSeconds: "60" } as const;
const ADMIN_RATE_LIMIT = { limit: "30", remaining: "29", resetSeconds: "60" } as const;
const PUSH_RATE_LIMIT = { limit: "60", remaining: "59", resetSeconds: "60" } as const;
const CLUB_STATIC_PATHS = ["reservar", "perfil", "escuela", "tablon", "torneos"] as const;

function publicClubSlug(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  if (segments.length !== 1 || !firstSegment) return null;
  if (CLUB_STATIC_PATHS.some((path) => path === firstSegment)) return null;

  return firstSegment;
}

function requestWithTenantHeaders(request: NextRequest): Headers {
  const requestHeaders = new Headers(request.headers);
  const slug = publicClubSlug(request.nextUrl.pathname);
  if (slug) {
    requestHeaders.set("x-club-slug", slug);
  }

  return requestHeaders;
}

function hasSessionToken(request: NextRequest): boolean {
  return request.cookies.has("authjs.session-token") || request.cookies.has("__Secure-authjs.session-token");
}

function isMutation(method: string): boolean {
  return MUTATION_METHODS.some((mutationMethod) => mutationMethod === method);
}

function isAdminPage(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

function isPublicMarketplaceApi(pathname: string): boolean {
  return pathname.startsWith("/api/marketplace/");
}

function isSensitiveApi(pathname: string): boolean {
  return (
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/bookings") ||
    pathname.startsWith("/api/invoices") ||
    pathname.startsWith("/api/tournaments") ||
    pathname.startsWith("/api/analytics") ||
    pathname === "/api/push/send"
  );
}

function getActor(session: SessionLike | null | undefined): Actor | null {
  const user = session?.user;
  if (!user?.id) return null;

  return {
    userId: user.id,
    role: user.role ?? "player",
    clubId: user.clubId,
    profileId: user.profileId,
  };
}

function addRateLimitHeaders(response: NextResponse, tier: RateLimitTier): NextResponse {
  response.headers.set("X-RateLimit-Limit", tier.limit);
  response.headers.set("X-RateLimit-Remaining", tier.remaining);
  response.headers.set("X-RateLimit-Reset", tier.resetSeconds);
  return response;
}

function rateLimitTier(pathname: string): RateLimitTier | null {
  if (pathname.startsWith("/api/marketplace/")) return SEARCH_RATE_LIMIT;
  if (pathname.startsWith("/api/bookings")) return BOOKING_RATE_LIMIT;
  if (pathname === "/api/push/send") return PUSH_RATE_LIMIT;
  if (isSensitiveApi(pathname) || isAdminPage(pathname)) return ADMIN_RATE_LIMIT;
  return null;
}

function withRouteHeaders(response: NextResponse, pathname: string): NextResponse {
  const tier = rateLimitTier(pathname);
  return tier ? addRateLimitHeaders(response, tier) : response;
}

function unauthorized(pathname: string, url: string, hasToken: boolean): NextResponse | null {
  if (isAdminPage(pathname)) {
    if (hasToken) return null;

    const loginUrl = new URL("/login", url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function sameOriginFromReferer(referer: string | null, requestOrigin: string): boolean {
  if (!referer) return false;
  if (!URL.canParse(referer)) return false;

  const refererUrl = new URL(referer);
  return refererUrl.origin === requestOrigin;
}

function requireCsrfOrSameOrigin(request: NextRequest): NextResponse | null {
  if (!isMutation(request.method) || !hasSessionToken(request)) return null;

  const origin = request.headers.get("origin");
  if (origin) return origin === request.nextUrl.origin ? null : forbidden();

  return sameOriginFromReferer(request.headers.get("referer"), request.nextUrl.origin) ? null : forbidden();
}

function requestedClubId(request: NextRequest): string | null {
  return request.nextUrl.searchParams.get("clubId") ?? request.headers.get("x-club-id");
}

function requireRole(actor: Actor, roles: readonly AuthRole[]): NextResponse | null {
  return roles.some((role) => role === actor.role) ? null : forbidden();
}

export async function requireClubAccess(actor: Actor, clubId: string, request: NextRequest): Promise<NextResponse | null> {
  try {
    await TenantContext.fromRequest({
      clubId,
      headers: request.headers,
      userId: actor.userId,
      role: actor.role,
    }).requireClubAccess(clubId);
    return null;
  } catch (error) {
    if (error instanceof TenantAccessError) return forbidden();
    throw error;
  }
}

async function requireTenantScope(actor: Actor, request: NextRequest): Promise<NextResponse | null> {
  if (actor.role === "platform_admin") return null;

  const clientClubId = requestedClubId(request);
  if (clientClubId) return requireClubAccess(actor, clientClubId, request);

  if (actor.role === "club_admin") {
    return actor.clubId ? requireClubAccess(actor, actor.clubId, request) : forbidden();
  }

  return null;
}

async function authorizeSensitiveApi(actor: Actor, request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/bookings")) {
    return requireRole(actor, ["player", "club_admin", "platform_admin"]) ?? requireTenantScope(actor, request);
  }

  if (pathname.startsWith("/api/tournaments") && request.method === "GET") {
    return null;
  }

  const roleResponse = requireRole(actor, ["club_admin", "platform_admin"]);
  if (roleResponse) return roleResponse;

  return requireTenantScope(actor, request);
}

async function authorizeRequest(request: AuthenticatedRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (isPublicMarketplaceApi(pathname)) return null;

  const csrfResponse = requireCsrfOrSameOrigin(request);
  if (csrfResponse) return csrfResponse;

  if (!isAdminPage(pathname) && !pathname.startsWith("/api/")) return null;

  const actor = getActor(request.auth);
  if (!actor) return unauthorized(pathname, request.url, hasSessionToken(request));

  if (isAdminPage(pathname)) {
    const roleResponse = requireRole(actor, ["club_admin", "platform_admin"]);
    if (roleResponse) return roleResponse;
    return requireTenantScope(actor, request);
  }

  if (isSensitiveApi(pathname)) return authorizeSensitiveApi(actor, request);

  return null;
}

export default auth(async (request) => {
  const pathname = request.nextUrl.pathname;
  const response = await authorizeRequest(request);

  if (response) return withRouteHeaders(response, pathname);

  return withRouteHeaders(
    NextResponse.next({ request: { headers: requestWithTenantHeaders(request) } }),
    pathname
  );
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/bookings/:path*",
    "/api/invoices/:path*",
    "/api/tournaments/:path*",
    "/api/analytics/:path*",
    "/api/push/send",
    "/api/marketplace/:path*",
    "/((?!api|admin|login|register|buscar|clubes|_next|.*\\..*).*)",
  ],
};
