CREATE TABLE "note_collaborators" (
	"id" serial PRIMARY KEY,
	"note_id" integer NOT NULL,
	"email" text NOT NULL,
	"clerk_id" text,
	"role" text DEFAULT 'editor' NOT NULL,
	"invited_by_clerk_id" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY,
	"clerk_id" text NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"color" text DEFAULT 'yellow' NOT NULL,
	"content" jsonb DEFAULT '{"type":"doc","content":[]}' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "note_collaborators_note_email_idx" ON "note_collaborators" ("note_id","email");--> statement-breakpoint
CREATE INDEX "note_collaborators_clerk_id_idx" ON "note_collaborators" ("clerk_id");--> statement-breakpoint
CREATE INDEX "notes_clerk_deleted_idx" ON "notes" ("clerk_id","deleted_at");--> statement-breakpoint
CREATE INDEX "notes_clerk_updated_idx" ON "notes" ("clerk_id","updated_at");--> statement-breakpoint
ALTER TABLE "note_collaborators" ADD CONSTRAINT "note_collaborators_note_id_notes_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE;