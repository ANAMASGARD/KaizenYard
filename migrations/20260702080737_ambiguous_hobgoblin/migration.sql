CREATE TABLE "generated_apps" (
	"id" serial PRIMARY KEY,
	"clerk_id" text NOT NULL,
	"app_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT 'LayoutTemplate' NOT NULL,
	"color" text DEFAULT '#F97316' NOT NULL,
	"layout" text DEFAULT 'single-page' NOT NULL,
	"definition" jsonb NOT NULL,
	"runtime_state" jsonb DEFAULT '{}' NOT NULL,
	"sidebar_pinned" boolean DEFAULT false NOT NULL,
	"sidebar_order" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "generated_apps_clerk_idx" ON "generated_apps" ("clerk_id");--> statement-breakpoint
CREATE INDEX "generated_apps_clerk_pinned_idx" ON "generated_apps" ("clerk_id","sidebar_pinned");