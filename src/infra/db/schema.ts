// ─── Drizzle schema — PostgreSQL ───────────────────────────────────────────
// Maps domain entities to database tables.
// Keep in sync with src/core/entities/

import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// ─── Clubs ──────────────────────────────────────────────────────────────

export const clubs = pgTable("clubs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  pricing: jsonb("pricing").notNull().$type<{
    memberPrice: number;
    nonMemberPrice: number;
    currency: string;
  }>(),
  theme: jsonb("theme").notNull().$type<{
    primaryColor: string;
    surfaceColor: string;
    fontFamily: string;
    logoUrl: string | null;
    borderRadius: "none" | "sm" | "md" | "lg";
  }>(),
  cancellationPolicy: jsonb("cancellation_policy").notNull().$type<{
    minHoursBefore: number;
    penaltyPercent: number;
    allowRefund: boolean;
  }>(),
  contact: jsonb("contact").notNull().$type<{
    phone: string;
    email: string;
    whatsapp: string | null;
    address: string;
    googleMapsUrl: string | null;
  }>(),
  content: jsonb("content").notNull().$type<{
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
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});

// ─── Courts ─────────────────────────────────────────────────────────────

export const courts = pgTable("courts", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  courtType: text("court_type", { enum: ["glass", "panoramic", "wall"] })
    .notNull()
    .default("glass"),
  indoor: boolean("indoor").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

// ─── Users ──────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  image: text("image"),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

// ─── User profiles (per-club membership) ────────────────────────────────

export const userProfiles = pgTable("user_profiles", {
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
  joinedAt: timestamp("joined_at")
    .notNull()
    .defaultNow(),
});

// ─── Bookings ───────────────────────────────────────────────────────────

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  courtId: text("court_id")
    .notNull()
    .references(() => courts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: integer("duration").notNull(), // 60 or 90
  status: text("status", {
    enum: ["confirmed", "cancelled", "completed", "no_show"],
  })
    .notNull()
    .default("confirmed"),
  notes: text("notes"),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});


// ─── Announcements ─────────────────────────────────────────────────────────

export const announcements = pgTable("announcements", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["general", "torneo", "escuela"] })
    .notNull()
    .default("general"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});

// ─── Partner posts (tablón "Busco Compañero") ──────────────────────────

export const partnerPosts = pgTable("partner_posts", {
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
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),

});
export const membershipPlans = pgTable("membership_plans", {
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
  benefits: jsonb("benefits").notNull().$type<{
    discountPercent: number;
    priorityBookingHours: number;
    maxBookingsPerDay: number;
    maxActiveBookings: number;
    guestPasses: number;
  }>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

export const userMemberships = pgTable("user_memberships", {
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
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

// ─── Dynamic pricing ─────────────────────────────────────────────────────

export const pricingRules = pgTable("pricing_rules", {
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
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

// ─── Player levels (ELO-like) ────────────────────────────────────────────

export const playerLevels = pgTable("player_levels", {
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
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});

// ─── Open matches ────────────────────────────────────────────────────────

export const openMatches = pgTable("open_matches", {
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
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
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
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

export const openMatchPlayers = pgTable("open_match_players", {
  id: text("id").primaryKey(),
  matchId: text("match_id")
    .notNull()
    .references(() => openMatches.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at")
    .notNull()
    .defaultNow(),
});

// ─── School / Academy ────────────────────────────────────────────────────

export const coaches = pgTable("coaches", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  specialties: jsonb("specialties").notNull().$type<string[]>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

export const classes = pgTable("classes", {
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
  schedule: jsonb("schedule").notNull().$type<{
    daysOfWeek: number[];
    startHour: number;
    endHour: number;
  }>(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

export const classEnrollments = pgTable("class_enrollments", {
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
  enrolledAt: timestamp("enrolled_at")
    .notNull()
    .defaultNow(),
});

// ─── Chat ────────────────────────────────────────────────────────────────

export const chatMessages = pgTable("chat_messages", {
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
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),

});

// ─── Payment methods ──────────────────────────────────────────────────────

export const paymentMethods = pgTable("payment_methods", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  provider: text("provider", {
    enum: ["pse", "nequi", "daviplata", "credit_card", "cash"],
  }).notNull(),
  name: text("name").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  config: jsonb("config").$type<Record<string, string>>(),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

export const transactions = pgTable("transactions", {
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
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});

// ─── Tournaments ─────────────────────────────────────────────────────────

export const tournaments = pgTable("tournaments", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  format: text("format", {
    enum: ["single_elimination", "round_robin", "americano", "mexicano"],
  }).notNull().default("single_elimination"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  registrationDeadline: timestamp("registration_deadline"),
  minLevel: integer("min_level"),
  maxLevel: integer("max_level"),
  maxParticipants: integer("max_participants"),
  entryFee: integer("entry_fee"),
  prize: text("prize"),
  status: text("status", {
    enum: ["draft", "registration", "in_progress", "completed", "cancelled"],
  }).notNull().default("draft"),
  rules: text("rules"),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});

export const tournamentRegistrations = pgTable("tournament_registrations", {
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
  registeredAt: timestamp("registered_at")
    .notNull()
    .defaultNow(),
});

export const tournamentMatches = pgTable("tournament_matches", {
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
  startTime: timestamp("start_time"),
  status: text("status", {
    enum: ["scheduled", "in_progress", "completed", "cancelled"],
  }).notNull().default("scheduled"),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

// ─── Analytics cache ───────────────────────────────────────────────────────

export const dailySummaries = pgTable("daily_summaries", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  totalBookings: integer("total_bookings").notNull().default(0),
  cancelledBookings: integer("cancelled_bookings").notNull().default(0),
  occupancyPct: integer("occupancy_pct").notNull().default(0),
  revenue: integer("revenue").notNull().default(0),
  uniquePlayers: integer("unique_players").notNull().default(0),
  avgDuration: integer("avg_duration").notNull().default(0),
  peakHour: integer("peak_hour"),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

// ─── Invoices (Facturación Electrónica DIAN Colombia) ──────────────────────

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull(),
  prefix: text("prefix").notNull().default("FE"),
  consecutive: integer("consecutive").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date"),
  subtotal: integer("subtotal").notNull(),
  taxRate: integer("tax_rate").notNull().default(1900),
  taxAmount: integer("tax_amount").notNull(),
  total: integer("total").notNull(),
  currency: text("currency").notNull().default("COP"),
  status: text("status", {
    enum: ["draft", "issued", "paid", "cancelled", "dian_rejected"],
  }).notNull().default("draft"),
  customerName: text("customer_name").notNull(),
  customerDocument: text("customer_document"),
  customerDocumentType: text("customer_document_type", {
    enum: ["CC", "NIT", "CE", "PP"],
  }),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  dianCufe: text("dian_cufe"),
  dianXml: text("dian_xml"),
  dianStatus: text("dian_status", {
    enum: ["pending", "accepted", "rejected"],
  }),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  subtotal: integer("subtotal").notNull(),
  bookingId: text("booking_id")
    .references(() => bookings.id, { onDelete: "set null" }),
});
