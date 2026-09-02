import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { matches, transactions } from "@/db/schema";
import { notify } from "@/lib/queries/notifications";
import { logMatchEvent } from "@/lib/queries/matches";
import { payments } from "@/lib/payments";

// Cashfree Easy Split webhooks. Cashfree is the source of truth for money; this
// handler mirrors its events into our DB. Must be idempotent — events can be
// delivered more than once and out of order.
export async function POST(req: Request) {
  const raw = await req.text();
  const headers: Record<string, string> = {
    "x-webhook-signature": req.headers.get("x-webhook-signature") ?? "",
    "x-webhook-timestamp": req.headers.get("x-webhook-timestamp") ?? "",
  };

  const event = payments().verifyWebhook(raw, headers) as
    | { type?: string; data?: { order?: { order_id?: string; order_status?: string } } }
    | null;
  if (!event) return new Response("invalid signature", { status: 401 });

  const type = event.type ?? "";
  const orderId = event.data?.order?.order_id;
  if (!orderId) return Response.json({ ok: true }); // nothing actionable

  // Resolve the match from the escrow_hold we recorded at pay time.
  const [hold] = await db
    .select({ matchId: transactions.matchId, status: transactions.status })
    .from(transactions)
    .where(and(eq(transactions.type, "escrow_hold"), eq(transactions.providerRef, orderId)))
    .limit(1);
  if (!hold) return Response.json({ ok: true });
  const matchId = hold.matchId;

  const paymentPaid = type.includes("PAYMENT_SUCCESS") || event.data?.order?.order_status === "PAID";
  const settlementDone = type.includes("SETTLEMENT") || type.includes("TRANSFER_SUCCESS");

  if (paymentPaid) {
    await db.transaction(async (tx) => {
      const [m] = await tx.select().from(matches).where(eq(matches.id, matchId)).limit(1);
      if (!m || m.status !== "confirmed") return; // idempotent: already advanced
      await tx
        .update(transactions)
        .set({ status: "held" })
        .where(and(eq(transactions.type, "escrow_hold"), eq(transactions.providerRef, orderId)));
      await tx.update(matches).set({ status: "paid", updatedAt: new Date() }).where(eq(matches.id, matchId));
      await logMatchEvent(tx, matchId, "paid");
      await notify(tx, {
        profileId: m.travelerId,
        type: "paid",
        title: "Payment secured 🔒",
        body: "The sender paid into escrow — go pick up the package.",
        href: `/app/travel/trips/${m.tripId}`,
      });
    });
  } else if (settlementDone) {
    // Vendor split released → mark the traveler payout + our commission released.
    await db
      .update(transactions)
      .set({ status: "released" })
      .where(and(eq(transactions.providerRef, orderId), eq(transactions.type, "payout")));
    await db
      .update(transactions)
      .set({ status: "released" })
      .where(and(eq(transactions.providerRef, orderId), eq(transactions.type, "commission")));
  }

  return Response.json({ ok: true });
}
