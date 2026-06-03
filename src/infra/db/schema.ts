// ─── Drizzle schema — SQLite ───────────────────────────────────────────────
// Maps domain entities to database tables.
// Keep in sync with src/core/entities/

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Clubs ──────────────────────────────────────────────────────────────

export const clubs = sqliteTable("clubs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  pricing: text("pricing", { mode: "json" }).notNull().$type<{
    memberPrice: number;
    nonMemberPrice: number;
    currency: string;
  }>(),
  theme: text("theme", { mode: "json" }).notNull().$type<{
    primaryColor: string;
    surfaceColor: string;
    fontFamily: string;
    logoUrl: string | null;
    borderRadius: "none" | "sm" | "md" | "lg";
  }>(),
  cancellationPolicy: text("cancellation_policy", { mode: "json" }).notNull().$type<{
    minHoursBefore: number;
    penaltyPercent: number;
    allowRefund: boolean;
  }>(),
  contact: text("contact", { mode: "json" }).notNull().$type<{
    phone: string;
    email: string;
    whatsapp: string | null;
    address: string;
    googleMapsUrl: string | null;
  }>(),
  content: text("content", { mode: "json" }).notNull().$type<{
    hero: {
      title: string;
      subtitle: string;
      description: string;
      heroImageUrl: string | null;
      photos: string[];
    };
    about: string;
    prices: string;
    openingHours: string;
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Courts ─────────────────────────────────────────────────────────────

export const courts = sqliteTable("courts", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  courtType: text("court_type", { enum: ["glass", "panoramic", "wall"] })
    .notNull()
    .default("glass"),
  indoor: integer("indoor", { mode: "boolean" }).notNull().default(true),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Users ──────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── User profiles (per-club membership) ────────────────────────────────

export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "member", "guest"] })
    .notNull()
    .default("guest"),
  memberType: text("member_type", { enum: ["member", "non_member"] })
    .notNull()
    .default("non_member"),
  displayName: text("display_name").notNull(),
  phone: text("phone"),
  level: integer("level"), // 1-7
  joinedAt: integer("joined_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Bookings ───────────────────────────────────────────────────────────

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  courtId: text("court_id")
    .notNull()
    .references(() => courts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  duration: integer("duration").notNull(), // 60 or 90
  status: text("status", {
    enum: ["confirmed", "cancelled", "completed", "no_show"],
  })
    .notNull()
    .default("confirmed"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});


// ─── Announcements ─────────────────────────────────────────────────────────

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["general", "torneo", "escuela"] })
    .notNull()
    .default("general"),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Partner posts (tablón "Busco Compañero") ──────────────────────────

