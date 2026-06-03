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

  CREATE TABLE IF NOT EXISTS membership_plans (    id TEXT PRIMARY KEY,    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,    name TEXT NOT NULL,    description TEXT,    price INTEGER NOT NULL,    currency TEXT NOT NULL DEFAULT '''EUR''',    interval TEXT NOT NULL DEFAULT '''monthly''',    benefits TEXT NOT NULL,    is_active INTEGER NOT NULL DEFAULT 1,    created_at INTEGER NOT NULL  );
  CREATE TABLE IF NOT EXISTS user_memberships (    id TEXT PRIMARY KEY,    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,    plan_id TEXT NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,    status TEXT NOT NULL DEFAULT '''active''',    start_date INTEGER NOT NULL,    end_date INTEGER NOT NULL,    created_at INTEGER NOT NULL  );
  CREATE TABLE IF NOT EXISTS pricing_rules (    id TEXT PRIMARY KEY,    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,    name TEXT NOT NULL,    day_of_week INTEGER,    start_hour INTEGER,    end_hour INTEGER,    member_price INTEGER NOT NULL,    non_member_price INTEGER NOT NULL,    is_active INTEGER NOT NULL DEFAULT 1,    created_at INTEGER NOT NULL  );
  CREATE TABLE IF NOT EXISTS player_levels (    id TEXT PRIMARY KEY,    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,    rating INTEGER NOT NULL DEFAULT 1000,    level INTEGER NOT NULL DEFAULT 1,    matches_played INTEGER NOT NULL DEFAULT 0,    matches_won INTEGER NOT NULL DEFAULT 0,    updated_at INTEGER NOT NULL  );
  CREATE TABLE IF NOT EXISTS open_matches (    id TEXT PRIMARY KEY,    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,    court_id TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,    creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,    title TEXT,    start_time INTEGER NOT NULL,    end_time INTEGER NOT NULL,    duration INTEGER NOT NULL,    min_level INTEGER,    max_level INTEGER,    max_players INTEGER NOT NULL DEFAULT 4,    status TEXT NOT NULL DEFAULT '''open''',    notes TEXT,    created_at INTEGER NOT NULL  );
  CREATE TABLE IF NOT EXISTS open_match_players (    id TEXT PRIMARY KEY,    match_id TEXT NOT NULL REFERENCES open_matches(id) ON DELETE CASCADE,    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,    joined_at INTEGER NOT NULL  );
  CREATE TABLE IF NOT EXISTS coaches (    id TEXT PRIMARY KEY,    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,    name TEXT NOT NULL,    bio TEXT,    photo_url TEXT,    specialties TEXT NOT NULL,    is_active INTEGER NOT NULL DEFAULT 1,    created_at INTEGER NOT NULL  );
  CREATE TABLE IF NOT EXISTS classes (    id TEXT PRIMARY KEY,    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,    coach_id TEXT NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,    court_id TEXT REFERENCES courts(id) ON DELETE SET NULL,    name TEXT NOT NULL,    description TEXT,    type TEXT NOT NULL DEFAULT '''group''',    level INTEGER,    max_students INTEGER NOT NULL DEFAULT 4,    price INTEGER NOT NULL,    schedule TEXT NOT NULL,    start_date INTEGER NOT NULL,    end_date INTEGER,    is_active INTEGER NOT NULL DEFAULT 1,    created_at INTEGER NOT NULL  );
  CREATE TABLE IF NOT EXISTS class_enrollments (    id TEXT PRIMARY KEY,    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,    status TEXT NOT NULL DEFAULT '''active''',    enrolled_at INTEGER NOT NULL  );
  CREATE TABLE IF NOT EXISTS chat_messages (    id TEXT PRIMARY KEY,    club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,    receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,    match_id TEXT REFERENCES open_matches(id) ON DELETE CASCADE,    content TEXT NOT NULL,    created_at INTEGER NOT NULL  );
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


// ─── Seed Demo Club 2: Pádel Norte Bogotá ────────────────────

const club2Id = uuid();

