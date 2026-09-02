ALTER TABLE "packages" DROP COLUMN "size";--> statement-breakpoint
ALTER TABLE "packages" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "trips" DROP COLUMN "max_size";--> statement-breakpoint
DROP TYPE "public"."package_category";--> statement-breakpoint
DROP TYPE "public"."package_size";