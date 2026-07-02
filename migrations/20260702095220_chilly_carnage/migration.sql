CREATE TABLE "generated_app_collaborators" (
	"id" serial PRIMARY KEY,
	"app_id" integer NOT NULL,
	"email" text NOT NULL,
	"clerk_id" text,
	"role" text NOT NULL,
	"invited_by_clerk_id" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generated_apps" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "generated_apps" ADD COLUMN "share_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "generated_apps" ADD COLUMN "share_mode" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "generated_apps" ADD COLUMN "is_zk_share" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "generated_apps" ADD COLUMN "share_commitment" text;--> statement-breakpoint
ALTER TABLE "generated_apps" ADD COLUMN "share_salt" text;--> statement-breakpoint
ALTER TABLE "generated_apps" ADD COLUMN "share_nullifier_root" text;--> statement-breakpoint
ALTER TABLE "generated_apps" ADD CONSTRAINT "generated_apps_share_token_key" UNIQUE("share_token");--> statement-breakpoint
CREATE UNIQUE INDEX "generated_app_collaborators_app_email_idx" ON "generated_app_collaborators" ("app_id","email");--> statement-breakpoint
CREATE INDEX "generated_app_collaborators_clerk_idx" ON "generated_app_collaborators" ("clerk_id");--> statement-breakpoint
ALTER TABLE "generated_app_collaborators" ADD CONSTRAINT "generated_app_collaborators_app_id_generated_apps_id_fkey" FOREIGN KEY ("app_id") REFERENCES "generated_apps"("id") ON DELETE CASCADE;