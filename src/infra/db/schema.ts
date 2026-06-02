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
