import Database from "better-sqlite3";

const DB_PATH = "data/padel.db";

// Ensure data dir exists
import { mkdirSync } from "fs";
mkdirSync("data", { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const uuid = (): string => crypto.randomUUID();

// ─── Create tables ─────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS clubs (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    pricing TEXT NOT NULL,
    theme TEXT NOT NULL,
    cancellation_policy TEXT NOT NULL,
    contact TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS courts (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    court_type TEXT NOT NULL DEFAULT 'glass',
    indoor INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT,
    image TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'guest',
    member_type TEXT NOT NULL DEFAULT 'non_member',
    display_name TEXT NOT NULL,
    phone TEXT,
    level INTEGER,
    joined_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    court_id TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS partner_posts (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level INTEGER NOT NULL,
    schedule TEXT NOT NULL,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
`);


// ─── Seed El Remate ────────────────────────────────────

const now = Math.floor(Date.now() / 1000);
const clubId = uuid();

db.prepare(`
  INSERT INTO clubs (id, slug, name, pricing, theme, cancellation_policy, contact, content, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  clubId,
  "el-remate",
  "El Remate Padel Club",
  JSON.stringify({ memberPrice: 8, nonMemberPrice: 12, currency: "EUR" }),
  JSON.stringify({ primaryColor: "#1a3a2a", surfaceColor: "#d4eaf7", fontFamily: "Saira", logoUrl: "/logo.png", borderRadius: "md" }),
  JSON.stringify({ minHoursBefore: 6, penaltyPercent: 50, allowRefund: true }),
  JSON.stringify({ phone: "619 81 74 51", email: "elrematepadelclub@gmail.com", whatsapp: "34619817451", address: "Av. Montes Sierra, 38 — Sevilla 41007", googleMapsUrl: "https://maps.google.com/?q=Av.+Montes+Sierra,+38,+Sevilla" }),
  JSON.stringify({ 
    hero: { 
      title: "El Remate Padel Club", 
      subtitle: "Tu club de pádel en Sevilla", 
      description: "11 pistas indoor de cristal cubiertas. Escuela de pádel con los mejores profesionales, torneos, partidos nivelados y mucho más.", 
      heroImageUrl: null, 
      photos: [] 
    }, 
    about: "Nuestras instalaciones cuentan con 11 pistas indoor de cristal cubiertas, servicio de bar y terraza. Además contamos con vestuarios con duchas, taquillas y una amplia zona de aparcamiento.\n\nNuestra Escuela de Pádel es de las más prestigiosas de Sevilla y está coordinada por Fran Piñero y formada por el cuerpo técnico de Vicente Díaz, Paco Salazar y Franco Solimano. Clases para todos los niveles y edades en horario de mañana y tarde.\n\nAdemás, contamos con numerosos grupos de WhatsApp para montar partidos nivelados. Todos los días montamos partidos entre nuestros clientes.", 
    prices: "Precios por pista y hora:\n\nNo socios: 12 € por persona (90 min)\nSocios: 8 € por persona (90 min)\n\nEscuela de Pádel:\nConsulta precios por WhatsApp: 658 090 639", 
    openingHours: "Lunes a domingo de 9:00 a 00:00" 
  }),
  now, now
);

for (let i = 1; i <= 11; i++) {
  db.prepare(`INSERT INTO courts (id, club_id, name, court_type, indoor, is_active, "order", created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuid(), clubId, `Pista ${i}`, "glass", 1, 1, i, now);
}

// ─── Create test/guest user (for bookings without auth) ─────────────

const guestId = "00000000-0000-0000-0000-000000000000";
db.prepare(`INSERT OR IGNORE INTO users (id, email, name, password_hash, image, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
  .run(guestId, "guest@padel.app", "Guest User", null, null, now);

db.prepare(`INSERT OR IGNORE INTO user_profiles (id, user_id, club_id, role, member_type, display_name, phone, level, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(uuid(), guestId, clubId, "guest", "non_member", "Guest", null, null, now);

// ─── Seed announcements ────────────────────────────────
  db.prepare(`INSERT INTO announcements (id, club_id, title, content, type, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuid(), clubId, "¡Campeones de Andalucía!", "Nuestro equipo se proclama campeón en 1ª Categoría. ¡Enhorabuena a Ignacio, Álvaro, Franco, Laura, Beatriz y todo el equipo!", "torneo", 1, now, now);

  db.prepare(`INSERT INTO announcements (id, club_id, title, content, type, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuid(), clubId, "Nuevos horarios de escuela", "La escuela de pádel amplía horarios. Clases para todos los niveles de lunes a sábado. ¡Pregunta por WhatsApp!", "escuela", 1, now, now);

  db.prepare(`INSERT INTO announcements (id, club_id, title, content, type, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuid(), clubId, "Torneo interno este sábado", "Apúntate al torneo interno del club. Niveles 3-5. Premio: 1 mes de socio gratis. Plazas limitadas.", "torneo", 1, now, now);

// ─── Seed partner posts ────────────────────────────────
  db.prepare(`INSERT INTO partner_posts (id, club_id, user_id, name, level, schedule, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuid(), clubId, guestId, "Carlos R.", 4, "Jueves y viernes tarde", "Busco partido nivel medio. Juego de drive.", 1, now);

  db.prepare(`INSERT INTO partner_posts (id, club_id, user_id, name, level, schedule, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuid(), clubId, guestId, "Laura M.", 3, "Mañanas entre semana", "Nivel iniciación-medio. Prefiero pista panorámica.", 1, now);

  db.prepare(`INSERT INTO partner_posts (id, club_id, user_id, name, level, schedule, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuid(), clubId, guestId, "Pablo S.", 5, "Fines de semana", "Busco revés para torneo interno del club.", 1, now);

  db.prepare(`INSERT INTO partner_posts (id, club_id, user_id, name, level, schedule, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuid(), clubId, guestId, "Ana D.", 2, "Lunes y miércoles 18:00", "Estoy empezando, busco gente con paciencia para mejorar.", 1, now);

console.log("✅ Seeded: El Remate Padel Club (" + clubId + ") with 11 courts + test user");
db.close();
