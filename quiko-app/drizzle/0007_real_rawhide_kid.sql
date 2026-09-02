ALTER TABLE "kyc_verifications" ADD COLUMN "id_type" text;--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD COLUMN "id_number" text;--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD COLUMN "legal_name" text;--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;