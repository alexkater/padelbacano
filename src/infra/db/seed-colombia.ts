// allow: SIZE_OK — deterministic marketplace seed generator with compact in-file data tables required by T1.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hashSync } from "bcryptjs";
import { count } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to run the Colombia seed script.");
  process.exit(1);
}

// ─── Production guard ──────────────────────────────────────────────────────
// This seed is designed for E2E test environments only. It seeds demo users
// with known passwords (demo123) and must never run against production.
// Set E2E_RESET_DB=1 to acknowledge this is a test database.
if (!process.env.E2E_RESET_DB) {
  console.error(
    "Production guard: set E2E_RESET_DB=1 to confirm this is a test database.\n" +
    "This script seeds demo users/passwords and must never run against production."
  );
  process.exit(1);
}

type ClubInsert = typeof import("./schema").clubs.$inferInsert;
type ClubConfigInsert = typeof import("./schema").clubConfigs.$inferInsert;
type CourtInsert = typeof import("./schema").courts.$inferInsert;
type CourtPricingInsert = typeof import("./schema").courtPricing.$inferInsert;
type UserInsert = typeof import("./schema").users.$inferInsert;
type UserProfileInsert = typeof import("./schema").userProfiles.$inferInsert;

type CsvClub = {
  readonly name: string;
  readonly city: string;
  readonly department: string;
  readonly courts: number;
  readonly peakPriceInCents: number;
  readonly offPeakPriceInCents: number;
  readonly source: "csv" | "inferred" | "canonical";
};

type CityTarget = {
  readonly city: string;
  readonly department: string;
  readonly target: number;
  readonly peakPriceInCents: number;
  readonly offPeakPriceInCents: number;
};

