CREATE TABLE "assistant_messages" (
	"id" serial PRIMARY KEY,
	"session_id" integer NOT NULL,
	"role" text NOT NULL,
	"parts" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_privacy_maps" (
	"id" serial PRIMARY KEY,
	"agent_session_id" text NOT NULL,
	"clerk_id" text NOT NULL,
	"encrypted_map" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_sessions" (
	"id" serial PRIMARY KEY,
	"clerk_id" text NOT NULL,
	"title" text DEFAULT 'New chat' NOT NULL,
	"privacy_mode" text DEFAULT 'standard' NOT NULL,
	"agent_session_id" text NOT NULL UNIQUE,
	"delegate_address" text,
	"witness_group_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "kanban_board_pulses" (
	"id" serial PRIMARY KEY,
	"board_id" integer NOT NULL,
	"owner_clerk_id" text NOT NULL,
	"question" text NOT NULL,
	"pulse_type" text DEFAULT 'retro' NOT NULL,
	"share_token" text NOT NULL UNIQUE,
	"witness_group_id" integer,
	"is_open" boolean DEFAULT true NOT NULL,
	"closes_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "witness_attestations" (
	"id" serial PRIMARY KEY,
	"witness_group_id" integer NOT NULL,
	"clerk_id" text NOT NULL,
	"nullifier" text NOT NULL,
	"action_hash" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" integer,
	"tx_hash" text,
	"privacy_mode" text DEFAULT 'witness' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "witness_groups" (
	"id" serial PRIMARY KEY,
	"owner_clerk_id" text NOT NULL,
	"name" text NOT NULL,
	"commitment" text,
	"merkle_root" text,
	"board_id" integer,
	"calendar_pulse_id" integer,
	"board_pulse_id" integer,
	"is_open" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_meeting_pulses" ADD COLUMN "pulse_type" text DEFAULT 'meeting' NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_meeting_pulses" ADD COLUMN "witness_group_id" integer;--> statement-breakpoint
ALTER TABLE "kanban_tasks" ADD COLUMN "witness_attestation_hash" text;--> statement-breakpoint
ALTER TABLE "kanban_tasks" ADD COLUMN "delegate_address" text;--> statement-breakpoint
CREATE INDEX "assistant_messages_session_idx" ON "assistant_messages" ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "assistant_privacy_maps_agent_session_idx" ON "assistant_privacy_maps" ("agent_session_id");--> statement-breakpoint
CREATE INDEX "assistant_privacy_maps_expires_idx" ON "assistant_privacy_maps" ("expires_at");--> statement-breakpoint
CREATE INDEX "assistant_sessions_clerk_updated_idx" ON "assistant_sessions" ("clerk_id","last_message_at");--> statement-breakpoint
CREATE INDEX "assistant_sessions_agent_session_idx" ON "assistant_sessions" ("agent_session_id");--> statement-breakpoint
CREATE INDEX "kanban_board_pulses_board_idx" ON "kanban_board_pulses" ("board_id");--> statement-breakpoint
CREATE UNIQUE INDEX "witness_attestations_nullifier_idx" ON "witness_attestations" ("nullifier");--> statement-breakpoint
CREATE INDEX "witness_attestations_group_idx" ON "witness_attestations" ("witness_group_id");--> statement-breakpoint
CREATE INDEX "witness_groups_owner_idx" ON "witness_groups" ("owner_clerk_id");--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_session_id_assistant_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "assistant_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kanban_board_pulses" ADD CONSTRAINT "kanban_board_pulses_board_id_kanban_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "kanban_boards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kanban_board_pulses" ADD CONSTRAINT "kanban_board_pulses_witness_group_id_witness_groups_id_fkey" FOREIGN KEY ("witness_group_id") REFERENCES "witness_groups"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "witness_attestations" ADD CONSTRAINT "witness_attestations_witness_group_id_witness_groups_id_fkey" FOREIGN KEY ("witness_group_id") REFERENCES "witness_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "witness_groups" ADD CONSTRAINT "witness_groups_board_id_kanban_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "kanban_boards"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "witness_groups" ADD CONSTRAINT "witness_groups_nzyboCD7ugn9_fkey" FOREIGN KEY ("calendar_pulse_id") REFERENCES "calendar_meeting_pulses"("id") ON DELETE SET NULL;