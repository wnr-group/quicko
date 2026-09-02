"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { normalizePhone, sendOtp, verifyOtp } from "@/lib/otp";
import { upsertProfileByPhone } from "@/lib/queries/users";
import { createSession, destroySession } from "@/lib/session";

export type AuthResult = { ok: true } | { ok: false; error: string };

const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine((p) => p.length >= 10 && p.length <= 15, "Enter a valid phone number");

export async function sendOtpAction(phoneRaw: string): Promise<AuthResult> {
  const parsed = phoneSchema.safeParse(phoneRaw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    await sendOtp(parsed.data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send code" };
  }
}

export async function verifyOtpAction(
  phoneRaw: string,
  code: string,
): Promise<{ ok: true; needsOnboarding: boolean } | { ok: false; error: string }> {
  const parsed = phoneSchema.safeParse(phoneRaw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const valid = await verifyOtp(parsed.data, code.trim());
  if (!valid) return { ok: false, error: "Invalid or expired code" };

  const profile = await upsertProfileByPhone(parsed.data);
  await createSession(profile.id);
  return { ok: true, needsOnboarding: !profile.fullName };
}

export async function signOutAction() {
  await destroySession();
  redirect("/");
}
