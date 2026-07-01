CREATE TABLE "kanban_board_collaborators" (
	"id" serial PRIMARY KEY,
	"board_id" integer NOT NULL,
	"email" text NOT NULL,
	"clerk_id" text,
	"role" text DEFAULT 'editor' NOT NULL,
	"invited_by_clerk_id" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "kanban_board_collaborators_board_email_idx" ON "kanban_board_collaborators" ("board_id","email");--> statement-breakpoint
CREATE INDEX "kanban_board_collaborators_clerk_id_idx" ON "kanban_board_collaborators" ("clerk_id");--> statement-breakpoint
ALTER TABLE "kanban_board_collaborators" ADD CONSTRAINT "kanban_board_collaborators_board_id_kanban_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "kanban_boards"("id") ON DELETE CASCADE;