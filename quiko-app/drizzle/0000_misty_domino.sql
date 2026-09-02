CREATE TYPE "public"."package_category" AS ENUM('documents', 'clothes', 'books', 'electronics', 'food', 'gifts', 'other');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('confirmed', 'paid', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('active', 'matched', 'in_transit', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'accepted', 'declined', 'countered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('sender', 'traveler');--> statement-breakpoint
CREATE TYPE "public"."package_size" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
CREATE TYPE "public"."time_preference" AS ENUM('same_day', 'next_day', 'flexible');--> statement-breakpoint
CREATE TYPE "public"."transport_mode" AS ENUM('flight', 'train', 'bus');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('active', 'matched', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."txn_status" AS ENUM('pending', 'held', 'released', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."txn_type" AS ENUM('escrow_hold', 'payout', 'commission', 'refund', 'penalty');--> statement-breakpoint
CREATE TABLE "kyc_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"level" smallint NOT NULL,
	"status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"provider" text,
	"provider_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"trip_id" uuid,
	"requested_by" uuid NOT NULL,
	"initiator_role" "role" NOT NULL,
	"amount" integer NOT NULL,
	"counter_amount" integer,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"trip_id" uuid,
	"sender_id" uuid NOT NULL,
	"traveler_id" uuid NOT NULL,
	"agreed_price" integer NOT NULL,
	"status" "match_status" DEFAULT 'confirmed' NOT NULL,
	"pickup_otp" text,
	"delivery_otp" text,
	"pickup_photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text,
	"attachment_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"from_city" text NOT NULL,
	"to_city" text NOT NULL,
	"travel_date" date NOT NULL,
	"weight_kg" real NOT NULL,
	"size" "package_size" NOT NULL,
	"declared_value" integer NOT NULL,
	"category" "package_category" NOT NULL,
	"time_preference" time_preference NOT NULL,
	"description" text,
	"offer_price" integer NOT NULL,
	"max_price" integer NOT NULL,
	"status" "package_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"full_name" text,
	"avatar" text,
	"kyc_level" smallint DEFAULT 1 NOT NULL,
	"rating_avg" real DEFAULT 0 NOT NULL,
	"deliveries_count" integer DEFAULT 0 NOT NULL,
	"trust_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"rater_id" uuid NOT NULL,
	"ratee_id" uuid NOT NULL,
	"rater_role" "role" NOT NULL,
	"communication" smallint,
	"timeliness" smallint,
	"care" smallint,
	"professionalism" smallint,
	"overall" real NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"type" "txn_type" NOT NULL,
	"status" "txn_status" DEFAULT 'pending' NOT NULL,
	"amount" integer NOT NULL,
	"from_profile" uuid,
	"to_profile" uuid,
	"provider" text,
	"provider_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"traveler_id" uuid NOT NULL,
	"from_city" text NOT NULL,
	"to_city" text NOT NULL,
	"travel_date" date NOT NULL,
	"depart_time" text,
	"arrive_time" text,
	"pickup_window" text,
	"delivery_window" text,
	"transport" "transport_mode" NOT NULL,
	"capacity_kg" real NOT NULL,
	"max_size" "package_size" NOT NULL,
	"pickup_area" text,
	"delivery_area" text,
	"delivery_radius_km" integer DEFAULT 10,
	"status" "trip_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_requests" ADD CONSTRAINT "match_requests_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_requests" ADD CONSTRAINT "match_requests_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_requests" ADD CONSTRAINT "match_requests_requested_by_profiles_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_traveler_id_profiles_id_fk" FOREIGN KEY ("traveler_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_id_profiles_id_fk" FOREIGN KEY ("rater_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratee_id_profiles_id_fk" FOREIGN KEY ("ratee_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_profile_profiles_id_fk" FOREIGN KEY ("from_profile") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_profile_profiles_id_fk" FOREIGN KEY ("to_profile") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_traveler_id_profiles_id_fk" FOREIGN KEY ("traveler_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;