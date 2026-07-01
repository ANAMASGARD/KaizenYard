CREATE TABLE "calendar_item_exceptions" (
	"id" serial PRIMARY KEY,
	"item_id" integer NOT NULL,
	"original_start_at" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"override_scheduled_at" timestamp with time zone,
	"override_duration_min" integer,
	"override_title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_meeting_pulses" (
	"id" serial PRIMARY KEY,
	"owner_clerk_id" text NOT NULL,
	"calendar_item_id" integer,
	"question" text NOT NULL,
	"share_token" text NOT NULL UNIQUE,
	"is_open" boolean DEFAULT true NOT NULL,
	"closes_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_pulse_votes" (
	"id" serial PRIMARY KEY,
	"pulse_id" integer NOT NULL,
	"voter_token_hash" text NOT NULL,
	"vote" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_settings" (
	"id" serial PRIMARY KEY,
	"clerk_id" text NOT NULL UNIQUE,
	"weekly_focus_goal_hours" integer DEFAULT 10 NOT NULL,
	"no_meeting_weekdays" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"work_day_start_min" integer DEFAULT 540 NOT NULL,
	"work_day_end_min" integer DEFAULT 1080 NOT NULL,
	"avg_hourly_rate_cents" integer DEFAULT 7500 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_items" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "calendar_items" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "calendar_items" ADD COLUMN "recurrence_rule" text;--> statement-breakpoint
ALTER TABLE "calendar_items" ADD COLUMN "buffer_before_min" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_items" ADD COLUMN "buffer_after_min" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_items" ADD COLUMN "is_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_items" ADD COLUMN "attendee_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_item_exceptions_item_original_idx" ON "calendar_item_exceptions" ("item_id","original_start_at");--> statement-breakpoint
CREATE INDEX "calendar_meeting_pulses_item_idx" ON "calendar_meeting_pulses" ("calendar_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_pulse_votes_pulse_voter_idx" ON "calendar_pulse_votes" ("pulse_id","voter_token_hash");--> statement-breakpoint
ALTER TABLE "calendar_item_exceptions" ADD CONSTRAINT "calendar_item_exceptions_item_id_calendar_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "calendar_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "calendar_meeting_pulses" ADD CONSTRAINT "calendar_meeting_pulses_calendar_item_id_calendar_items_id_fkey" FOREIGN KEY ("calendar_item_id") REFERENCES "calendar_items"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "calendar_pulse_votes" ADD CONSTRAINT "calendar_pulse_votes_pulse_id_calendar_meeting_pulses_id_fkey" FOREIGN KEY ("pulse_id") REFERENCES "calendar_meeting_pulses"("id") ON DELETE CASCADE;