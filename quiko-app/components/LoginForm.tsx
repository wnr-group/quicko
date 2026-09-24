"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { sendOtpAction, verifyOtpAction } from "@/app/login/actions";

// Phone-OTP login via custom JWT sessions. Dev uses the mock OTP provider
// (any number, code = DEV_OTP); prod uses MSG91. See lib/otp.ts.
export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+919999900001");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function sendCode() {
    setError(null);
    startTransition(async () => {
      const res = await sendOtpAction(phone);
      if (res.ok) setStep("otp");
      else setError(res.error);
    });
  }

  function verify() {
    setError(null);
    startTransition(async () => {
      const res = await verifyOtpAction(phone, code);
      if (res.ok) {
        if (res.needsOnboarding) {
          router.replace(`/onboarding${next ? `?next=${encodeURIComponent(next)}` : ""}`);
        } else {
          router.replace(next || "/app");
        }
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col px-7 pt-safe">
      <div className="mt-10 grid h-14 w-14 place-items-center rounded-2xl bg-ink text-2xl font-black text-brand">
        Q
      </div>

      <div className="mt-8">
        <h1 className="text-[26px] font-black tracking-tight">
          {step === "phone" ? "Enter your phone" : "Verify your number"}
        </h1>
        <p className="mt-1.5 text-[15px] text-muted">
          {step === "phone"
            ? "We'll text you a one-time code to sign in."
            : `Enter the code sent to ${phone}`}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {step === "phone" ? (
          <input
            inputMode="tel"
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 99999 00001"
            className="w-full rounded-2xl border-2 border-line-strong bg-canvas px-4 py-4 text-lg font-medium tracking-wide outline-none transition-colors focus:border-ink"
          />
        ) : (
          <input
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="––––––"
            className="w-full rounded-2xl border-2 border-line-strong bg-canvas px-4 py-4 text-center text-3xl font-bold tracking-[0.4em] outline-none transition-colors focus:border-ink"
          />
        )}

        {error && (
          <p className="rounded-xl bg-error-soft px-3 py-2 text-sm font-medium text-error">
            {error}
          </p>
        )}

        {step === "phone" ? (
          <Button onClick={sendCode} disabled={pending || phone.length < 8}>
            {pending ? "Sending…" : "Send Code"}
          </Button>
        ) : (
          <>
            <Button onClick={verify} disabled={pending || code.length < 4}>
              {pending ? "Verifying…" : "Verify & Continue"}
            </Button>
            <button
              onClick={() => setStep("phone")}
              className="py-2 text-sm font-semibold text-muted"
            >
              ← Change number
            </button>
          </>
        )}
      </div>

      <div className="mt-auto pb-8">
        <p className="mt-3 px-4 text-center text-[11px] leading-snug text-muted">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="font-semibold text-ink underline">Terms &amp; Conditions</Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-ink underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
