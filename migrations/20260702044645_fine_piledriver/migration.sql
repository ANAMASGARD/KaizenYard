CREATE TABLE "whiteboard_collaborators" (
	"id" serial PRIMARY KEY,
	"whiteboard_id" integer NOT NULL,
	"email" text NOT NULL,
	"clerk_id" text,
	"role" text DEFAULT 'editor' NOT NULL,
	"invited_by_clerk_id" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whiteboards" (
	"id" serial PRIMARY KEY,
	"clerk_id" text NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"color" text DEFAULT 'yellow' NOT NULL,
	"content" jsonb DEFAULT '{"elements":[],"appState":{},"files":{}}' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "whiteboard_collaborators_board_email_idx" ON "whiteboard_collaborators" ("whiteboard_id","email");--> statement-breakpoint
CREATE INDEX "whiteboard_collaborators_clerk_id_idx" ON "whiteboard_collaborators" ("clerk_id");--> statement-breakpoint
CREATE INDEX "whiteboards_clerk_deleted_idx" ON "whiteboards" ("clerk_id","deleted_at");--> statement-breakpoint
CREATE INDEX "whiteboards_clerk_updated_idx" ON "whiteboards" ("clerk_id","updated_at");--> statement-breakpoint
ALTER TABLE "whiteboard_collaborators" ADD CONSTRAINT "whiteboard_collaborators_whiteboard_id_whiteboards_id_fkey" FOREIGN KEY ("whiteboard_id") REFERENCES "whiteboards"("id") ON DELETE CASCADE;