import { hashSync } from "bcryptjs";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to run the seed script.");
  process.exit(1);
}

const DEMO_PASSWORD_HASH = hashSync("demo123", 10);

const clubs = [
  {
    id: "club-bogota",
    slug: "club-bogota",
    name: "Club Pádel Bogotá",
    pricing: {
      memberPrice: 50000,
      nonMemberPrice: 70000,
      currency: "COP",
    },
    theme: {
      primaryColor: "#0F766E",
      surfaceColor: "#F8FAFC",
      fontFamily: "Inter",
      logoUrl: null,
      borderRadius: "lg" as const,
    },
    cancellationPolicy: {
      minHoursBefore: 6,
      penaltyPercent: 50,
      allowRefund: true,
    },
    contact: {
      phone: "+57 300 123 4567",
      email: "hola@clubbogota.com",
      whatsapp: "+57 300 123 4567",
      address: "Chapinero, Bogotá, Colombia",
      googleMapsUrl: null,
    },
    content: {
      hero: {
        title: "Pádel en Bogotá",
        subtitle: "Reserva rápido y juega mejor",
        description:
          "Clases, reservas y comunidad de pádel para clubes modernos en Bogotá.",
        heroImageUrl: null,
        photos: [
          "https://images.unsplash.com/photo-1622279457486-67c26f7f2b7a?auto=format&fit=crop&w=1200&q=80",
        ],
      },
      about:
        "Club demo para la ciudad de Bogotá con gestión de reservas, socios y partidos abiertos.",
      prices: "Tarifas demo para membresías y reservas de cancha en COP.",
      openingHours: "Lunes a domingo, 6:00 a.m. - 11:00 p.m.",
    },
  },
  {
    id: "club-medellin",
    slug: "club-medellin",
    name: "Club Pádel Medellín",
    pricing: {
      memberPrice: 45000,
      nonMemberPrice: 65000,
      currency: "COP",
    },
    theme: {
      primaryColor: "#7C3AED",
      surfaceColor: "#FFF7ED",
      fontFamily: "Inter",
      logoUrl: null,
      borderRadius: "lg" as const,
    },
    cancellationPolicy: {
      minHoursBefore: 6,
      penaltyPercent: 50,
      allowRefund: true,
    },
    contact: {
      phone: "+57 300 765 4321",
      email: "hola@clubmedellin.com",
      whatsapp: "+57 300 765 4321",
      address: "El Poblado, Medellín, Colombia",
      googleMapsUrl: null,
    },
    content: {
      hero: {
        title: "Pádel en Medellín",
        subtitle: "Una experiencia ágil para tu club",
        description:
          "Reservas, membresías y contenido local para clubes de pádel en Medellín.",
        heroImageUrl: null,
        photos: [
          "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80",
        ],
      },
      about:
        "Club demo para Medellín con una configuración lista para pruebas de producto y QA.",
      prices: "Tarifas demo para pádel recreativo y membresías en COP.",
      openingHours: "Lunes a domingo, 6:00 a.m. - 11:00 p.m.",
    },
  },
] as const;

const courts = [
  {
    id: "court-bog-1",
    clubId: "club-bogota",
    name: "Cancha Bogotá 1",
    courtType: "glass" as const,
    indoor: true,
    isActive: true,
    order: 1,
  },
  {
    id: "court-bog-2",
    clubId: "club-bogota",
    name: "Cancha Bogotá 2",
    courtType: "panoramic" as const,
    indoor: true,
    isActive: true,
    order: 2,
  },
  {
    id: "court-med-1",
    clubId: "club-medellin",
    name: "Cancha Medellín 1",
    courtType: "glass" as const,
    indoor: true,
    isActive: true,
    order: 1,
  },
  {
    id: "court-med-2",
    clubId: "club-medellin",
    name: "Cancha Medellín 2",
    courtType: "panoramic" as const,
    indoor: true,
    isActive: true,
    order: 2,
  },
] as const;

