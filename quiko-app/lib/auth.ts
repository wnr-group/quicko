import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getSession } from "@/lib/session";

// The auth seam. Pages ask "who is the user?" here and never touch the session
// or JWT details directly. Profile data comes from Drizzle.

export const getAuthUser = cache(async () => getSession());

export async function requireUser() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  // A valid session can outlive its profile (e.g. the account/data was removed).
  // Don't show an empty app — force a clean re-login, which re-links the profile.
  const profile = await getProfile();
  if (!profile) redirect("/login");
  // Registration not finished yet → onboarding. (/onboarding itself does not
  // call requireUser, so there is no redirect loop.)
  if (!profile.fullName) redirect("/onboarding");
  // Suspended accounts can't use the app. (/suspended does not call requireUser.)
  if (profile.status === "suspended") redirect("/suspended");
  return user;
}

/** True for admin staff (staffRole 'admin', or the legacy is_admin flag). */
export function isAdminProfile(p: { staffRole?: string | null; isAdmin?: boolean } | null) {
  return !!p && (p.staffRole === "admin" || !!p.isAdmin);
}
/** True for any staff who can use the support console (support OR admin). */
export function isSupportProfile(p: { staffRole?: string | null; isAdmin?: boolean } | null) {
  return !!p && (p.staffRole === "support" || isAdminProfile(p));
}

/** Gate admin pages: must be signed in AND an admin. Returns the profile. */
export async function requireAdmin() {
  await requireUser();
  const profile = await getProfile();
  if (!isAdminProfile(profile)) redirect("/app");
  return profile!;
}

/** Gate the support console: support OR admin. Returns the profile. */
export async function requireSupport() {
  await requireUser();
  const profile = await getProfile();
  if (!isSupportProfile(profile)) redirect("/app");
  return profile!;
}

export const getProfile = cache(async () => {
  const user = await getAuthUser();
  if (!user) return null;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  return profile ?? null;
});
