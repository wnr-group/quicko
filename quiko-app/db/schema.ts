import {
  pgEnum,
  pgTable,
  uuid,
  text,
  integer,
  smallint,
  real,
  boolean,
  date,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// Drizzle owns the entire schema. `profiles` is the primary user table — its id
// is app-generated and referenced everywhere. Auth is custom (JWT sessions +
// MSG91 OTP); a profile is created/updated on OTP verify, no external auth table.

// ---- Enums ---------------------------------------------------------------

export const roleEnum = pgEnum("role", ["sender", "traveler"]);
export const transportEnum = pgEnum("transport_mode", ["flight", "train", "bus", "car"]);
export const timePrefEnum = pgEnum("time_preference", [
  "same_day",
  "next_day",
  "flexible",
]);
export const packageStatusEnum = pgEnum("package_status", [
  "active",
  "matched",
  "in_transit",
  "delivered",
  "cancelled",
]);
export const tripStatusEnum = pgEnum("trip_status", [
  "active",
  "matched",
  "completed",
  "cancelled",
]);
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "accepted",
  "declined",
  "countered",
  "cancelled",
]);
export const matchStatusEnum = pgEnum("match_status", [
  "confirmed",
  "paid",
  "picked_up",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
]);
export const kycStatusEnum = pgEnum("kyc_status", [
  "pending",
  "verified",
  "rejected",
]);
export const txnTypeEnum = pgEnum("txn_type", [
  "escrow_hold",
  "payout",
  "commission",
  "refund",
  "penalty",
]);
export const txnStatusEnum = pgEnum("txn_status", [
  "pending",
  "held",
  "released",
  "refunded",
  "failed",
]);

// Staff access tiers. user = normal customer; support = help desk (chat + read +
// tickets, no financial/ban powers); admin = everything.
export const staffRoleEnum = pgEnum("staff_role", ["user", "support", "admin"]);
export const supportThreadStatusEnum = pgEnum("support_thread_status", ["open", "closed"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "suspended"]);
export const disputeReasonEnum = pgEnum("dispute_reason", ["lost", "damaged", "wrong_otp", "no_show", "other"]);
export const disputeStatusEnum = pgEnum("dispute_status", ["open", "resolved"]);
export const reportTypeEnum = pgEnum("report_type", ["user", "prohibited", "auto_contact"]);
export const reportStatusEnum = pgEnum("report_status", ["open", "actioned", "dismissed"]);