const CSV_PATH = join(process.cwd(), "clubes_padel_colombia_2026.csv");
const DEMO_PASSWORD_HASH = hashSync("demo123", 10);
const OPENING_HOUR = 6;
const CLOSING_HOUR = 23;
const WEEKDAY_COUNT = 7;
const PHOTOS = [
  "https://images.unsplash.com/photo-1622279457486-67c26f7f2b7a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80",
] as const;
const PRIMARY_COLORS = ["#0F766E", "#2563EB", "#7C3AED", "#D97706", "#059669"] as const;
const SURFACES = ["césped sintético", "césped azul", "césped verde", "panorámica premium"] as const;
const COURT_TYPES = ["glass", "panoramic", "wall"] as const;
const PLAYER_NAMES = [
  "María Fernanda Rojas", "Santiago Mejía", "Laura González", "Juan Sebastián Pérez", "Camila Torres",
  "Andrés Ramírez", "Valentina Castro", "Daniel Martínez", "Isabella Gómez", "Nicolás Herrera",
  "Paula Moreno", "Miguel Ángel Díaz", "Daniela Vargas", "Felipe Salazar", "Sara Cárdenas",
] as const;
const ADMIN_NAMES = ["Admin Bogotá", "Admin Medellín", "Admin Cali", "Admin Barranquilla", "Admin Bucaramanga", "Admin Cartagena"] as const;
const CITY_TARGETS = [
  ["Bogotá", "Cundinamarca", 70, 15000000, 8500000], ["Medellín", "Antioquia", 30, 16000000, 9000000],
  ["Cali", "Valle del Cauca", 16, 13000000, 7500000], ["Barranquilla", "Atlántico", 10, 13000000, 7500000],
  ["Cartagena", "Bolívar", 8, 13500000, 8500000], ["Bucaramanga", "Santander", 8, 10500000, 6000000],
  ["Pereira", "Risaralda", 7, 10500000, 5500000], ["Manizales", "Caldas", 5, 9500000, 5500000],
  ["Armenia", "Quindío", 5, 9500000, 5500000], ["Santa Marta", "Magdalena", 5, 12000000, 8000000],
  ["Cúcuta", "Norte de Santander", 5, 10000000, 5500000], ["Ibagué", "Tolima", 5, 9000000, 5000000],
  ["Neiva", "Huila", 4, 9000000, 5000000], ["Villavicencio", "Meta", 4, 10000000, 6000000],
  ["Montería", "Córdoba", 4, 10500000, 6500000], ["Sincelejo", "Sucre", 3, 9000000, 5000000],
  ["Valledupar", "Cesar", 3, 9500000, 5500000], ["Pasto", "Nariño", 3, 8500000, 5000000],
  ["Popayán", "Cauca", 3, 8500000, 5000000], ["Tunja", "Boyacá", 3, 8500000, 5000000],
  ["Chía", "Cundinamarca", 8, 12500000, 7000000], ["Cajicá", "Cundinamarca", 5, 12000000, 7000000],
  ["Zipaquirá", "Cundinamarca", 3, 10000000, 6000000], ["Envigado", "Antioquia", 5, 15000000, 8500000],
  ["Sabaneta", "Antioquia", 4, 14500000, 8000000], ["Rionegro", "Antioquia", 4, 13500000, 8000000],
  ["Itagüí", "Antioquia", 3, 12000000, 7000000], ["Bello", "Antioquia", 3, 11500000, 6500000],
  ["Palmira", "Valle del Cauca", 4, 10000000, 6000000], ["Jamundí", "Valle del Cauca", 3, 11000000, 6500000],
  ["Yumbo", "Valle del Cauca", 2, 9500000, 5500000], ["Tuluá", "Valle del Cauca", 3, 9000000, 5000000],
  ["Buga", "Valle del Cauca", 2, 8500000, 5000000], ["Cota", "Cundinamarca", 4, 12000000, 7000000],
  ["La Calera", "Cundinamarca", 3, 11500000, 7000000], ["Sopó", "Cundinamarca", 2, 10500000, 6500000],
  ["Mosquera", "Cundinamarca", 3, 10000000, 6000000], ["Funza", "Cundinamarca", 2, 9500000, 5500000],
  ["Fusagasugá", "Cundinamarca", 2, 8500000, 5000000], ["Girardot", "Cundinamarca", 2, 9500000, 6000000],
  ["Duitama", "Boyacá", 2, 8500000, 5000000], ["Sogamoso", "Boyacá", 2, 8500000, 5000000],
  ["Yopal", "Casanare", 2, 9500000, 5500000], ["Floridablanca", "Santander", 4, 10000000, 6000000],
  ["Girón", "Santander", 2, 9000000, 5000000], ["Piedecuesta", "Santander", 2, 9000000, 5000000],
  ["Riohacha", "La Guajira", 1, 9000000, 5500000], ["Quibdó", "Chocó", 1, 8500000, 5000000],
  ["Leticia", "Amazonas", 1, 9500000, 6000000], ["San Andrés", "San Andrés y Providencia", 1, 12000000, 8000000],
  ["Apartadó", "Antioquia", 1, 9000000, 5500000], ["Chocontá", "Cundinamarca", 1, 8500000, 5000000],
  ["Tenjo", "Cundinamarca", 2, 10500000, 6500000],
] as const satisfies readonly (readonly [string, string, number, number, number])[];

