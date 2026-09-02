import "server-only";
import { and, desc, eq, inArray, ne, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { matches, transactions, packages, ratings, profiles, matchRequests, trips, matchEvents } from "@/db/schema";
import { notify } from "@/lib/queries/notifications";
import { splitPayment, detourFee } from "@/core/pricing";
import { payments } from "@/lib/payments";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function ownedMatch(tx: Tx, matchId: string, senderId: string) {
  const [m] = await tx
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.senderId, senderId)))
    .limit(1);
  return m ?? null;
}

async function travelerMatch(tx: Tx, matchId: string, travelerId: string) {
  const [m] = await tx
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.travelerId, travelerId)))
    .limit(1);
  return m ?? null;
}

type Result = { ok: true } | { ok: false; error: string };

/** Record a status transition with its timestamp (powers the timeline timings). */
export async function logMatchEvent(tx: Tx, matchId: string, status: string) {
  await tx.insert(matchEvents).values({ matchId, status });
}

/** Deterministic Cashfree order id for a match (stored as transactions.providerRef). */
const orderIdFor = (matchId: string) => `q_${matchId}`;

export type PayResult =
  | { ok: true; checkout?: { paymentSessionId: string; orderId: string } }
  | { ok: false; error: string };

/**
 * Sender opts in/out of the traveller's detour (door-service vs self-collect).
 * Allowed only before payment; recomputes the detour fee into agreedPrice.
 */
export async function setDetourOptOut(
  matchId: string,
  senderId: string,
  optedOut: boolean,
): Promise<Result> {
  return db.transaction(async (tx) => {
    const m = await ownedMatch(tx, matchId, senderId);
    if (!m) return { ok: false, error: "Match not found" };
    if (m.status !== "confirmed") return { ok: false, error: "Locked once payment starts" };
    if (m.detourSelfCollect) return { ok: false, error: "This route needs self-collect — no door-service to toggle" };
    if (m.detourFee === 0 && !m.detourOptedOut) return { ok: false, error: "No detour fee to change" };

    const base = m.agreedPrice - m.detourFee; // strip the currently-applied fee
    const fee = optedOut ? 0 : detourFee(m.detourKm);
    await tx
      .update(matches)
      .set({ detourOptedOut: optedOut, detourFee: fee, agreedPrice: base + fee, updatedAt: new Date() })
      .where(eq(matches.id, matchId));
    return { ok: true };
  });
}

/**
 * Sender pays into escrow. Routes through the payments provider:
 *   simulated → recorded as held immediately, match confirmed → paid.
 *   cashfree  → creates an Easy Split order (traveler's share held), returns a
 *               checkout session; the match flips to paid on the payment webhook.
 * The external provider call is made outside the DB transaction.
 */
