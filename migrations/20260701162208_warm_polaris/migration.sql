CREATE TABLE "kanban_automations" (
	"id" serial PRIMARY KEY,
	"board_id" integer NOT NULL,
	"clerk_id" text NOT NULL,
	"name" text,
	"trigger_type" text NOT NULL,
	"trigger_config" jsonb DEFAULT '{}' NOT NULL,
	"action_type" text NOT NULL,
	"action_config" jsonb DEFAULT '{}' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_task_pulse_votes" (
	"id" serial PRIMARY KEY,
	"pulse_id" integer NOT NULL,
	"voter_token_hash" text NOT NULL,
	"vote" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_task_pulses" (
	"id" serial PRIMARY KEY,
	"task_id" integer NOT NULL,
	"owner_clerk_id" text NOT NULL,
	"question" text NOT NULL,
	"share_token" text NOT NULL UNIQUE,
	"is_open" boolean DEFAULT true NOT NULL,
	"closes_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "kanban_automations_board_sort_idx" ON "kanban_automations" ("board_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "kanban_task_pulse_votes_pulse_voter_idx" ON "kanban_task_pulse_votes" ("pulse_id","voter_token_hash");--> statement-breakpoint
CREATE INDEX "kanban_task_pulses_task_idx" ON "kanban_task_pulses" ("task_id");--> statement-breakpoint
ALTER TABLE "kanban_automations" ADD CONSTRAINT "kanban_automations_board_id_kanban_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "kanban_boards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kanban_task_pulse_votes" ADD CONSTRAINT "kanban_task_pulse_votes_pulse_id_kanban_task_pulses_id_fkey" FOREIGN KEY ("pulse_id") REFERENCES "kanban_task_pulses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kanban_task_pulses" ADD CONSTRAINT "kanban_task_pulses_task_id_kanban_tasks_id_fkey" FOREIGN KEY ("task_id") REFERENCES "kanban_tasks"("id") ON DELETE CASCADE;