function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseCsvLine(line: string): readonly string[] {
  const values: string[] = [];
  let current = "";
  let insideQuote = false;
  for (const character of line) {
    if (character === '"') {
      insideQuote = !insideQuote;
    } else if (character === "," && !insideQuote) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  values.push(current.trim());
  return values;
}

function parsePriceToCents(value: string, fallbackInCents: number): number {
  const pesosText = value.replace(/[^0-9]/g, "");
  if (pesosText.length === 0) return fallbackInCents;
  return Number.parseInt(pesosText, 10) * 100;
}

function canonicalCity(rawCity: string): string {
  const normalized = slugify(rawCity);
  const matched = cityTargets().find((target) => slugify(target.city) === normalized);
  return matched?.city ?? rawCity.trim();
}

function cityTargets(): readonly CityTarget[] {
  return CITY_TARGETS.map(([city, department, target, peakPriceInCents, offPeakPriceInCents]) => ({
    city, department, target, peakPriceInCents, offPeakPriceInCents,
  }));
}

function targetForCity(city: string): CityTarget {
  const matched = cityTargets().find((target) => target.city === city);
  return matched ?? { city, department: "Colombia", target: 2, peakPriceInCents: 10000000, offPeakPriceInCents: 6000000 };
}

function readCsvClubs(): readonly CsvClub[] {
  if (!existsSync(CSV_PATH)) return [];
  const lines = readFileSync(CSV_PATH, "utf8").split(/\r?\n/).filter((line) => line.trim().length > 0).slice(1);
  return lines.map((line) => {
    const [name = "", rawCity = "Bogotá", , , rawCourts = "2", rawPeak = "", rawOffPeak = ""] = parseCsvLine(line);
    const city = canonicalCity(rawCity);
    const target = targetForCity(city);
    const courts = Math.max(2, Math.min(6, Number.parseInt(rawCourts.split(".")[0] ?? "2", 10) || 2));
    const peakPriceInCents = parsePriceToCents(rawPeak, target.peakPriceInCents);
    const offPeakPriceInCents = parsePriceToCents(rawOffPeak, Math.min(target.offPeakPriceInCents, peakPriceInCents));
    return { name: name.trim(), city, department: target.department, courts, peakPriceInCents, offPeakPriceInCents, source: "csv" as const };
  }).filter((club) => club.name.length > 0);
}

function buildMarketClubs(): readonly CsvClub[] {
  const canonical: readonly CsvClub[] = [
    { name: "Club Pádel Bogotá", city: "Bogotá", department: "Cundinamarca", courts: 4, peakPriceInCents: 14000000, offPeakPriceInCents: 8000000, source: "canonical" },
    { name: "Club Pádel Medellín", city: "Medellín", department: "Antioquia", courts: 4, peakPriceInCents: 15000000, offPeakPriceInCents: 8500000, source: "canonical" },
  ];
  const realClubs = readCsvClubs();
  const clubs: CsvClub[] = [...canonical, ...realClubs];
  for (const target of cityTargets()) {
    const existing = clubs.filter((club) => club.city === target.city).length;
    for (let index = existing + 1; index <= target.target; index += 1) {
      const suffix = index.toString().padStart(2, "0");
      clubs.push({
        name: `Pádel ${target.city} ${suffix}`,
        city: target.city,
        department: target.department,
        courts: 2 + (index % 4),
        peakPriceInCents: target.peakPriceInCents + (index % 3) * 500000,
        offPeakPriceInCents: target.offPeakPriceInCents + (index % 2) * 500000,
        source: "inferred",
      });
    }
  }
  return clubs;
}

function stableClubId(slug: string): string {
  if (slug === "club-padel-bogota") return "club-bogota";
  if (slug === "club-padel-medellin") return "club-medellin";
  return `co-${slug}`;
}

function indexedSlug(name: string, city: string, seen: Map<string, number>): string {
  const base = slugify(`${name}-${city}`);
  const next = (seen.get(base) ?? 0) + 1;
  seen.set(base, next);
  return next === 1 ? base : `${base}-${next}`;
}

function buildSeedRows(): {
  clubs: ClubInsert[];
  clubConfigs: ClubConfigInsert[];
  courts: CourtInsert[];
  courtPricing: CourtPricingInsert[];
  users: UserInsert[];
  userProfiles: UserProfileInsert[];
} {
  const seenSlugs = new Map<string, number>();
  const clubs: ClubInsert[] = [];
  const clubConfigs: ClubConfigInsert[] = [];
  const courts: CourtInsert[] = [];
  const courtPricing: CourtPricingInsert[] = [];
  for (const [clubIndex, sourceClub] of buildMarketClubs().entries()) {
    const slug = sourceClub.source === "canonical" ? slugify(sourceClub.name) : indexedSlug(sourceClub.name, sourceClub.city, seenSlugs);
    const id = stableClubId(slug);
    const color = PRIMARY_COLORS[clubIndex % PRIMARY_COLORS.length] ?? PRIMARY_COLORS[0];
    const memberPrice = Math.round(sourceClub.offPeakPriceInCents * 85 / 100);
    const verified = sourceClub.source !== "inferred" && clubIndex % 5 !== 0;
    const status = verified || clubIndex % 4 !== 0 ? "active" : "pending_approval";
    const theme = { primaryColor: color, surfaceColor: "#F8FAFC", fontFamily: "Inter", logoUrl: null, borderRadius: "lg" } as const;
    const pricing = { memberPrice, nonMemberPrice: sourceClub.peakPriceInCents, currency: "COP" };
    const cancellationPolicy = { minHoursBefore: 6, penaltyPercent: 50, allowRefund: true };
    const phone = `+57 3${(10 + (clubIndex % 80)).toString().padStart(2, "0")} ${((100 + clubIndex) % 900).toString().padStart(3, "0")} ${((1000 + clubIndex * 7) % 9000).toString().padStart(4, "0")}`;
    clubs.push({
      id, slug, name: sourceClub.name, city: sourceClub.city, department: sourceClub.department, pricing, theme, cancellationPolicy,
      contact: { phone, email: `hola@${slug}.padelbacano.test`, whatsapp: phone, address: `${sourceClub.city}, ${sourceClub.department}, Colombia`, googleMapsUrl: null },
      content: {
        hero: { title: `${sourceClub.name} en ${sourceClub.city}`, subtitle: "Reserva canchas de pádel en Colombia", description: "Club colombiano disponible en el marketplace nacional de PádelBacano.", heroImageUrl: null, photos: [PHOTOS[clubIndex % PHOTOS.length] ?? PHOTOS[0]] },
        about: `${sourceClub.name} opera en ${sourceClub.city} con horarios amplios, canchas por reserva y comunidad local de pádel.`,
        prices: `Hora valle desde COP ${(sourceClub.offPeakPriceInCents / 100).toLocaleString("es-CO")} y hora pico desde COP ${(sourceClub.peakPriceInCents / 100).toLocaleString("es-CO")}.`,
        openingHours: "Lunes a domingo, 6:00 a.m. - 11:00 p.m. COT",
      },
    });
    clubConfigs.push({
      id: `config-${id}`, clubId: id, slug, name: sourceClub.name, city: sourceClub.city, department: sourceClub.department,
      nit: `900${(100000 + clubIndex).toString()}-${clubIndex % 9}`, phone, email: `admin@${slug}.padelbacano.test`, logoUrl: null, heroImageUrl: null,
      domain: `${slug}.padelbacano.test`, theme,
      pricing: { currency: "COP", peakPriceInCents: sourceClub.peakPriceInCents, offPeakPriceInCents: sourceClub.offPeakPriceInCents, memberDiscountPercent: 15 },
      modules: { social: true, payments: false, tournaments: true, analytics: false, invoicing: true, school: clubIndex % 3 === 0, loyalty: false },
      status, verified, cancellationPolicy: { ...cancellationPolicy, summary: "Cancelación sin penalidad hasta 6 horas antes; después aplica 50%." },
    });
    for (let courtOrder = 1; courtOrder <= sourceClub.courts; courtOrder += 1) {
      const cityPrefix = slugify(sourceClub.city).slice(0, 3) || "co";
      const courtId = id === "club-bogota" ? `court-bog-${courtOrder}` : id === "club-medellin" ? `court-med-${courtOrder}` : `court-${cityPrefix}-${clubIndex + 1}-${courtOrder}`;
      courts.push({ id: courtId, clubId: id, name: `Cancha ${courtOrder}`, courtType: COURT_TYPES[(courtOrder + clubIndex) % COURT_TYPES.length] ?? "glass", sport: "padel", surface: SURFACES[(courtOrder + clubIndex) % SURFACES.length] ?? "césped sintético", indoor: clubIndex % 6 !== 0, lighting: true, isActive: courtOrder !== sourceClub.courts || clubIndex % 17 !== 0, order: courtOrder });
      for (let weekday = 0; weekday < WEEKDAY_COUNT; weekday += 1) {
        for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour += 1) {
          const isPeak = weekday === 0 || weekday === 6 || hour >= 17;
          const day = (4 + weekday).toString().padStart(2, "0");
          courtPricing.push({ id: `price-${courtId}-${weekday}-${hour}`, courtId, weekday, startTime: new Date(`2026-01-${day}T${hour.toString().padStart(2, "0")}:00:00-05:00`), endTime: new Date(`2026-01-${day}T${(hour + 1).toString().padStart(2, "0")}:00:00-05:00`), priceInCents: isPeak ? sourceClub.peakPriceInCents : sourceClub.offPeakPriceInCents, isPeak });
        }
      }
    }
  }
  const users: UserInsert[] = [
    ...ADMIN_NAMES.map((name, index) => ({ id: index === 0 ? "user-admin-bogota" : index === 1 ? "user-admin-medellin" : `co-admin-${index + 1}`, email: index === 0 ? "admin@bogota.com" : index === 1 ? "admin@medellin.com" : `admin${index + 1}@padelbacano.test`, name, passwordHash: DEMO_PASSWORD_HASH })),
    ...PLAYER_NAMES.map((name, index) => ({ id: index === 0 ? "user-jugador1" : index === 1 ? "user-jugador2" : `co-player-${index + 1}`, email: index === 0 ? "jugador1@demo.com" : index === 1 ? "jugador2@demo.com" : `jugador${index + 1}@demo.com`, name, passwordHash: DEMO_PASSWORD_HASH })),
  ];
  const profileClubs = clubs.slice(0, Math.max(users.length, 21));
  const userProfiles = users.map((user, index) => ({ id: `profile-${user.id}`, userId: user.id, clubId: profileClubs[index]?.id ?? "club-bogota", role: index < ADMIN_NAMES.length ? "admin" : "member", memberType: "member", displayName: user.name, phone: `+57 310 ${((111 + index) % 900).toString().padStart(3, "0")} ${((1000 + index) % 9000).toString().padStart(4, "0")}`, level: index < ADMIN_NAMES.length ? 5 : 2 + (index % 5) })) satisfies UserProfileInsert[];
  return { clubs, clubConfigs, courts, courtPricing, users, userProfiles };
}

