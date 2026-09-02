import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { disputes, matches, packages, profiles } from "@/db/schema";
import { notify } from "@/lib/queries/notifications";
import { logAdminAction } from "@/lib/queries/audit";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Result = { ok: true } | { ok: false; error: string };
type Reason = "lost" | "damaged" | "wrong_otp" | "no_show" | "other";

// A dispute can be raised once the package is paid for and until it's settled.
const DISPUTABLE = ["paid", "picked_up", "in_transit", "delivered"];

/** A participant (sender or traveller) reports a problem → freezes the match. */
export async function raiseDispute(matchId: string, userId: string, reason: Reason, detail: string): Promise<Result> {
  return db.transaction(async (tx) => {
    const [m] = await tx.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!m) return { ok: false, error: "Match not found" };
    if (m.senderId !== userId && m.travelerId !== userId) return { ok: false, error: "Not allowed" };
    if (m.status === "disputed") return { ok: false, error: "This delivery is already under review" };
    if (!DISPUTABLE.includes(m.status)) return { ok: false, error: "Nothing to dispute at this stage" };

    await tx.insert(disputes).values({ matchId, raisedBy: userId, reason, detail: detail.trim() || null, priorStatus: m.status });
    await tx.update(matches).set({ status: "disputed", updatedAt: new Date() }).where(eq(matches.id, matchId));
    const counterpart = m.senderId === userId ? m.travelerId : m.senderId;
    await notify(tx, {
      profileId: counterpart,
      type: "disputed",
      title: "Delivery under review",
      body: "The other party reported a problem. Quiko support is looking into it.",
      href: `/app/packages/${m.packageId}`,
    });
    return { ok: true };
  });
}

/** Ops-initiated freeze (called from adminHoldMatch, inside its transaction). */
export async function createOpsHoldDispute(
  tx: Tx,
  input: { matchId: string; actorId: string; priorStatus: string; senderId: string; packageId: string },
) {
  await tx.insert(disputes).values({
    matchId: input.matchId,
    raisedBy: input.actorId,
    reason: "other",
    detail: "Frozen by support for review",
    priorStatus: input.priorStatus,
  });
  await tx.update(matches).set({ status: "disputed", updatedAt: new Date() }).where(eq(matches.id, input.matchId));
  await notify(tx, {
    profileId: input.senderId,
    type: "disputed",
    title: "Delivery under review",
    body: "Support is reviewing this delivery. We'll update you shortly.",
    href: `/app/packages/${input.packageId}`,
  });
}

/** Mark any open disputes on a match resolved (called from refund/release txns). */
export async function resolveOpenDisputes(tx: Tx, matchId: string, resolvedBy: string, resolution: string) {
  await tx
    .update(disputes)
    .set({ status: "resolved", resolution, resolvedBy, updatedAt: new Date() })
    .where(and(eq(disputes.matchId, matchId), eq(disputes.status, "open")));
}

/** Dismiss the dispute with no money movement — restore the match to its prior state. */
export async function dismissDispute(actorId: string, matchId: string): Promise<Result> {
  return db.transaction(async (tx) => {
    const [m] = await tx.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!m) return { ok: false, error: "Match not found" };
    if (m.status !== "disputed") return { ok: false, error: "Match is not under dispute" };
    const [d] = await tx
      .select()
      .from(disputes)
      .where(and(eq(disputes.matchId, matchId), eq(disputes.status, "open")))
      .orderBy(desc(disputes.createdAt))
      .limit(1);
    const restore = (d?.priorStatus ?? "paid") as (typeof matches.$inferSelect)["status"];
    await tx.update(matches).set({ status: restore, updatedAt: new Date() }).where(eq(matches.id, matchId));
    await resolveOpenDisputes(tx, matchId, actorId, "dismissed");
    await notify(tx, {
      profileId: m.senderId,
      type: "disputed",
      title: "Dispute closed",
      body: "Support reviewed the delivery and it's back on track.",
      href: `/app/packages/${m.packageId}`,
    });
    await logAdminAction(tx, { actorId, action: "dispute.dismiss", targetType: "match", targetId: matchId });
    return { ok: true };
  });
}

/**
 * The person who RAISED a dispute withdraws it — same effect as an admin dismiss
 * (restores the prior state), but self-serve. Ops-raised holds can't be withdrawn.
 */
export async function withdrawDispute(matchId: string, userId: string): Promise<Result> {
  return db.transaction(async (tx) => {
    const [d] = await tx
      .select()
      .from(disputes)
      .where(and(eq(disputes.matchId, matchId), eq(disputes.status, "open")))
      .orderBy(desc(disputes.createdAt))
      .limit(1);
    if (!d) return { ok: false, error: "No open dispute" };
    if (d.raisedBy !== userId) return { ok: false, error: "Only the person who raised it can withdraw it" };
    const [m] = await tx.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!m || m.status !== "disputed") return { ok: false, error: "This match is not under dispute" };

    const restore = (d.priorStatus ?? "paid") as (typeof matches.$inferSelect)["status"];
    await tx.update(matches).set({ status: restore, updatedAt: new Date() }).where(eq(matches.id, matchId));
    await tx.update(disputes).set({ status: "resolved", resolution: "withdrawn", resolvedBy: userId, updatedAt: new Date() }).where(eq(disputes.id, d.id));
    const other = m.senderId === userId ? m.travelerId : m.senderId;
    await notify(tx, {
      profileId: other,
      type: "disputed",
      title: "Dispute withdrawn",
      body: "The dispute was withdrawn — the delivery is back on track.",
      href: other === m.senderId ? `/app/packages/${m.packageId}` : "/app/travel",
    });
    return { ok: true };
  });
}

/** Map of matchId → who raised its open dispute (for showing a Withdraw control). */
export async function getOpenDisputeRaisers(matchIds: string[]): Promise<Record<string, string>> {
  if (matchIds.length === 0) return {};
  const rows = await db
    .select({ matchId: disputes.matchId, raisedBy: disputes.raisedBy })
    .from(disputes)
    .where(and(inArray(disputes.matchId, matchIds), eq(disputes.status, "open")));
  return Object.fromEntries(rows.map((r) => [r.matchId, r.raisedBy]));
}

/** Open disputes queue for the admin console. */
export async function listOpenDisputes() {
  return db
    .select({
      dispute: disputes,
      route: { fromCity: packages.fromCity, toCity: packages.toCity },
      raiser: { id: profiles.id, fullName: profiles.fullName },
      agreedPrice: matches.agreedPrice,
    })
    .from(disputes)
    .innerJoin(matches, eq(disputes.matchId, matches.id))
    .innerJoin(packages, eq(matches.packageId, packages.id))
    .innerJoin(profiles, eq(disputes.raisedBy, profiles.id))
    .where(eq(disputes.status, "open"))
    .orderBy(desc(disputes.createdAt))
    .limit(200);
}

/** The open dispute on a match, for the match detail view. */
export async function getOpenDisputeForMatch(matchId: string) {
  const [row] = await db
    .select({ dispute: disputes, raiser: { id: profiles.id, fullName: profiles.fullName } })
    .from(disputes)
    .innerJoin(profiles, eq(disputes.raisedBy, profiles.id))
    .where(and(eq(disputes.matchId, matchId), eq(disputes.status, "open")))
    .orderBy(desc(disputes.createdAt))
    .limit(1);
  return row ?? null;
}

export async function countOpenDisputes(): Promise<number> {
  const rows = await db.select({ id: disputes.id }).from(disputes).where(eq(disputes.status, "open"));
  return rows.length;
}
