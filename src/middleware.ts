// ─── Auth middleware — protects /admin routes ───────────────────────────────

import { auth } from "@/infra/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type AuthenticatedRequest = NextRequest & {
  auth?: { user?: { role?: string } } | null;
};

type AdminRequestInput = {
  pathname: string;
  url: string;
  auth?: { user?: { role?: string } } | null;
};

function isAdminRoute(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export function authorizeAdminRequest({
  pathname,
  url,
  auth: session,
}: AdminRequestInput) {
  if (!isAdminRoute(pathname)) return null;

  if (!session) {
    const loginUrl = new URL("/login", url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.user?.role !== "club_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const response = authorizeAdminRequest({
    pathname,
    url: req.url,
    auth: (req as AuthenticatedRequest).auth,
  });

  if (response) return response;

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
