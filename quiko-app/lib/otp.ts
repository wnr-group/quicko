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
export function normalizePhone(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2); // 00 international prefix
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1); // national trunk prefix
  if (d.length === 10 && /^[6-9]/.test(d)) d = `91${d}`; // bare Indian mobile
  return d;
}

interface OtpProvider {
  send(phone: string): Promise<void>;
  verify(phone: string, code: string): Promise<boolean>;
}

const mock: OtpProvider = {
  async send(phone) {
    console.log(`[dev-otp] code for ${phone} = ${process.env.DEV_OTP ?? "123456"}`);
  },
  async verify(_phone, code) {
    return code === (process.env.DEV_OTP ?? "123456");
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
