CREATE TABLE "booking_cancellations" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"cancelled_by" text,
	"reason" text,
	"refund_amount" integer DEFAULT 0 NOT NULL,
	"cancelled_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"department" text NOT NULL,
	"nit" text,
	"phone" text,
	"email" text,
	"logo_url" text,
	"hero_image_url" text,
	"domain" text,
	"theme" jsonb NOT NULL,
	"pricing" jsonb NOT NULL,
	"modules" jsonb NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"cancellation_policy" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "club_configs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "court_pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"court_id" text NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"price_in_cents" integer NOT NULL,
	"is_peak" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"court_id" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"reason" text NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"whatsapp_enabled" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"club_name" text NOT NULL,
	"slug" text NOT NULL,
	"city" text NOT NULL,
	"department" text NOT NULL,
	"nit" text,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"contact_email" text NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_players" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"user_id" text NOT NULL,
	"seed" integer,
	"registered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_standings" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"user_id" text NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "club_id" text;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "courts" ADD COLUMN "sport" text DEFAULT 'padel' NOT NULL;--> statement-breakpoint
ALTER TABLE "courts" ADD COLUMN "surface" text;--> statement-breakpoint
ALTER TABLE "courts" ADD COLUMN "lighting" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "unit_price_in_cents" integer;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "total_price_in_cents" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "booking_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "nit" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "subtotal_in_cents" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "iva_percent" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "iva_in_cents" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "total_in_cents" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cufe" text;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD COLUMN "scheduled_time" timestamp;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "level" text DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_cancellations" ADD CONSTRAINT "booking_cancellations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_cancellations" ADD CONSTRAINT "booking_cancellations_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_configs" ADD CONSTRAINT "club_configs_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_pricing" ADD CONSTRAINT "court_pricing_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_blocks" ADD CONSTRAINT "maintenance_blocks_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_blocks" ADD CONSTRAINT "maintenance_blocks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_applications" ADD CONSTRAINT "onboarding_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "club_configs_club_id_idx" ON "club_configs" USING btree ("club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "club_configs_domain_idx" ON "club_configs" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "club_configs_city_status_idx" ON "club_configs" USING btree ("city","status");--> statement-breakpoint
CREATE INDEX "court_pricing_court_weekday_time_idx" ON "court_pricing" USING btree ("court_id","weekday","start_time","end_time");--> statement-breakpoint
CREATE INDEX "maintenance_blocks_court_time_idx" ON "maintenance_blocks" USING btree ("court_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "notification_log_user_created_idx" ON "notification_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_log_event_status_idx" ON "notification_log" USING btree ("event_type","status");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_applications_slug_idx" ON "onboarding_applications" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "onboarding_applications_status_created_idx" ON "onboarding_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_players_tournament_user_idx" ON "tournament_players" USING btree ("tournament_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_standings_tournament_user_idx" ON "tournament_standings" USING btree ("tournament_id","user_id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_court_start_idx" ON "bookings" USING btree ("court_id","start_time");--> statement-breakpoint
CREATE INDEX "bookings_club_created_idx" ON "bookings" USING btree ("club_id","created_at");--> statement-breakpoint
CREATE INDEX "clubs_city_idx" ON "clubs" USING btree ("city");--> statement-breakpoint
CREATE INDEX "courts_club_active_idx" ON "courts" USING btree ("club_id","is_active");