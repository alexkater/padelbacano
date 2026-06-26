// ─── Drizzle schema — PostgreSQL ───────────────────────────────────────────
// Maps domain entities to database tables.
// Keep in sync with src/core/entities/

import { pgTable, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

// ─── Clubs ──────────────────────────────────────────────────────────────

export const clubs = pgTable("clubs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city"),
  department: text("department"),
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
}, (table) => [
  index("clubs_city_idx").on(table.city),
]);

// ─── Marketplace / config ─────────────────────────────────────────────────

export const clubConfigs = pgTable("club_configs", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .references(() => clubs.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  department: text("department").notNull(),
  nit: text("nit"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"),
  heroImageUrl: text("hero_image_url"),
  domain: text("domain"),
  theme: jsonb("theme").notNull().$type<{
    primaryColor: string;
    surfaceColor: string;
    fontFamily: string;
    logoUrl: string | null;
    borderRadius: "none" | "sm" | "md" | "lg";
  }>(),
  pricing: jsonb("pricing").notNull().$type<{
    currency: "COP";
    peakPriceInCents: number;
    offPeakPriceInCents: number;
    memberDiscountPercent: number;
  }>(),
  modules: jsonb("modules").notNull().$type<{
    social: boolean;
    payments: boolean;
    tournaments: boolean;
    analytics: boolean;
    invoicing: boolean;
    school: boolean;
    loyalty: boolean;
  }>(),
  status: text("status", { enum: ["pending_approval", "active", "suspended"] })
    .notNull()
    .default("pending_approval"),
  verified: boolean("verified").notNull().default(false),
  cancellationPolicy: jsonb("cancellation_policy").notNull().$type<{
    minHoursBefore: number;
    penaltyPercent: number;
    allowRefund: boolean;
    summary: string;
  }>(),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("club_configs_club_id_idx").on(table.clubId),
  uniqueIndex("club_configs_domain_idx").on(table.domain),
  index("club_configs_city_status_idx").on(table.city, table.status),
]);

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
  sport: text("sport", { enum: ["padel", "tenis"] })
    .notNull()
    .default("padel"),
  surface: text("surface"),
  indoor: boolean("indoor").notNull().default(true),
  lighting: boolean("lighting").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
}, (table) => [
  index("courts_club_active_idx").on(table.clubId, table.isActive),
]);

export const courtPricing = pgTable("court_pricing", {
  id: text("id").primaryKey(),
  courtId: text("court_id")
    .notNull()
    .references(() => courts.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  isPeak: boolean("is_peak").notNull().default(false),
}, (table) => [
  index("court_pricing_court_weekday_time_idx").on(table.courtId, table.weekday, table.startTime, table.endTime),
]);

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
  clubId: text("club_id")
    .references(() => clubs.id, { onDelete: "cascade" }),
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
}, (table) => [
  index("bookings_court_start_idx").on(table.courtId, table.startTime),
  index("bookings_club_created_idx").on(table.clubId, table.createdAt),
]);

// ─── Booking / blocks / pricing ───────────────────────────────────────────

export const maintenanceBlocks = pgTable("maintenance_blocks", {
  id: text("id").primaryKey(),
  courtId: text("court_id")
    .notNull()
    .references(() => courts.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  reason: text("reason").notNull(),
  createdBy: text("created_by")
    .references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  index("maintenance_blocks_court_time_idx").on(table.courtId, table.startTime, table.endTime),
]);

export const bookingCancellations = pgTable("booking_cancellations", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  cancelledBy: text("cancelled_by")
    .references(() => users.id, { onDelete: "set null" }),
  reason: text("reason"),
  refundAmount: integer("refund_amount").notNull().default(0),
  cancelledAt: timestamp("cancelled_at")
    .notNull()
    .defaultNow(),
});

// ─── Onboarding / approval ────────────────────────────────────────────────

export const onboardingApplications = pgTable("onboarding_applications", {
  id: text("id").primaryKey(),
  clubName: text("club_name").notNull(),
  slug: text("slug").notNull(),
  city: text("city").notNull(),
  department: text("department").notNull(),
  nit: text("nit"),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),
  status: text("status", { enum: ["pending_approval", "approved", "rejected"] })
    .notNull()
    .default("pending_approval"),
  reviewedBy: text("reviewed_by")
    .references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("onboarding_applications_slug_idx").on(table.slug),
  index("onboarding_applications_status_created_idx").on(table.status, table.createdAt),
]);

// ─── Notifications / push / preferences ───────────────────────────────────

export const notificationLogs = pgTable("notification_log", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type", {
    enum: ["booking_created", "booking_cancelled", "tournament_registered", "club_approved", "club_rejected", "payment_received"],
  }).notNull(),
  channel: text("channel", { enum: ["email", "whatsapp", "push"] }).notNull(),
  status: text("status", { enum: ["pending", "sent", "failed"] })
    .notNull()
    .default("pending"),
  retryCount: integer("retry_count").notNull().default(0),
  error: text("error"),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
}, (table) => [
  index("notification_log_user_created_idx").on(table.userId, table.createdAt),
  index("notification_log_event_status_idx").on(table.eventType, table.status),
]);

export const notificationPreferences = pgTable("user_notification_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  whatsAppEnabled: boolean("whatsapp_enabled").notNull().default(true),
  pushEnabled: boolean("push_enabled").notNull().default(true),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("push_subscriptions_endpoint_idx").on(table.endpoint),
  index("push_subscriptions_user_idx").on(table.userId),
]);

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id")
    .references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
}, (table) => [
  index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  index("audit_logs_actor_created_idx").on(table.actorId, table.createdAt),
]);


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
  currency: text("currency").notNull().default("COP"),
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
  level: text("level", { enum: ["open", "A", "B", "C"] })
    .notNull()
    .default("open"),
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

export const tournamentPlayers = pgTable("tournament_players", {
  id: text("id").primaryKey(),
  tournamentId: text("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  seed: integer("seed"),
  registeredAt: timestamp("registered_at")
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("tournament_players_tournament_user_idx").on(table.tournamentId, table.userId),
]);

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
  scheduledTime: timestamp("scheduled_time"),
  status: text("status", {
    enum: ["scheduled", "in_progress", "completed", "cancelled"],
  }).notNull().default("scheduled"),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

export const tournamentStandings = pgTable("tournament_standings", {
  id: text("id").primaryKey(),
  tournamentId: text("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  matchesPlayed: integer("matches_played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  points: integer("points").notNull().default(0),
}, (table) => [
  uniqueIndex("tournament_standings_tournament_user_idx").on(table.tournamentId, table.userId),
]);

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
  bookingId: text("booking_id")
    .references(() => bookings.id, { onDelete: "set null" }),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nit: text("nit"),
  invoiceNumber: text("invoice_number").notNull(),
  prefix: text("prefix").notNull().default("FE"),
  consecutive: integer("consecutive").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date"),
  subtotal: integer("subtotal").notNull(),
  subtotalInCents: integer("subtotal_in_cents"),
  taxRate: integer("tax_rate").notNull().default(1900),
  ivaPercent: integer("iva_percent"),
  taxAmount: integer("tax_amount").notNull(),
  ivaInCents: integer("iva_in_cents"),
  total: integer("total").notNull(),
  totalInCents: integer("total_in_cents"),
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
  cufe: text("cufe"),
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
  unitPriceInCents: integer("unit_price_in_cents"),
  subtotal: integer("subtotal").notNull(),
  totalPriceInCents: integer("total_price_in_cents"),
  bookingId: text("booking_id")
    .references(() => bookings.id, { onDelete: "set null" }),
});