const users = [
  {
    id: "user-admin-bogota",
    email: "admin@bogota.com",
    name: "Admin Bogotá",
    passwordHash: DEMO_PASSWORD_HASH,
  },
  {
    id: "user-admin-medellin",
    email: "admin@medellin.com",
    name: "Admin Medellín",
    passwordHash: DEMO_PASSWORD_HASH,
  },
  {
    id: "user-jugador1",
    email: "jugador1@demo.com",
    name: "Jugador Demo 1",
    passwordHash: DEMO_PASSWORD_HASH,
  },
  {
    id: "user-jugador2",
    email: "jugador2@demo.com",
    name: "Jugador Demo 2",
    passwordHash: DEMO_PASSWORD_HASH,
  },
] as const;

const userProfiles = [
  {
    id: "profile-bogota-admin",
    userId: "user-admin-bogota",
    clubId: "club-bogota",
    role: "admin" as const,
    memberType: "member" as const,
    displayName: "Admin Bogotá",
    phone: "+57 300 123 4567",
    level: 5,
  },
  {
    id: "profile-medellin-admin",
    userId: "user-admin-medellin",
    clubId: "club-medellin",
    role: "admin" as const,
    memberType: "member" as const,
    displayName: "Admin Medellín",
    phone: "+57 300 765 4321",
    level: 5,
  },
  {
    id: "profile-bogota-jugador1",
    userId: "user-jugador1",
    clubId: "club-bogota",
    role: "member" as const,
    memberType: "member" as const,
    displayName: "Jugador Demo 1",
    phone: "+57 310 111 1111",
    level: 3,
  },
  {
    id: "profile-medellin-jugador2",
    userId: "user-jugador2",
    clubId: "club-medellin",
    role: "member" as const,
    memberType: "member" as const,
    displayName: "Jugador Demo 2",
    phone: "+57 310 222 2222",
    level: 4,
  },
] as const;

const bookings = [
  {
    id: "booking-bog-20260701-1",
    courtId: "court-bog-1",
    userId: "user-admin-bogota",
    startTime: new Date("2026-07-01T18:00:00-05:00"),
    endTime: new Date("2026-07-01T19:00:00-05:00"),
    duration: 60,
    status: "confirmed" as const,
    notes: "Reserva demo para administrador.",
  },
  {
    id: "booking-bog-20260702-1",
    courtId: "court-bog-2",
    userId: "user-jugador1",
    startTime: new Date("2026-07-02T19:00:00-05:00"),
    endTime: new Date("2026-07-02T20:30:00-05:00"),
    duration: 90,
    status: "confirmed" as const,
    notes: "Partido social demo.",
  },
  {
    id: "booking-med-20260703-1",
    courtId: "court-med-1",
    userId: "user-admin-medellin",
    startTime: new Date("2026-07-03T18:00:00-05:00"),
    endTime: new Date("2026-07-03T19:00:00-05:00"),
    duration: 60,
    status: "confirmed" as const,
    notes: "Reserva demo para administrador.",
  },
  {
    id: "booking-med-20260704-1",
    courtId: "court-med-2",
    userId: "user-jugador2",
    startTime: new Date("2026-07-04T20:00:00-05:00"),
    endTime: new Date("2026-07-04T21:00:00-05:00"),
    duration: 60,
    status: "confirmed" as const,
    notes: "Reserva nocturna demo.",
  },
  {
    id: "booking-bog-20260706-1",
    courtId: "court-bog-1",
    userId: "user-jugador1",
    startTime: new Date("2026-07-06T07:00:00-05:00"),
    endTime: new Date("2026-07-06T08:30:00-05:00"),
    duration: 90,
    status: "confirmed" as const,
    notes: "Entrenamiento temprano demo.",
  },
  {
    id: "booking-med-20260707-1",
    courtId: "court-med-1",
    userId: "user-jugador2",
    startTime: new Date("2026-07-07T18:30:00-05:00"),
    endTime: new Date("2026-07-07T20:00:00-05:00"),
    duration: 90,
    status: "confirmed" as const,
    notes: "Cierre de semana demo.",
  },
] as const;

async function main() {
  const { db, schema } = await import("./index");

  await db.insert(schema.clubs).values(clubs as any).onConflictDoNothing();
  await db.insert(schema.courts).values(courts as any).onConflictDoNothing();
  await db.insert(schema.users).values(users as any).onConflictDoNothing();
  await db
    .insert(schema.userProfiles)
    .values(userProfiles as any)
    .onConflictDoNothing();
  await db.insert(schema.bookings).values(bookings as any).onConflictDoNothing();

  console.log("Seed completed successfully.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
