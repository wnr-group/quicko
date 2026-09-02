import { normalizePhone, sendOtp } from "@/lib/otp";
import { ok, bad } from "@/lib/apiAuth";

export async function POST(req: Request) {
  const { phone } = (await req.json().catch(() => ({}))) as { phone?: string };
  const p = normalizePhone(phone ?? "");
  if (p.length < 10 || p.length > 15) return bad("Enter a valid phone number");
  try {
    await sendOtp(p);
    return ok({ ok: true });
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Failed to send code", 502);
  }
}