export async function payForMatch(matchId: string, senderId: string): Promise<PayResult> {
  const provider = payments();

  const [m] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.senderId, senderId)))
    .limit(1);
  if (!m) return { ok: false, error: "Match not found" };
  if (m.status !== "confirmed") return { ok: false, error: "Already paid" };

  const orderId = orderIdFor(matchId);
  const { travelerEarns, commission } = splitPayment(m.agreedPrice);

  const [sender] = await db
    .select({ fullName: profiles.fullName, phone: profiles.phone, email: profiles.email })
    .from(profiles)
    .where(eq(profiles.id, senderId))
    .limit(1);
  const [traveler] = await db
    .select({ vendorId: profiles.cashfreeVendorId })
    .from(profiles)
    .where(eq(profiles.id, m.travelerId))
    .limit(1);

  if (provider.kind === "cashfree" && !traveler?.vendorId) {
    return { ok: false, error: "The traveler hasn't set up payouts yet." };
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const result = await provider.createEscrowPayment({
    orderId,
    matchId,
    amount: m.agreedPrice,
    travelerEarns: Math.round(travelerEarns),
    commission: Math.round(commission),
    travelerVendorId: traveler?.vendorId ?? m.travelerId,
    customer: { id: senderId, name: sender?.fullName ?? "Quiko user", phone: sender?.phone ?? "", email: sender?.email ?? undefined },
    notifyUrl: `${appUrl}/api/webhooks/cashfree`,
    returnUrl: `${appUrl}/app/matches`,
  });
  const held = result.mode === "completed";

  return db.transaction(async (tx): Promise<PayResult> => {
    // Re-check status inside the transaction to avoid a double charge under concurrency.
    const cur = await ownedMatch(tx, matchId, senderId);
    if (!cur || cur.status !== "confirmed") return { ok: false, error: "Already paid" };

    await tx.insert(transactions).values({
      matchId,
      type: "escrow_hold",
      status: held ? "held" : "pending",
      amount: m.agreedPrice,
      fromProfile: senderId,
      provider: provider.kind,
      providerRef: orderId,
    });

    if (held) {
      await tx.update(matches).set({ status: "paid", updatedAt: new Date() }).where(eq(matches.id, matchId));
      await logMatchEvent(tx, matchId, "paid");
      await notify(tx, {
        profileId: m.travelerId,
        type: "paid",
        title: "Payment secured 🔒",
        body: "The sender paid into escrow — go pick up the package.",
        href: `/app/travel/trips/${m.tripId}`,
      });
      return { ok: true };
    }
    // Cashfree: client opens checkout; the webhook advances the match to paid.
    return { ok: true, checkout: { paymentSessionId: result.paymentSessionId, orderId } };
  });
}

/** Reject anything that isn't a reasonably-sized image data URI. */
function validatePhoto(photo: string): string | null {
  if (!photo.startsWith("data:image/")) return "Invalid image";
  if (photo.length > 1_400_000) return "Photo too large — try again"; // ~1 MB after client downscale
  return null;
}

/**
 * A participant (sender or traveller) cancels a match before pickup.
 *   confirmed → just cancel and reopen the package.
 *   paid      → refund the sender, cancel, reopen the package.
 *   picked_up onwards → not allowed (goods are moving — use a dispute).
 */
export async function cancelMatchAsParticipant(matchId: string, userId: string): Promise<Result> {
  const provider = payments();

  const [m] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!m) return { ok: false, error: "Match not found" };
  if (m.senderId !== userId && m.travelerId !== userId) return { ok: false, error: "Not allowed" };
  if (m.status !== "confirmed" && m.status !== "paid") {
    return { ok: false, error: "This delivery is already under way — use Report a problem instead." };
  }

  const refund = m.status === "paid";
  const orderId = orderIdFor(matchId);
  if (refund && provider.kind === "cashfree") {
    await provider.refundToSender({ orderId, matchId, amount: m.agreedPrice });
  }
  const byTraveller = userId === m.travelerId;

  return db.transaction(async (tx) => {
    const cur = await tx.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!cur[0] || (cur[0].status !== "confirmed" && cur[0].status !== "paid")) {
      return { ok: false, error: "This match can no longer be cancelled" };
    }
    if (refund) {
      await tx.insert(transactions).values({
        matchId, type: "refund", status: "refunded", amount: m.agreedPrice,
        toProfile: m.senderId, provider: provider.kind, providerRef: orderId,
      });
      await tx
        .update(transactions)
        .set({ status: "refunded" })
        .where(and(eq(transactions.matchId, matchId), eq(transactions.type, "escrow_hold")));
    }
    await tx.update(matches).set({ status: "cancelled", updatedAt: new Date() }).where(eq(matches.id, matchId));
    await tx.update(packages).set({ status: "active", updatedAt: new Date() }).where(eq(packages.id, m.packageId));
    // Reopen the traveller's trip too, so they can carry other packages again.
    if (m.tripId) {
      await tx.update(trips).set({ status: "active", updatedAt: new Date() }).where(eq(trips.id, m.tripId));
    }
    // Clear the accepted request so the package can be freely re-matched/re-requested.
    await tx
      .update(matchRequests)
      .set({ status: "declined", updatedAt: new Date() })
      .where(and(eq(matchRequests.packageId, m.packageId), eq(matchRequests.status, "accepted")));

    const other = byTraveller ? m.senderId : m.travelerId;
    await notify(tx, {
      profileId: other,
      type: "cancelled",
      title: "Match cancelled",
      body: byTraveller ? "The traveller cancelled this delivery." : "The sender cancelled this delivery.",
      href: byTraveller ? `/app/packages/${m.packageId}` : "/app/travel",
    });
    if (refund) {
      await notify(tx, {
        profileId: m.senderId,
        type: "refund",
        title: "You've been refunded",
        body: "Your payment for the cancelled delivery was refunded.",
        href: `/app/packages/${m.packageId}`,
      });
    }
    return { ok: true };
  });
}

