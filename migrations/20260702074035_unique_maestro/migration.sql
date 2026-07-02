CREATE TABLE "space_files" (
	"id" serial PRIMARY KEY,
	"space_id" integer NOT NULL,
	"page_id" integer,
	"clerk_id" text NOT NULL,
	"name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"data_base64" text NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "space_files_space_deleted_idx" ON "space_files" ("space_id","deleted_at");--> statement-breakpoint
CREATE INDEX "space_files_clerk_idx" ON "space_files" ("clerk_id");--> statement-breakpoint
ALTER TABLE "space_files" ADD CONSTRAINT "space_files_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_files" ADD CONSTRAINT "space_files_page_id_pages_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL;