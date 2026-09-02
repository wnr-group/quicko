import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { kycVerifications, profiles } from "@/db/schema";
import { notify } from "@/lib/queries/notifications";

export const VERIFIED_LEVEL = 3;

type Result = { ok: true } | { ok: false; error: string };

/** The caller's most recent KYC submission, if any. */
export async function getMyKyc(profileId: string) {
  const [row] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.profileId, profileId))
    .orderBy(desc(kycVerifications.createdAt))
    .limit(1);
  return row ?? null;
}

/** Submit an identity document for review (creates a pending L3 verification). */
export async function submitKyc(
  profileId: string,
  input: { idType: string; idNumber: string; legalName: string },
): Promise<Result> {
  const existing = await getMyKyc(profileId);
  if (existing?.status === "pending") return { ok: false, error: "You already have a submission under review" };
  if (existing?.status === "verified") return { ok: false, error: "You're already verified" };

  await db.insert(kycVerifications).values({
    profileId,
    level: VERIFIED_LEVEL,
    status: "pending",
    idType: input.idType,
    idNumber: input.idNumber,
    legalName: input.legalName,
    provider: "manual",
  });
  return { ok: true };
}

/** Admin: pending submissions with the submitting profile joined in. */
export async function listPendingKyc() {
  return db
    .select({
      kyc: kycVerifications,
      profile: {
        id: profiles.id,
        fullName: profiles.fullName,
        phone: profiles.phone,
        kycLevel: profiles.kycLevel,
      },
    })
    .from(kycVerifications)
    .innerJoin(profiles, eq(kycVerifications.profileId, profiles.id))
    .where(eq(kycVerifications.status, "pending"))
    .orderBy(desc(kycVerifications.createdAt));
}

/** Admin: approve → verified, bump the profile's KYC level, notify the user. */
export async function approveKyc(kycId: string): Promise<Result> {
  return db.transaction(async (tx) => {
    const [k] = await tx.select().from(kycVerifications).where(eq(kycVerifications.id, kycId)).limit(1);
    if (!k) return { ok: false, error: "Submission not found" };
    if (k.status !== "pending") return { ok: false, error: "Already reviewed" };

    await tx
      .update(kycVerifications)
      .set({ status: "verified", reviewedAt: new Date() })
      .where(eq(kycVerifications.id, kycId));
    await tx
      .update(profiles)
      .set({ kycLevel: k.level, updatedAt: new Date() })
      .where(eq(profiles.id, k.profileId));
    await notify(tx, {
      profileId: k.profileId,
      type: "kyc",
      title: "You're verified ✅",
      body: "Your identity check passed — you now have a verified badge.",
      href: "/app/verify",
    });
    return { ok: true };
  });
}

/** Admin: reject with an optional note, notify the user. */
export async function rejectKyc(kycId: string, notes?: string): Promise<Result> {
  return db.transaction(async (tx) => {
    const [k] = await tx.select().from(kycVerifications).where(eq(kycVerifications.id, kycId)).limit(1);
    if (!k) return { ok: false, error: "Submission not found" };
    if (k.status !== "pending") return { ok: false, error: "Already reviewed" };

    await tx
      .update(kycVerifications)
      .set({ status: "rejected", notes: notes?.trim() || null, reviewedAt: new Date() })
      .where(eq(kycVerifications.id, kycId));
    await notify(tx, {
      profileId: k.profileId,
      type: "kyc",
      title: "Identity check needs another look",
      body: notes?.trim() || "Your submission couldn't be verified. Please try again.",
      href: "/app/verify",
    });
    return { ok: true };
  });
}

/** Admin dashboard counters. */
export async function countPendingKyc(): Promise<number> {
  const rows = await db
    .select({ id: kycVerifications.id })
    .from(kycVerifications)
    .where(and(eq(kycVerifications.status, "pending")));
  return rows.length;
}