export const partnerPosts = sqliteTable("partner_posts", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  level: integer("level").notNull(),
  schedule: text("schedule").notNull(),
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),

});
export const membershipPlans = sqliteTable("membership_plans", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("EUR"),
  interval: text("interval", { enum: ["monthly", "quarterly", "yearly"] })
    .notNull()
    .default("monthly"),
  benefits: text("benefits", { mode: "json" }).notNull().$type<{
    discountPercent: number;
    priorityBookingHours: number;
    maxBookingsPerDay: number;
    maxActiveBookings: number;
    guestPasses: number;
  }>(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const userMemberships = sqliteTable("user_memberships", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => membershipPlans.id, { onDelete: "cascade" }),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["active", "cancelled", "expired"] })
    .notNull()
    .default("active"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Dynamic pricing ─────────────────────────────────────────────────────

export const pricingRules = sqliteTable("pricing_rules", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dayOfWeek: integer("day_of_week"),
  startHour: integer("start_hour"),
  endHour: integer("end_hour"),
  memberPrice: integer("member_price").notNull(),
  nonMemberPrice: integer("non_member_price").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Player levels (ELO-like) ────────────────────────────────────────────

export const playerLevels = sqliteTable("player_levels", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull().default(1000),
  level: integer("level").notNull().default(1),
  matchesPlayed: integer("matches_played").notNull().default(0),
  matchesWon: integer("matches_won").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Open matches ────────────────────────────────────────────────────────

export const openMatches = sqliteTable("open_matches", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  courtId: text("court_id")
    .notNull()
    .references(() => courts.id, { onDelete: "cascade" }),
  creatorId: text("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  duration: integer("duration").notNull(),
  minLevel: integer("min_level"),
  maxLevel: integer("max_level"),
  maxPlayers: integer("max_players").notNull().default(4),
  status: text("status", {
    enum: ["open", "full", "cancelled", "completed"],
  })
    .notNull()
    .default("open"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const openMatchPlayers = sqliteTable("open_match_players", {
  id: text("id").primaryKey(),
  matchId: text("match_id")
    .notNull()
    .references(() => openMatches.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  joinedAt: integer("joined_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── School / Academy ────────────────────────────────────────────────────

export const coaches = sqliteTable("coaches", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  specialties: text("specialties", { mode: "json" }).notNull().$type<string[]>(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  coachId: text("coach_id")
    .notNull()
    .references(() => coaches.id, { onDelete: "cascade" }),
  courtId: text("court_id")
    .references(() => courts.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["group", "private", "clinic", "kids"] })
    .notNull()
    .default("group"),
  level: integer("level"),
  maxStudents: integer("max_students").notNull().default(4),
  price: integer("price").notNull(),
  schedule: text("schedule", { mode: "json" }).notNull().$type<{
    daysOfWeek: number[];
    startHour: number;
    endHour: number;
  }>(),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const classEnrollments = sqliteTable("class_enrollments", {
  id: text("id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["active", "cancelled", "completed"] })
    .notNull()
    .default("active"),
  enrolledAt: integer("enrolled_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Chat ────────────────────────────────────────────────────────────────

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: text("receiver_id")
    .references(() => users.id, { onDelete: "cascade" }),
  matchId: text("match_id")
    .references(() => openMatches.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),

});

// ─── Payment methods ──────────────────────────────────────────────────────

export const paymentMethods = sqliteTable("payment_methods", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  provider: text("provider", {
    enum: ["pse", "nequi", "daviplata", "credit_card", "cash"],
  }).notNull(),
  name: text("name").notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  config: text("config", { mode: "json" }).$type<Record<string, string>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  bookingId: text("booking_id")
    .references(() => bookings.id, { onDelete: "set null" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("COP"),
  method: text("method", {
    enum: ["pse", "nequi", "daviplata", "credit_card", "cash"],
  }).notNull(),
  status: text("status", {
    enum: ["pending", "completed", "failed", "refunded"],
  }).notNull().default("pending"),
  gatewayRef: text("gateway_ref"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Tournaments ─────────────────────────────────────────────────────────

export const tournaments = sqliteTable("tournaments", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  format: text("format", {
    enum: ["single_elimination", "round_robin", "americano", "mexicano"],
  }).notNull().default("single_elimination"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  registrationDeadline: integer("registration_deadline", { mode: "timestamp" }),
  minLevel: integer("min_level"),
  maxLevel: integer("max_level"),
  maxParticipants: integer("max_participants"),
  entryFee: integer("entry_fee"),
  prize: text("prize"),
  status: text("status", {
    enum: ["draft", "registration", "in_progress", "completed", "cancelled"],
  }).notNull().default("draft"),
  rules: text("rules"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const tournamentRegistrations = sqliteTable("tournament_registrations", {
  id: text("id").primaryKey(),
  tournamentId: text("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "confirmed", "cancelled"] })
    .notNull().default("pending"),
  paymentStatus: text("payment_status", { enum: ["unpaid", "paid"] })
    .notNull().default("unpaid"),
  registeredAt: integer("registered_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const tournamentMatches = sqliteTable("tournament_matches", {
  id: text("id").primaryKey(),
  tournamentId: text("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  courtId: text("court_id")
    .references(() => courts.id, { onDelete: "set null" }),
  round: integer("round").notNull(),
  player1Id: text("player1_id")
    .references(() => users.id, { onDelete: "set null" }),
  player2Id: text("player2_id")
    .references(() => users.id, { onDelete: "set null" }),
  score1: integer("score1"),
  score2: integer("score2"),
  winnerId: text("winner_id")
    .references(() => users.id, { onDelete: "set null" }),
  startTime: integer("start_time", { mode: "timestamp" }),
  status: text("status", {
    enum: ["scheduled", "in_progress", "completed", "cancelled"],
  }).notNull().default("scheduled"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
