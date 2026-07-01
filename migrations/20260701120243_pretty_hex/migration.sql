CREATE TABLE "calendar_items" (
	"id" serial PRIMARY KEY,
	"clerk_id" text NOT NULL,
	"title" text NOT NULL,
	"item_type" text NOT NULL,
	"category" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"duration_min" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "calendar_items_clerk_scheduled_idx" ON "calendar_items" ("clerk_id","scheduled_at");