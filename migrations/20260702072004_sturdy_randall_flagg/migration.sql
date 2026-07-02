CREATE TABLE "pages" (
	"id" serial PRIMARY KEY,
	"space_id" integer NOT NULL,
	"clerk_id" text NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"template" text DEFAULT 'blank' NOT NULL,
	"content" jsonb DEFAULT '{"type":"doc","content":[]}' NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"last_edited_by_clerk_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "space_collaborators" (
	"id" serial PRIMARY KEY,
	"space_id" integer NOT NULL,
	"email" text NOT NULL,
	"clerk_id" text,
	"role" text DEFAULT 'editor' NOT NULL,
	"invited_by_clerk_id" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spaces" (
	"id" serial PRIMARY KEY,
	"clerk_id" text NOT NULL,
	"name" text DEFAULT 'Untitled Space' NOT NULL,
	"description" text,
	"color" text DEFAULT 'yellow' NOT NULL,
	"is_vault" boolean DEFAULT false NOT NULL,
	"vault_commitment" text,
	"vault_salt" text,
	"stellar_nullifier_root" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pages_space_deleted_idx" ON "pages" ("space_id","deleted_at");--> statement-breakpoint
CREATE INDEX "pages_clerk_updated_idx" ON "pages" ("clerk_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "space_collaborators_space_email_idx" ON "space_collaborators" ("space_id","email");--> statement-breakpoint
CREATE INDEX "space_collaborators_clerk_id_idx" ON "space_collaborators" ("clerk_id");--> statement-breakpoint
CREATE INDEX "spaces_clerk_deleted_idx" ON "spaces" ("clerk_id","deleted_at");--> statement-breakpoint
CREATE INDEX "spaces_clerk_updated_idx" ON "spaces" ("clerk_id","updated_at");--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_collaborators" ADD CONSTRAINT "space_collaborators_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;