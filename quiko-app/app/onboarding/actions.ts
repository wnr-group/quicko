"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { updateProfile } from "@/lib/queries/users";
import { profileSchema } from "@/lib/validation";

// The profile fields come from the shared schema; `next` is onboarding-only.
const schema = profileSchema.extend({
  next: z.string().optional(),
});

export type OnboardResult = { ok: false; error: string };

// Only allow internal return paths (no open redirects).
function safeNext(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
}

// Uses getAuthUser (session only) — NOT requireUser, which would loop here.
export async function completeOnboardingAction(input: {
  fullName: string;
  email: string;
  next?: string;
}): Promise<OnboardResult | void> {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await updateProfile(user.id, {
    fullName: parsed.data.fullName,
    email: parsed.data.email,
  });
  redirect(safeNext(parsed.data.next));
}
