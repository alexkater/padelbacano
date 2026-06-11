import { describe, expect, it, vi } from "vitest";

vi.mock("../infra/auth/config", () => ({
  auth: (handler: unknown) => handler,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: () => null,
    redirect: (url: URL) =>
      new Response(null, {
        status: 307,
        headers: { location: url.toString() },
      }),
    json: (body: unknown, init?: ResponseInit) =>
      Response.json(body, init),
  },
}));

import { authorizeAdminRequest } from "../middleware";

describe("role-based admin access", () => {
  it("returns 403 when a player accesses admin middleware", () => {
    const response = authorizeAdminRequest({
      pathname: "/admin/bookings",
      url: "http://localhost/admin/bookings",
      auth: { user: { role: "player" } },
    });

    expect(response?.status).toBe(403);
  });

  it("allows a club_admin to access admin middleware", () => {
    const response = authorizeAdminRequest({
      pathname: "/admin/bookings",
      url: "http://localhost/admin/bookings",
      auth: { user: { role: "club_admin" } },
    });

    expect(response).toBeNull();
  });

  it("redirects unauthenticated admin requests to login", () => {
    const response = authorizeAdminRequest({
      pathname: "/admin/bookings",
      url: "http://localhost/admin/bookings",
      auth: null,
    });

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe(
      "http://localhost/login?callbackUrl=%2Fadmin%2Fbookings"
    );
  });
});
