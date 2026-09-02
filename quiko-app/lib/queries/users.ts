import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, ratings } from "@/db/schema";

/** Public traveller trust profile: stats + written reviews from past senders. */
export async function getTravelerProfile(travelerId: string) {
  const [profile] = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      avatar: profiles.avatar,
      ratingAvg: profiles.ratingAvg,
      deliveriesCount: profiles.deliveriesCount,
      trustScore: profiles.trustScore,
      kycLevel: profiles.kycLevel,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.id, travelerId))
    .limit(1);
  if (!profile) return null;

  const reviews = await db
    .select({
      id: ratings.id,
      overall: ratings.overall,
      comment: ratings.comment,
      createdAt: ratings.createdAt,
      raterName: profiles.fullName,
    })
    .from(ratings)
    .innerJoin(profiles, eq(ratings.raterId, profiles.id))
    .where(eq(ratings.rateeId, travelerId))
    .orderBy(desc(ratings.createdAt))
    .limit(20);

  return { profile, reviews };
}

// Find-or-create a profile by phone (the login identity). Runs on OTP verify.
export async function upsertProfileByPhone(phone: string) {
  const [row] = await db
    .insert(profiles)
    .values({ phone })
    .onConflictDoUpdate({
      target: profiles.phone,
      set: { updatedAt: new Date() },
    })
    .returning();
  return row;
}

/** Save registration details. Only provided fields are updated. */
export async function updateProfile(
  id: string,
  data: { fullName?: string; email?: string | null; avatar?: string | null },
) {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (data.fullName !== undefined) patch.fullName = data.fullName;
  if (data.email !== undefined) patch.email = data.email;
  if (data.avatar !== undefined) patch.avatar = data.avatar;
  const [row] = await db.update(profiles).set(patch).where(eq(profiles.id, id)).returning();
  return row ?? null;
}
