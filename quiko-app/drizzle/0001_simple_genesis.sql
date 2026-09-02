ALTER TABLE "packages" ADD COLUMN "from_lat" real NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "from_lng" real NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "to_lat" real NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "to_lng" real NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "from_lat" real;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "from_lng" real;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "to_lat" real;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "to_lng" real;