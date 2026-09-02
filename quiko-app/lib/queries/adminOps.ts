import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, matches, transactions, packages } from "@/db/schema";
import { notify } from "@/lib/queries/notifications";
import { logAdminAction } from "@/lib/queries/audit";
import { resolveOpenDisputes, createOpsHoldDispute } from "@/lib/queries/disputes";
import { payments } from "@/lib/payments";
import { splitPayment } from "@/core/pricing";

type Result = { ok: true } | { ok: false; error: string };

// Money is sitting in escrow in these states.
const HELD_STATES = ["paid", "picked_up", "in_transit", "disputed"] as const;
const isHeld = (s: string) => (HELD_STATES as readonly string[]).includes(s);
const orderIdFor = (matchId: string) => `q_${matchId}`;

export async function setUserStatus(actorId: string, userId: string, status: "active" | "suspended"): Promise<Result> {
  if (actorId === userId && status === "suspended") return { ok: false, error: "You can't suspend yourself" };
  return db.transaction(async (tx) => {
    const [u] = await tx.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (!u) return { ok: false, error: "User not found" };
    await tx.update(profiles).set({ status, updatedAt: new Date() }).where(eq(profiles.id, userId));
    await logAdminAction(tx, { actorId, action: `user.${status === "suspended" ? "suspend" : "reinstate"}`, targetType: "user", targetId: userId });
    return { ok: true };
  });
}

export async function setUserStaffRole(actorId: string, userId: string, role: "user" | "support" | "admin"): Promise<Result> {
  if (actorId === userId && role !== "admin") return { ok: false, error: "You can't remove your own admin access" };
  return db.transaction(async (tx) => {
    const [u] = await tx.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (!u) return { ok: false, error: "User not found" };
    // Keep the legacy is_admin flag in sync with the role.
    await tx.update(profiles).set({ staffRole: role, isAdmin: role === "admin", updatedAt: new Date() }).where(eq(profiles.id, userId));
    await logAdminAction(tx, { actorId, action: "user.set_role", targetType: "user", targetId: userId, detail: role });
    return { ok: true };
  });
}

export async function forceVerifyUser(actorId: string, userId: string): Promise<Result> {
  return db.transaction(async (tx) => {
    const [u] = await tx.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (!u) return { ok: false, error: "User not found" };
    await tx.update(profiles).set({ kycLevel: 3, updatedAt: new Date() }).where(eq(profiles.id, userId));
    await logAdminAction(tx, { actorId, action: "user.force_verify", targetType: "user", targetId: userId });
    return { ok: true };
  });
}

export async function editUserName(actorId: string, userId: string, name: string): Promise<Result> {
  const clean = name.trim();
  if (clean.length < 2) return { ok: false, error: "Name too short" };
  return db.transaction(async (tx) => {
    await tx.update(profiles).set({ fullName: clean, updatedAt: new Date() }).where(eq(profiles.id, userId));
    await logAdminAction(tx, { actorId, action: "user.edit_name", targetType: "user", targetId: userId, detail: clean });
    return { ok: true };
  });
}

// ---- Match money actions (disputes / refund ops) ----

/** Refund the sender and cancel the match. Only when funds are held. */
export async function adminRefundMatch(actorId: string, matchId: string): Promise<Result> {
  const [m] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!m) return { ok: false, error: "Match not found" };
  if (!isHeld(m.status)) return { ok: false, error: "No held funds to refund" };

  const provider = payments();
  const orderId = orderIdFor(matchId);
  if (provider.kind === "cashfree") await provider.refundToSender({ orderId, matchId, amount: m.agreedPrice });

  return db.transaction(async (tx) => {
    await tx.insert(transactions).values({
      matchId, type: "refund", status: "refunded", amount: m.agreedPrice,
      toProfile: m.senderId, provider: provider.kind, providerRef: orderId,
    });
    await tx.update(transactions).set({ status: "refunded" })
      .where(and(eq(transactions.matchId, matchId), eq(transactions.type, "escrow_hold")));
    await tx.update(matches).set({ status: "cancelled", updatedAt: new Date() }).where(eq(matches.id, matchId));
    await tx.update(packages).set({ status: "cancelled", updatedAt: new Date() }).where(eq(packages.id, m.packageId));
    await resolveOpenDisputes(tx, matchId, actorId, "refunded");
    await notify(tx, { profileId: m.senderId, type: "refund", title: "You've been refunded", body: "Quiko refunded your payment for this delivery.", href: `/app/packages/${m.packageId}` });
    await notify(tx, { profileId: m.travelerId, type: "cancelled", title: "Delivery cancelled", body: "Support cancelled this delivery and refunded the sender.", href: "/app/travel" });
    await logAdminAction(tx, { actorId, action: "match.refund", targetType: "match", targetId: matchId, detail: String(m.agreedPrice) });
    return { ok: true };
  });
}