/** Traveler advances the delivery: paid → picked_up → in_transit. */
export async function advanceMatchAsTraveler(
  matchId: string,
  travelerId: string,
  to: "picked_up" | "in_transit",
  photo?: string,
): Promise<Result> {
  if (photo) {
    const err = validatePhoto(photo);
    if (err) return { ok: false, error: err };
  }
  return db.transaction(async (tx) => {
    const m = await travelerMatch(tx, matchId, travelerId);
    if (!m) return { ok: false, error: "Match not found" };
    if (to === "picked_up" && m.status !== "paid")
      return { ok: false, error: "Waiting for the sender to pay" };
    if (to === "in_transit" && m.status !== "picked_up")
      return { ok: false, error: "Mark pickup first" };
    await tx
      .update(matches)
      .set({ status: to, updatedAt: new Date(), ...(to === "picked_up" && photo ? { pickupPhotoUrl: photo } : {}) })
      .where(eq(matches.id, matchId));
    await logMatchEvent(tx, matchId, to);
    await tx
      .update(packages)
      .set({ status: "in_transit", updatedAt: new Date() })
      .where(eq(packages.id, m.packageId));
    await notify(tx, {
      profileId: m.senderId,
      type: to,
      title: to === "picked_up" ? "Package picked up" : "On the way 🚀",
      body:
        to === "picked_up"
          ? "The traveler has your package. Keep the delivery OTP handy."
          : "Your package is in transit to the destination.",
      href: `/app/packages/${m.packageId}`,
    });
    return { ok: true };
  });
}

/** Traveler confirms delivery with the OTP the receiver gives → release payout. */
export async function confirmDelivery(
  matchId: string,
  travelerId: string,
  otp: string,
  photo?: string,
): Promise<Result> {
  const provider = payments();
  if (photo) {
    const err = validatePhoto(photo);
    if (err) return { ok: false, error: err };
  }

  // Validate the OTP BEFORE releasing any money.
  const [pre] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.travelerId, travelerId)))
    .limit(1);
  if (!pre) return { ok: false, error: "Match not found" };
  if (pre.status !== "in_transit") return { ok: false, error: "Not in transit yet" };
  if ((pre.deliveryOtp ?? "") !== otp.trim()) return { ok: false, error: "Incorrect OTP" };

  // Release the held vendor split to the traveler (external call outside the tx).
  const orderId = orderIdFor(matchId);
  if (provider.kind === "cashfree") {
    await provider.releaseToTraveler({ orderId, matchId });
  }
  const releasedNow = provider.kind === "simulated";

  return db.transaction(async (tx) => {
    const m = await travelerMatch(tx, matchId, travelerId);
    if (!m) return { ok: false, error: "Match not found" };
    if (m.status !== "in_transit") return { ok: false, error: "Not in transit yet" };

    const { travelerEarns, commission } = splitPayment(m.agreedPrice);
    await tx.insert(transactions).values([
      { matchId, type: "payout", status: releasedNow ? "released" : "pending", amount: Math.round(travelerEarns), toProfile: m.travelerId, provider: provider.kind, providerRef: orderId },
      { matchId, type: "commission", status: releasedNow ? "released" : "pending", amount: Math.round(commission), provider: provider.kind, providerRef: orderId },
    ]);
    await tx.update(matches).set({ status: "delivered", updatedAt: new Date(), ...(photo ? { deliveryPhotoUrl: photo } : {}) }).where(eq(matches.id, matchId));
    await logMatchEvent(tx, matchId, "delivered");
    await tx.update(packages).set({ status: "delivered", updatedAt: new Date() }).where(eq(packages.id, m.packageId));
    await tx
      .update(profiles)
      .set({ deliveriesCount: sql`${profiles.deliveriesCount} + 1`, updatedAt: new Date() })
      .where(eq(profiles.id, m.travelerId));
    await notify(tx, {
      profileId: m.senderId,
      type: "delivered",
      title: "Delivered! ✅",
      body: "Your package reached the receiver. Rate your traveler.",
      href: `/app/packages/${m.packageId}`,
    });
    return { ok: true };
  });
}

