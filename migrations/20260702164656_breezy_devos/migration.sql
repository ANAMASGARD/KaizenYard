ALTER TABLE "assistant_sessions" ADD COLUMN "llm_view_snapshot" text;--> statement-breakpoint
ALTER TABLE "assistant_sessions" ADD COLUMN "llm_view_updated_at" timestamp with time zone;