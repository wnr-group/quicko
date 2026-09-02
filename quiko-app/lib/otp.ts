import "server-only";

// OTP provider seam. Dev (no MSG91_AUTH_KEY) → mock: any number, code = DEV_OTP.
// Prod (key set) → MSG91's OTP API (generates, sends, and verifies server-side).
// Swapping SMS providers later means editing only this file.

export function normalizePhone(input: string): string {
  return input.replace(/\D/g, ""); // E.164 digits, e.g. "919999900001"
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