/** Sender rates the traveler → recompute their rating + trust, complete match. */
export async function rateTraveler(
  matchId: string,
  senderId: string,
  stars: number,
  comment: string | null,
): Promise<Result> {
  return db.transaction(async (tx) => {
    const m = await ownedMatch(tx, matchId, senderId);
    if (!m) return { ok: false, error: "Match not found" };

    const existing = await tx
      .select({ id: ratings.id })
      .from(ratings)
      .where(and(eq(ratings.matchId, matchId), eq(ratings.raterId, senderId)))
      .limit(1);
    if (existing.length === 0) {
      await tx.insert(ratings).values({
        matchId,
        raterId: senderId,
        rateeId: m.travelerId,
        raterRole: "sender",
        overall: stars,
        comment: comment || null,
      });
    }

    const [agg] = await tx
      .select({ avg: sql<number>`avg(${ratings.overall})`, cnt: sql<number>`count(*)` })
      .from(ratings)
      .where(eq(ratings.rateeId, m.travelerId));
    const avg = Number(agg?.avg) || stars;

    const [t] = await tx.select().from(profiles).where(eq(profiles.id, m.travelerId)).limit(1);
    const trust = Math.round(avg * (t?.deliveriesCount ?? 0) + (t?.kycLevel ?? 1) * 10);
    await tx
      .update(profiles)
      .set({ ratingAvg: avg, trustScore: trust, updatedAt: new Date() })
      .where(eq(profiles.id, m.travelerId));

    await tx.update(matches).set({ status: "completed", updatedAt: new Date() }).where(eq(matches.id, matchId));
    await logMatchEvent(tx, matchId, "completed");
    await notify(tx, {
      profileId: m.travelerId,
      type: "rated",
      title: `You received a ${stars}★ rating`,
      body: comment ? `“${comment}”` : "Thanks for a smooth delivery!",
      href: `/app/travel/trips/${m.tripId}`,
    });
    return { ok: true };
  });
}

const matchWithSender = {
  match: matches,
  package: packages,
  sender: {
    id: profiles.id,
    fullName: profiles.fullName,
    ratingAvg: profiles.ratingAvg,
  },
} as const;

/** Confirmed matches on a trip (the traveler's "carrying" list). */
export async function getMatchesForTrip(tripId: string) {
  return db
    .select(matchWithSender)
    .from(matches)
    .innerJoin(packages, eq(matches.packageId, packages.id))
    .innerJoin(profiles, eq(matches.senderId, profiles.id))
    .where(and(eq(matches.tripId, tripId), ne(matches.status, "cancelled")))
    .orderBy(desc(matches.createdAt));
}

/** Cancelled matches on a trip — shown as history so the traveller has a record. */
export async function getCancelledMatchesForTrip(tripId: string) {
  return db
    .select(matchWithSender)
    .from(matches)
    .innerJoin(packages, eq(matches.packageId, packages.id))
    .innerJoin(profiles, eq(matches.senderId, profiles.id))
    .where(and(eq(matches.tripId, tripId), eq(matches.status, "cancelled")))
    .orderBy(desc(matches.updatedAt));
}

