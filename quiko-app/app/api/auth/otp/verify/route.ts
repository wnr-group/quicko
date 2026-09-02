import { normalizePhone, verifyOtp } from "@/lib/otp";
import { upsertProfileByPhone } from "@/lib/queries/users";
import { signToken, ok, bad } from "@/lib/apiAuth";

export async function POST(req: Request) {
  const { phone, code } = (await req.json().catch(() => ({}))) as { phone?: string; code?: string };
  const p = normalizePhone(phone ?? "");
  if (p.length < 10) return bad("Enter a valid phone number");

  const valid = await verifyOtp(p, (code ?? "").trim());
  if (!valid) return bad("Invalid or expired code", 401);

  const profile = await upsertProfileByPhone(p);
  const token = await signToken(profile.id);
  return ok({ token, needsOnboarding: !profile.fullName });
}
