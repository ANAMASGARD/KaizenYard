CREATE TABLE "kanban_boards" (
	"id" serial PRIMARY KEY,
	"clerk_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_columns" (
	"id" serial PRIMARY KEY,
	"board_id" integer NOT NULL,
	"clerk_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_tasks" (
	"id" serial PRIMARY KEY,
	"column_id" integer NOT NULL,
	"clerk_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp with time zone,
	"priority" text DEFAULT 'medium' NOT NULL,
	"labels" text[] DEFAULT '{}'::text[] NOT NULL,
	"sync_calendar" boolean DEFAULT false NOT NULL,
	"link_notes" boolean DEFAULT false NOT NULL,
	"calendar_item_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "kanban_boards_clerk_sort_idx" ON "kanban_boards" ("clerk_id","sort_order");--> statement-breakpoint
CREATE INDEX "kanban_columns_board_sort_idx" ON "kanban_columns" ("board_id","sort_order");--> statement-breakpoint
CREATE INDEX "kanban_tasks_column_sort_idx" ON "kanban_tasks" ("column_id","sort_order");--> statement-breakpoint
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_board_id_kanban_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "kanban_boards"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_column_id_kanban_columns_id_fkey" FOREIGN KEY ("column_id") REFERENCES "kanban_columns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_calendar_item_id_calendar_items_id_fkey" FOREIGN KEY ("calendar_item_id") REFERENCES "calendar_items"("id") ON DELETE SET NULL;