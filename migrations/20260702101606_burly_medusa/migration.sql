CREATE TABLE "user_categories" (
	"id" serial PRIMARY KEY,
	"clerk_id" text NOT NULL,
	"module" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'blue' NOT NULL,
	"icon" text DEFAULT 'tag' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY,
	"clerk_id" text NOT NULL UNIQUE,
	"default_calendar_view" text DEFAULT 'week' NOT NULL,
	"default_task_priority" text DEFAULT 'medium' NOT NULL,
	"date_format" text DEFAULT 'MMM d, yyyy' NOT NULL,
	"time_format" text DEFAULT '12h' NOT NULL,
	"week_starts_on" integer DEFAULT 0 NOT NULL,
	"auto_save" boolean DEFAULT true NOT NULL,
	"compact_mode" boolean DEFAULT false NOT NULL,
	"show_completed_tasks" boolean DEFAULT true NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"accent_color" text DEFAULT 'yellow' NOT NULL,
	"ai_model" text DEFAULT 'qwen/qwen3.5-flash-02-23' NOT NULL,
	"ai_behavior" text DEFAULT 'balanced' NOT NULL,
	"ai_tone" text DEFAULT 'friendly' NOT NULL,
	"ai_output_language" text DEFAULT 'en' NOT NULL,
	"ai_features" jsonb DEFAULT '{"refine":true,"assistant":true,"templates":true,"autoSuggestions":true,"summarization":true,"notesAi":true,"tasksAi":true}' NOT NULL,
	"allow_ai_data_usage" boolean DEFAULT true NOT NULL,
	"notifications" jsonb DEFAULT '{"email":true,"taskReminders":true,"comments":true,"marketing":false,"systemUpdates":true,"push":false,"dueDateAlertOffset":"1d"}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "category_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "user_categories_clerk_module_key_idx" ON "user_categories" ("clerk_id","module","key");--> statement-breakpoint
CREATE INDEX "user_categories_clerk_module_sort_idx" ON "user_categories" ("clerk_id","module","sort_order");