/** Release the held funds to the traveller and complete the match. */
export async function adminReleaseMatch(actorId: string, matchId: string): Promise<Result> {
  const [m] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!m) return { ok: false, error: "Match not found" };
  if (!isHeld(m.status)) return { ok: false, error: "No held funds to release" };

  const provider = payments();
  const orderId = orderIdFor(matchId);
  if (provider.kind === "cashfree") await provider.releaseToTraveler({ orderId, matchId });
  const { travelerEarns, commission } = splitPayment(m.agreedPrice);
  const released = provider.kind === "simulated";

  return db.transaction(async (tx) => {
    await tx.insert(transactions).values([
      { matchId, type: "payout", status: released ? "released" : "pending", amount: Math.round(travelerEarns), toProfile: m.travelerId, provider: provider.kind, providerRef: orderId },
      { matchId, type: "commission", status: released ? "released" : "pending", amount: Math.round(commission), provider: provider.kind, providerRef: orderId },
    ]);
    await tx.update(matches).set({ status: "completed", updatedAt: new Date() }).where(eq(matches.id, matchId));
    await resolveOpenDisputes(tx, matchId, actorId, "released");
    await notify(tx, { profileId: m.travelerId, type: "paid", title: "Payment released", body: "Support released the escrow to your earnings.", href: "/app/wallet" });
    await logAdminAction(tx, { actorId, action: "match.release", targetType: "match", targetId: matchId, detail: String(m.agreedPrice) });
    return { ok: true };
  });
}

/** Freeze a match under investigation — opens an ops dispute (status → disputed). */
export async function adminHoldMatch(actorId: string, matchId: string): Promise<Result> {
  const [m] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!m) return { ok: false, error: "Match not found" };
  if (m.status === "disputed") return { ok: false, error: "Already on hold" };
  if (!isHeld(m.status)) return { ok: false, error: "Only paid matches can be held" };
  return db.transaction(async (tx) => {
    await createOpsHoldDispute(tx, { matchId, actorId, priorStatus: m.status, senderId: m.senderId, packageId: m.packageId });
    await logAdminAction(tx, { actorId, action: "match.hold", targetType: "match", targetId: matchId });
    return { ok: true };
  });
}

/** Cancel an unpaid match and reopen the package for re-matching. */
export async function adminCancelMatch(actorId: string, matchId: string): Promise<Result> {
  const [m] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!m) return { ok: false, error: "Match not found" };
  if (isHeld(m.status)) return { ok: false, error: "Funds are held — refund instead" };
  if (m.status !== "confirmed") return { ok: false, error: "Only new matches can be cancelled" };
  return db.transaction(async (tx) => {
    await tx.update(matches).set({ status: "cancelled", updatedAt: new Date() }).where(eq(matches.id, matchId));
    await tx.update(packages).set({ status: "active", updatedAt: new Date() }).where(eq(packages.id, m.packageId));
    await notify(tx, { profileId: m.senderId, type: "cancelled", title: "Match cancelled", body: "Support cancelled this match — your package is open for matching again.", href: `/app/packages/${m.packageId}` });
    await logAdminAction(tx, { actorId, action: "match.cancel", targetType: "match", targetId: matchId });
    return { ok: true };
  });
}
