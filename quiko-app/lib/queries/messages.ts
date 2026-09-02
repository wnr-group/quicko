import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, matches, packages, profiles } from "@/db/schema";
import { notify } from "@/lib/queries/notifications";
import { containsPhoneNumber } from "@/core/moderation";
import { autoFlagContact } from "@/lib/queries/reports";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * The chat thread for a match, authorized to a participant (sender OR traveler).
 * Returns the match, the counterpart's profile, the package route, and messages.
 */
export async function getMatchThread(matchId: string, userId: string) {
  const [m] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!m) return null;
  if (m.senderId !== userId && m.travelerId !== userId) return null;

  const counterpartId = m.senderId === userId ? m.travelerId : m.senderId;
  const [counterpart] = await db
    .select({ id: profiles.id, fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.id, counterpartId))
    .limit(1);
  const [pkg] = await db
    .select({ fromCity: packages.fromCity, toCity: packages.toCity })
    .from(packages)
    .where(eq(packages.id, m.packageId))
    .limit(1);

  const thread = await db
    .select()
    .from(messages)
    .where(eq(messages.matchId, matchId))
    .orderBy(asc(messages.createdAt));

  return {
    match: m,
    myId: userId,
    role: m.senderId === userId ? ("sender" as const) : ("traveler" as const),
    counterpart: counterpart ?? { id: counterpartId, fullName: null },
    route: pkg ?? { fromCity: "", toCity: "" },
    messages: thread,
  };
}

/** Post a message to a match thread (participant only) + notify the counterpart. */
export async function sendMessage(
  matchId: string,
  senderId: string,
  body: string,
): Promise<Result<{ id: string }>> {
  const text = body.trim();
  if (!text) return { ok: false, error: "Message is empty" };
  if (text.length > 1000) return { ok: false, error: "Message too long" };

  return db.transaction(async (tx) => {
    const [m] = await tx.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!m) return { ok: false, error: "Match not found" };
    if (m.senderId !== senderId && m.travelerId !== senderId) return { ok: false, error: "Not allowed" };

    // Block contact-sharing and flag it for moderation (repeat offenders surface in /admin/moderation).
    if (containsPhoneNumber(text)) {
      await autoFlagContact(tx, senderId, matchId);
      return { ok: false, error: "For your safety, phone numbers can't be shared in chat. Keep everything inside Quiko." };
    }

    const [row] = await tx
      .insert(messages)
      .values({ matchId, senderId, body: text })
      .returning({ id: messages.id });

    const [me] = await tx
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, senderId))
      .limit(1);
    const recipient = m.senderId === senderId ? m.travelerId : m.senderId;
    await notify(tx, {
      profileId: recipient,
      type: "message",
      title: `New message from ${me?.fullName ?? "your match"}`,
      body: text.length > 80 ? `${text.slice(0, 80)}…` : text,
      href: `/app/chat/${matchId}`,
    });

    return { ok: true, value: { id: row.id } };
  });
}

/** Share a location pin in the chat (safe coordination — phone numbers are blocked). */
export async function sendLocationMessage(
  matchId: string,
  senderId: string,
  lat: number,
  lng: number,
  label: string,
): Promise<Result<{ id: string }>> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { ok: false, error: "Invalid location" };
  }
  const clean = (label ?? "").trim().slice(0, 120) || "Shared location";
  return db.transaction(async (tx) => {
    const [m] = await tx.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!m) return { ok: false, error: "Match not found" };
    if (m.senderId !== senderId && m.travelerId !== senderId) return { ok: false, error: "Not allowed" };

    const [row] = await tx
      .insert(messages)
      .values({ matchId, senderId, lat, lng, locationLabel: clean })
      .returning({ id: messages.id });

    const [me] = await tx.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, senderId)).limit(1);
    const recipient = m.senderId === senderId ? m.travelerId : m.senderId;
    await notify(tx, {
      profileId: recipient,
      type: "message",
      title: `${me?.fullName ?? "Your match"} shared a location`,
      body: clean,
      href: `/app/chat/${matchId}`,
    });
    return { ok: true, value: { id: row.id } };
  });
}