async function main(): Promise<void> {
  const { db, schema } = await import("./index");
  const rows = buildSeedRows();
  const [clubCount] = await db.select({ count: count() }).from(schema.clubs);
  const [courtCount] = await db.select({ count: count() }).from(schema.courts);
  const [userCount] = await db.select({ count: count() }).from(schema.users);
  const [configCount] = await db.select({ count: count() }).from(schema.clubConfigs);
  const [pricingCount] = await db.select({ count: count() }).from(schema.courtPricing);
  const [profileCount] = await db.select({ count: count() }).from(schema.userProfiles);
  if ((clubCount?.count ?? 0) < rows.clubs.length) {
    for (let index = 0; index < rows.clubs.length; index += 200) await db.insert(schema.clubs).values(rows.clubs.slice(index, index + 200)).onConflictDoNothing();
  }
  if ((configCount?.count ?? 0) < rows.clubConfigs.length) {
    for (let index = 0; index < rows.clubConfigs.length; index += 200) await db.insert(schema.clubConfigs).values(rows.clubConfigs.slice(index, index + 200)).onConflictDoNothing();
  }
  if ((courtCount?.count ?? 0) < rows.courts.length) {
    for (let index = 0; index < rows.courts.length; index += 500) await db.insert(schema.courts).values(rows.courts.slice(index, index + 500)).onConflictDoNothing();
  }
  if ((pricingCount?.count ?? 0) < rows.courtPricing.length) {
    for (let index = 0; index < rows.courtPricing.length; index += 1000) await db.insert(schema.courtPricing).values(rows.courtPricing.slice(index, index + 1000)).onConflictDoNothing();
  }
  if ((userCount?.count ?? 0) < rows.users.length) {
    await db.insert(schema.users).values(rows.users).onConflictDoNothing();
  }
  if ((profileCount?.count ?? 0) < rows.userProfiles.length) {
    await db.insert(schema.userProfiles).values(rows.userProfiles).onConflictDoNothing();
  }
  const [finalClubCount] = await db.select({ count: count() }).from(schema.clubs);
  const [finalCourtCount] = await db.select({ count: count() }).from(schema.courts);
  const [finalUserCount] = await db.select({ count: count() }).from(schema.users);
  console.log(`Colombia seed completed: generated ${rows.clubs.length} clubs, ${rows.courts.length} courts, ${rows.courtPricing.length} pricing slots, ${rows.users.length} users.`);
  console.log(`Database totals: clubs=${finalClubCount?.count ?? 0}, courts=${finalCourtCount?.count ?? 0}, users=${finalUserCount?.count ?? 0}.`);
}

main().then(() => {
  process.exit(0);
}).catch((error: unknown) => {
  // no-excuse-ok: catch — CLI boundary logs unknown failures and exits non-zero.
  console.error("Colombia seed failed:", error);
  process.exit(1);
});