// ---- Tables --------------------------------------------------------------

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(), // login identity (E.164 digits, e.g. 919999900001)
  email: text("email"),
  fullName: text("full_name"),
  avatar: text("avatar"),
  kycLevel: smallint("kyc_level").notNull().default(1),
  ratingAvg: real("rating_avg").notNull().default(0),
  deliveriesCount: integer("deliveries_count").notNull().default(0),
  trustScore: integer("trust_score").notNull().default(0),
  cashfreeVendorId: text("cashfree_vendor_id"), // Easy Split payout vendor (travelers who earn)
  isAdmin: boolean("is_admin").notNull().default(false), // legacy flag; staffRole is authoritative
  staffRole: staffRoleEnum("staff_role").notNull().default("user"),
  status: accountStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const kycVerifications = pgTable("kyc_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  level: smallint("level").notNull(),
  status: kycStatusEnum("status").notNull().default("pending"),
  idType: text("id_type"),
  idNumber: text("id_number"),
  legalName: text("legal_name"),
  notes: text("notes"),
  provider: text("provider"),
  providerRef: text("provider_ref"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const packages = pgTable("packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  fromCity: text("from_city").notNull(), // human label of the pickup pin
  toCity: text("to_city").notNull(), // human label of the drop pin
  fromLat: real("from_lat").notNull(),
  fromLng: real("from_lng").notNull(),
  toLat: real("to_lat").notNull(),
  toLng: real("to_lng").notNull(),
  travelDate: date("travel_date").notNull(), // window start
  dateTo: date("date_to"), // window end (null = single day = travelDate)
  weightKg: real("weight_kg").notNull(),
  declaredValue: integer("declared_value").notNull(),
  timePreference: timePrefEnum("time_preference").notNull(),
  description: text("description"),
  receiverName: text("receiver_name"),
  receiverPhone: text("receiver_phone"),
  offerPrice: integer("offer_price").notNull(),
  maxPrice: integer("max_price").notNull(),
  status: packageStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  travelerId: uuid("traveler_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  fromCity: text("from_city").notNull(),
  toCity: text("to_city").notNull(),
  fromLat: real("from_lat"),
  fromLng: real("from_lng"),
  toLat: real("to_lat"),
  toLng: real("to_lng"),
  travelDate: date("travel_date").notNull(), // departure date
  arriveDate: date("arrive_date"), // arrival date (may differ for multi-day trips)
  departTime: text("depart_time"),
  arriveTime: text("arrive_time"),
  pickupWindow: text("pickup_window"),
  deliveryWindow: text("delivery_window"),
  transport: transportEnum("transport").notNull(),
  capacityKg: real("capacity_kg").notNull(),
  extraDetourKm: smallint("extra_detour_km").notNull().default(0), // willingness beyond the free 2 km (0–10)
  pickupArea: text("pickup_area"),
  deliveryArea: text("delivery_area"),
  deliveryRadiusKm: integer("delivery_radius_km").default(10),
  status: tripStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matchRequests = pgTable("match_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  packageId: uuid("package_id")
    .notNull()
    .references(() => packages.id, { onDelete: "cascade" }),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "set null" }),
  requestedBy: uuid("requested_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  initiatorRole: roleEnum("initiator_role").notNull(),
  amount: integer("amount").notNull(),
  counterAmount: integer("counter_amount"),
  status: requestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  packageId: uuid("package_id")
    .notNull()
    .references(() => packages.id, { onDelete: "cascade" }),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "set null" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  travelerId: uuid("traveler_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  agreedPrice: integer("agreed_price").notNull(),
  // Detour ("travel an extra mile"): computed at match time from package + trip.
  detourKm: integer("detour_km").notNull().default(0), // actual detour this package adds
  detourFee: integer("detour_fee").notNull().default(0), // fee currently included in agreedPrice (0 if free/opted-out/self-collect)
  detourOptedOut: boolean("detour_opted_out").notNull().default(false), // sender chose to self-collect (pre-payment only)
  detourSelfCollect: boolean("detour_self_collect").notNull().default(false), // detour exceeds willingness → self-collect forced
  status: matchStatusEnum("status").notNull().default("confirmed"),
  pickupOtp: text("pickup_otp"),
  deliveryOtp: text("delivery_otp"),
  pickupPhotoUrl: text("pickup_photo_url"), // proof-of-pickup (data URI)
  deliveryPhotoUrl: text("delivery_photo_url"), // proof-of-delivery (data URI)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  body: text("body"),
  attachmentUrl: text("attachment_url"),
  lat: real("lat"), // location-pin messages (safe pickup/drop coordination)
  lng: real("lng"),
  locationLabel: text("location_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// In-app customer support. One open thread per user at a time; staff (support/
// admin) reply from the /support console. Not tied to a match.
export const supportThreads = pgTable("support_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  status: supportThreadStatusEnum("status").notNull().default("open"),
  assignedTo: uuid("assigned_to").references(() => profiles.id, { onDelete: "set null" }),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supportMessages = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => supportThreads.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  fromStaff: boolean("from_staff").notNull().default(false),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Disputes on a match. Raising one freezes the match (status → disputed); ops
// resolve via a money action (refund/release) or dismiss (restores priorStatus).
export const disputes = pgTable("disputes", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  raisedBy: uuid("raised_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  reason: disputeReasonEnum("reason").notNull(),
  detail: text("detail"),
  priorStatus: text("prior_status").notNull(), // match status before it was frozen
  status: disputeStatusEnum("status").notNull().default("open"),
  resolution: text("resolution"), // refunded | released | dismissed
  resolvedBy: uuid("resolved_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Safety reports — user-reported abuse / prohibited items, plus system auto-flags
// (e.g. a chat message blocked for sharing a phone number). Ops act from /admin/moderation.
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => profiles.id, { onDelete: "set null" }), // null = system
  reportedUserId: uuid("reported_user_id").references(() => profiles.id, { onDelete: "cascade" }),
  matchId: uuid("match_id").references(() => matches.id, { onDelete: "set null" }),
  type: reportTypeEnum("type").notNull(),
  detail: text("detail"),
  status: reportStatusEnum("status").notNull().default("open"),
  resolution: text("resolution"),
  handledBy: uuid("handled_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Timestamped log of a match's status transitions — powers the timeline timings.
export const matchEvents = pgTable("match_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Audit trail — every admin mutation (suspend, refund, resolve dispute, …) writes a row.
export const adminActions = pgTable("admin_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // e.g. "user.suspend", "match.refund"
  targetType: text("target_type"), // "user" | "match" | ...
  targetId: uuid("target_id"),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  type: txnTypeEnum("type").notNull(),
  status: txnStatusEnum("status").notNull().default("pending"),
  amount: integer("amount").notNull(),
  fromProfile: uuid("from_profile").references(() => profiles.id),
  toProfile: uuid("to_profile").references(() => profiles.id),
  provider: text("provider"),
  providerRef: text("provider_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  raterId: uuid("rater_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  rateeId: uuid("ratee_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  raterRole: roleEnum("rater_role").notNull(),
  communication: smallint("communication"),
  timeliness: smallint("timeliness"),
  care: smallint("care"),
  professionalism: smallint("professionalism"),
  overall: real("overall").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  data: jsonb("data"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
