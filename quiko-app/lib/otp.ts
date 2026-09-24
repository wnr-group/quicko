import "server-only";

// OTP provider seam. Dev (no MSG91_AUTH_KEY) → mock: any number, code = DEV_OTP.
// Prod (key set) → MSG91's OTP API (generates, sends, and verifies server-side).
// Swapping SMS providers later means editing only this file.

/**
 * Canonical E.164 digits, e.g. "919999900001".
 *
 * Phone IS the login identity (`profiles.phone`), so the same person typing
 * "98765 43210", "+91 98765 43210" or "098765 43210" must resolve to ONE
 * profile — otherwise they silently end up with duplicate accounts holding
 * separate packages, trips, ratings and wallet balances.
 */
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  let d = digits;
  if (d.startsWith("00")) d = d.slice(2); // 00 international prefix
  // Peel country-code and trunk prefixes until a bare 10-digit mobile is left.
  // A single pass isn't enough: the login field is pre-filled with "+91", so a
  // user pasting their own "919000000003" over it submits "91919000000003" and
  // silently lands on a SECOND profile. Looping folds "+91 91900…", "+91 0 900…"
  // and "0091 900…" onto the same identity.
  while (!INDIAN_MOBILE.test(d) && d.length > 10) {
    if (d.startsWith("91")) d = d.slice(2);
    else if (d.startsWith("0")) d = d.slice(1);
    else break; // not an Indian number — leave it alone
  }
  // Only rewrite when the peeling actually produced a valid mobile. Anything
  // else (a foreign number, a malformed one) is returned exactly as typed, so
  // existing accounts keyed on an odd string keep working.
  return INDIAN_MOBILE.test(d) ? `91${d}` : digits;
}

interface OtpProvider {
  send(phone: string): Promise<void>;
  verify(phone: string, code: string): Promise<boolean>;
}

const mock: OtpProvider = {
  async send(phone) {
    console.log(`[dev-otp] code for ${phone} = ${process.env.DEV_OTP ?? "3456"}`);
  },
  async verify(_phone, code) {
    return code === (process.env.DEV_OTP ?? "3456");
  },
};

const msg91: OtpProvider = {
  async send(phone) {
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("mobile", phone);
    url.searchParams.set("template_id", process.env.MSG91_TEMPLATE_ID ?? "");
    if (process.env.MSG91_SENDER_ID) {
      url.searchParams.set("sender", process.env.MSG91_SENDER_ID);
    }
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authkey: process.env.MSG91_AUTH_KEY!,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json().catch(() => ({}));
    if (data?.type !== "success") {
      throw new Error(data?.message || "Failed to send OTP");
    }
  },
  async verify(phone, code) {
    const url = new URL("https://control.msg91.com/api/v5/otp/verify");
    url.searchParams.set("mobile", phone);
    url.searchParams.set("otp", code);
    const res = await fetch(url, {
      headers: { authkey: process.env.MSG91_AUTH_KEY! },
    });
    const data = await res.json().catch(() => ({}));
    return data?.type === "success";
  },
};

function provider(): OtpProvider {
  return process.env.MSG91_AUTH_KEY ? msg91 : mock;
}

export const sendOtp = (phone: string) => provider().send(phone);
export const verifyOtp = (phone: string, code: string) =>
  provider().verify(phone, code);
