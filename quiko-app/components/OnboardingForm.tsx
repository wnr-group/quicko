"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { completeOnboardingAction } from "@/app/onboarding/actions";
import { formatPhone, initials } from "@/core/format";

export function OnboardingForm({
  phone,
  next,
}: {
  phone: string | null;
  next?: string;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboardingAction({ fullName, email, next });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-1 flex-col px-7 pt-safe">
      <div className="mt-10 flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-lg font-bold text-brand">
          {initials(fullName, "Q")}
        </span>
        <div>
          <p className="text-[13px] text-muted">Signed in as</p>
          <p className="font-bold">{formatPhone(phone)}</p>
        </div>
      </div>

      <div className="mt-8">
        <h1 className="text-[26px] font-black tracking-tight">Create your profile</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          Just two things so senders and travelers know who they&rsquo;re dealing with.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <input
          autoFocus
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          maxLength={60}
          className="w-full rounded-2xl border border-line bg-white px-4 py-4 text-lg font-medium shadow-card outline-none focus:border-ink"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputMode="email"
          placeholder="Email address"
          maxLength={120}
          className="w-full rounded-2xl border border-line bg-white px-4 py-4 text-lg font-medium shadow-card outline-none focus:border-ink"
        />
        {error && (
          <p className="rounded-xl bg-error-soft px-3 py-2 text-sm font-medium text-error">
            {error}
          </p>
        )}
        <Button onClick={submit} disabled={pending || fullName.trim().length < 2 || !emailOk}>
          {pending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