db.prepare(`INSERT INTO clubs (id, slug, name, pricing, theme, cancellation_policy, contact, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(
    club2Id,
    "padel-norte-bogota",
    "Pádel Norte Bogotá",
    JSON.stringify({ memberPrice: 35000, nonMemberPrice: 55000, currency: "COP" }),
    JSON.stringify({ primaryColor: "#0f4c81", surfaceColor: "#e8f0fe", fontFamily: "Inter", logoUrl: "/logo.png", borderRadius: "lg" }),
    JSON.stringify({ minHoursBefore: 4, penaltyPercent: 50, allowRefund: true }),
    JSON.stringify({ phone: "601 745 8900", email: "info@padelbogota.co", whatsapp: "573001234567", address: "Calle 134 #55-30, Bogotá", googleMapsUrl: "https://maps.google.com/?q=Calle+134+55-30+Bogota" }),
    JSON.stringify({ 
      hero: { 
        title: "Pádel Norte Bogotá", 
        subtitle: "El Club de Pádel más grande de Colombia", 
        description: "8 canchas de cristal con la mejor tecnología. Academia, torneos, restaurante y mucho más. Abierto 24 horas.", 
        heroImageUrl: null, 
        photos: [] 
      }, 
      about: "Pádel Norte Bogotá es el club de pádel más grande de Colombia con 8 canchas de cristal de última generación. Nuestras instalaciones incluyen gimnasio, restaurante, zona de coworking y terraza con vista a los cerros orientales.\n\nContamos con una academia de pádel dirigida por entrenadores certificados internacionalmente, con programas para todos los niveles: iniciación, intermedio, avanzado y competición.\n\nNuestro sistema de reservas inteligente garantiza disponibilidad para todos nuestros socios, con precios preferenciales y eventos exclusivos.", 
      prices: "Precios por pista y hora (90 min):\n\nSocios: 35.000 COP por persona\nNo socios: 55.000 COP por persona\n\nMembresías desde 150.000 COP/mes con beneficios exclusivos.\n\nHorarios valle (lunes a viernes 9:00-14:00): 20% descuento.", 
      openingHours: "Lunes a domingo de 9:00 a 23:00 (24h para socios premium)" 
    }),
    now, now
  );

for (let i = 1; i <= 8; i++) {
  db.prepare(`INSERT INTO courts (id, club_id, name, court_type, indoor, is_active, "order", created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuid(), club2Id, `Cancha ${i}`, i <= 6 ? "glass" : "panoramic", 1, 1, i, now);
}