/** All matches where this profile is the traveler (across trips). */
export async function getTravelerMatches(travelerId: string) {
  return db
    .select(matchWithSender)
    .from(matches)
    .innerJoin(packages, eq(matches.packageId, packages.id))
    .innerJoin(profiles, eq(matches.senderId, profiles.id))
    .where(eq(matches.travelerId, travelerId))
    .orderBy(desc(matches.createdAt));
}

/**
 * Traveler wallet: lifetime released payouts (earned), money still in escrow on
 * active carries (releases on delivery), and the payout history. Amounts are the
 * traveler's post-commission share, straight from the transactions ledger.
 */
export async function getTravelerWallet(travelerId: string) {
  const payoutRows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      createdAt: transactions.createdAt,
      fromCity: packages.fromCity,
      toCity: packages.toCity,
      tripId: matches.tripId,
    })
    .from(transactions)
    .innerJoin(matches, eq(transactions.matchId, matches.id))
    .innerJoin(packages, eq(matches.packageId, packages.id))
    .where(and(eq(transactions.type, "payout"), eq(transactions.toProfile, travelerId)))
    .orderBy(desc(transactions.createdAt));

  const activeRows = await db
    .select({ match: matches, package: packages })
    .from(matches)
    .innerJoin(packages, eq(matches.packageId, packages.id))
    .where(
      and(
        eq(matches.travelerId, travelerId),
        inArray(matches.status, ["paid", "picked_up", "in_transit"]),
      ),
    )
    .orderBy(desc(matches.updatedAt));

  const earned = payoutRows.reduce((s, r) => s + r.amount, 0);
  const upcoming = activeRows.map((r) => ({
    id: r.match.id,
    amount: Math.round(splitPayment(r.match.agreedPrice).travelerEarns),
    status: r.match.status,
    fromCity: r.package.fromCity,
    toCity: r.package.toCity,
    tripId: r.match.tripId,
  }));
  const pending = upcoming.reduce((s, u) => s + u.amount, 0);

  return { earned, pending, deliveries: payoutRows.length, payouts: payoutRows, upcoming };
}

const TERMINAL = ["completed", "cancelled"] as const;

/** Every match this profile is part of (as sender OR traveler), for the Matches tab. */
export async function getUserMatches(profileId: string) {
  const cols = {
    match: matches,
    package: packages,
    counterpart: { id: profiles.id, fullName: profiles.fullName },
  } as const;

  const asSender = await db
    .select(cols)
    .from(matches)
    .innerJoin(packages, eq(matches.packageId, packages.id))
    .innerJoin(profiles, eq(matches.travelerId, profiles.id)) // counterpart = traveler
    .where(eq(matches.senderId, profileId));

  const asTraveler = await db
    .select(cols)
    .from(matches)
    .innerJoin(packages, eq(matches.packageId, packages.id))
    .innerJoin(profiles, eq(matches.senderId, profiles.id)) // counterpart = sender
    .where(eq(matches.travelerId, profileId));

  return [
    ...asSender.map((r) => ({ ...r, role: "sender" as const, href: `/app/packages/${r.package.id}` })),
    ...asTraveler.map((r) => ({ ...r, role: "traveler" as const, href: `/app/travel/trips/${r.match.tripId}` })),
  ].sort((a, b) => (b.match.updatedAt?.getTime() ?? 0) - (a.match.updatedAt?.getTime() ?? 0));
}

/** Count of the profile's in-progress matches (for the Matches tab badge). */
export async function countActiveMatches(profileId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(matches)
    .where(
      and(
        or(eq(matches.senderId, profileId), eq(matches.travelerId, profileId)),
        notInArray(matches.status, [...TERMINAL]),
      ),
    );
  return Number(row?.n ?? 0);
}

/** A single owned (traveler-side) match with package + sender, for the carrying view. */
export async function getTravelerMatch(matchId: string, travelerId: string) {
  const [row] = await db
    .select(matchWithSender)
    .from(matches)
    .innerJoin(packages, eq(matches.packageId, packages.id))
    .innerJoin(profiles, eq(matches.senderId, profiles.id))
    .where(and(eq(matches.id, matchId), eq(matches.travelerId, travelerId)))
    .limit(1);
  return row ?? null;
}
