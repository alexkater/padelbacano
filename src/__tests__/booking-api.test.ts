import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Booking } from "@/core/entities/booking";
import type { Club } from "@/core/entities/club";

const state = vi.hoisted(() => ({
  auth: vi.fn(),
  emailConfirmation: vi.fn(),
  existingBookings: [] as Booking[],
  createdBookings: [] as Booking[],
}));

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  const startTime = overrides.startTime ?? new Date("2030-01-01T10:00:00.000Z");
  const endTime =
    overrides.endTime ?? new Date(startTime.getTime() + 60 * 60 * 1000);

  return {
    id: overrides.id ?? "booking-1",
    courtId: overrides.courtId ?? "court-1",
    userId: overrides.userId ?? "user-1",
    startTime,
    endTime,
    duration: overrides.duration ?? 60,
    status: overrides.status ?? "confirmed",
    notes: overrides.notes ?? null,
    createdAt: overrides.createdAt ?? new Date("2030-01-01T09:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2030-01-01T09:00:00.000Z"),
    court: overrides.court,
    user: overrides.user,
  };
}

const activeClub: Club = {
  id: "club-1",
  slug: "mogambo",
  name: "Club Mogambo",
  pricing: {
    memberPrice: 1800,
    nonMemberPrice: 2400,
    currency: "EUR",
  },
  theme: {
    primaryColor: "#1a3a2a",
    surfaceColor: "#ffffff",
    fontFamily: "Saira",
    logoUrl: null,
    borderRadius: "md",
  },
  cancellationPolicy: {
    minHoursBefore: 24,
    penaltyPercent: 0,
    allowRefund: true,
  },
  contact: {
    phone: "+34 600 000 000",
    email: "club@example.com",
    whatsapp: null,
    address: "Calle Club 1",
    googleMapsUrl: null,
  },
  content: {
    hero: {
      title: "Club Mogambo",
      subtitle: "Reserva tu pista",
      description: "Pádel para todos",
      heroImageUrl: null,
      photos: [],
    },
    about: "",
    prices: "",
    openingHours: "",
  },
  courts: [
    {
      id: "court-1",
      clubId: "club-1",
      name: "Pista 1",
      courtType: "glass",
      indoor: false,
      isActive: true,
      order: 1,
      createdAt: new Date("2030-01-01T09:00:00.000Z"),
    },
  ],
  createdAt: new Date("2030-01-01T09:00:00.000Z"),
  updatedAt: new Date("2030-01-01T09:00:00.000Z"),
};

vi.mock("@/infra/auth/config", () => ({
  auth: state.auth,
}));

vi.mock("@/infra/db/repositories", () => ({
  clubRepo: {
    findBySlug: vi.fn(async () => activeClub),
  },
  bookingRepo: {
    findById: vi.fn(async () => null),
    list: vi.fn(async (filters: { courtId?: string; status?: string }) =>
      state.existingBookings.filter((booking) => {
        if (filters.courtId && booking.courtId !== filters.courtId) return false;
        if (filters.status && booking.status !== filters.status) return false;
        return true;
      })
    ),
    getAvailableSlots: vi.fn(async () => []),
    isSlotAvailable: vi.fn(async () => true),
    create: vi.fn(async (input: Omit<Booking, "id" | "createdAt" | "updatedAt">) => {
      const created = makeBooking({
        ...input,
        id: `created-${state.createdBookings.length + 1}`,
        createdAt: new Date("2030-01-01T09:30:00.000Z"),
        updatedAt: new Date("2030-01-01T09:30:00.000Z"),
      });
      state.createdBookings.push(created);
      return created;
    }),
    updateStatus: vi.fn(),
    countByDateRange: vi.fn(async () => 0),
    listByDate: vi.fn(async () => []),
  },
}));

vi.mock("@/infra/email", () => ({
  emailService: {
    send: vi.fn(async () => true),
    sendBookingConfirmation: state.emailConfirmation,
    sendCancellationNotice: vi.fn(async () => true),
  },
}));

import { POST } from "@/app/api/bookings/route";

function postBooking(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }) as never
  );
}

describe("POST /api/bookings", () => {
  beforeEach(() => {
    state.auth.mockReset();
    state.emailConfirmation.mockReset();
    state.existingBookings = [];
    state.createdBookings = [];
  });

  it("returns 201 and books for the authenticated user", async () => {
    state.auth.mockResolvedValue({
      user: { id: "user-authenticated", role: "player" },
    });

    const response = await postBooking({
      courtId: "court-1",
      userId: "malicious-other-user",
      startTime: "2030-01-01T10:00:00.000Z",
      duration: 60,
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.booking.userId).toBe("user-authenticated");
    expect(state.createdBookings).toHaveLength(1);
    expect(state.emailConfirmation).not.toHaveBeenCalled();
  });

  it("returns 409 when the requested slot conflicts with an existing booking", async () => {
    state.auth.mockResolvedValue({
      user: { id: "user-authenticated", role: "player" },
    });
    state.existingBookings = [
      makeBooking({
        courtId: "court-1",
        startTime: new Date("2030-01-01T10:00:00.000Z"),
        endTime: new Date("2030-01-01T11:00:00.000Z"),
      }),
    ];

    const response = await postBooking({
      courtId: "court-1",
      startTime: "2030-01-01T10:30:00.000Z",
      duration: 60,
    });

    expect(response.status).toBe(409);
    expect(state.createdBookings).toHaveLength(0);
  });

  it("returns 401 when the request is unauthenticated", async () => {
    state.auth.mockResolvedValue(null);

    const response = await postBooking({
      courtId: "court-1",
      startTime: "2030-01-01T10:00:00.000Z",
      duration: 60,
    });

    expect(response.status).toBe(401);
    expect(state.createdBookings).toHaveLength(0);
  });
});