// Add guest profile for club 2
db.prepare(`INSERT OR IGNORE INTO user_profiles (id, user_id, club_id, role, member_type, display_name, phone, level, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(uuid(), guestId, club2Id, "guest", "non_member", "Guest", null, null, now);

// Seed announcements for club 2
db.prepare(`INSERT INTO announcements (id, club_id, title, content, type, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(uuid(), club2Id, "¡Inauguración de nuevas canchas panorámicas!", "Estrenamos 2 canchas panorámicas con vista a los cerros orientales. Reserva tu turno y disfruta de la mejor experiencia de pádel en Bogotá.", "general", 1, now, now);

db.prepare(`INSERT INTO announcements (id, club_id, title, content, type, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(uuid(), club2Id, "Torneo Interclubes 2026", "Participa en el torneo interclubes más importante del año. Categorías: 3ª, 4ª y 5ª. Inscripciones abiertas hasta el 15 de junio.", "torneo", 1, now, now);

// Seed partner posts for club 2
db.prepare(`INSERT INTO partner_posts (id, club_id, user_id, name, level, schedule, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(uuid(), club2Id, guestId, "Andrés M.", 5, "Martes y jueves 19:00", "Busco partidos de nivel alto. Juego de revés. Preparándome para torneos.", 1, now);

db.prepare(`INSERT INTO partner_posts (id, club_id, user_id, name, level, schedule, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(uuid(), club2Id, guestId, "Diana C.", 3, "Sábados por la mañana", "Nivel intermedio, busco grupo fijo para jugar los sábados.", 1, now);

console.log("✅ Seeded: Pádel Norte Bogotá (" + club2Id + ") with 8 courts");

// ─── Seed pricing rules for club 1 ──────────────────────────  db.prepare(`INSERT INTO pricing_rules (id, club_id, name, day_of_week, start_hour, end_hour, member_price, non_member_price, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)    .run(uuid(), clubId, "Hora valle", null, 9, 14, 600, 1000, 1, now);  db.prepare(`INSERT INTO pricing_rules (id, club_id, name, day_of_week, start_hour, end_hour, member_price, non_member_price, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)    .run(uuid(), clubId, "Hora punta", null, 14, 23, 800, 1200, 1, now);
// ─── Seed coaches for club 1 ────────────────────────────────  const coach1Id = uuid();  db.prepare(`INSERT INTO coaches (id, club_id, user_id, name, bio, photo_url, specialties, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)    .run(coach1Id, clubId, null, "Fran Piñero", "Coordinador de la Escuela de Pádel. Más de 15 años de experiencia formando jugadores de todos los niveles.", null, JSON.stringify(["iniciación", "competición", "adultos"]), 1, now);  db.prepare(`INSERT INTO coaches (id, club_id, user_id, name, bio, photo_url, specialties, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)    .run(uuid(), clubId, null, "Vicente Díaz", "Entrenador nacional especializado en técnica avanzada y preparación física.", null, JSON.stringify(["técnica", "físico", "avanzado"]), 1, now);  db.prepare(`INSERT INTO coaches (id, club_id, user_id, name, bio, photo_url, specialties, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)    .run(uuid(), clubId, null, "Paco Salazar", "Especialista en formación infantil y juvenil. Metodología lúdica adaptada a cada edad.", null, JSON.stringify(["infantil", "juvenil", "iniciación"]), 1, now);
// ─── Seed classes for club 1 ─────────────────────────────────  db.prepare(`INSERT INTO classes (id, club_id, coach_id, court_id, name, description, type, level, max_students, price, schedule, start_date, end_date, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)    .run(uuid(), clubId, coach1Id, null, "Iniciación Adultos", "Clase grupal para adultos que empiezan en el pádel. Técnica básica y primeros partidos.", "group", 1, 4, 1500, JSON.stringify({ daysOfWeek: [1, 3], startHour: 10, endHour: 11 }), now, now + 86400 * 90, 1, now);  db.prepare(`INSERT INTO classes (id, club_id, coach_id, court_id, name, description, type, level, max_students, price, schedule, start_date, end_date, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)    .run(uuid(), clubId, coach1Id, null, "Competición Avanzado", "Preparación para torneos. Táctica, estrategia y mentalidad competitiva.", "group", 5, 4, 2000, JSON.stringify({ daysOfWeek: [2, 4], startHour: 18, endHour: 20 }), now, now + 86400 * 90, 1, now);  db.prepare(`INSERT INTO classes (id, club_id, coach_id, court_id, name, description, type, level, max_students, price, schedule, start_date, end_date, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)    .run(uuid(), clubId, coach1Id, null, "Escuela Infantil", "Clases para niños de 6 a 12 años. Juegos, técnica y valores deportivos.", "kids", 1, 6, 1200, JSON.stringify({ daysOfWeek: [6], startHour: 10, endHour: 12 }), now, now + 86400 * 180, 1, now);
// ─── Seed open matches for club 1 ───────────────────────────  const tomorrow = now + 86400;  const matchStart = new Date((tomorrow) * 1000);  matchStart.setHours(17, 0, 0, 0);  const matchEnd = new Date(matchStart.getTime() + 90 * 60 * 1000);  db.prepare(`INSERT INTO open_matches (id, club_id, court_id, creator_id, title, start_time, end_time, duration, min_level, max_level, max_players, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)    .run(uuid(), clubId, db.prepare("SELECT id FROM courts WHERE club_id = ? LIMIT 1").get(clubId).id, guestId, "Partido nivel medio", Math.floor(matchStart.getTime() / 1000), Math.floor(matchEnd.getTime() / 1000), 90, 3, 5, 4, "open", "Busco 3 jugadores más para partido de nivel 3-5.", now);
console.log("✅ Seeded: El Remate Padel Club (" + clubId + ") with 11 courts + test user");
db.close();
