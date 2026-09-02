"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMatchAction } from "@/app/app/actions";

export function CancelMatchButton({
  matchId,
  packageId,
  status,
}: {
  matchId: string;
  packageId: string;
  status: string;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Only cancellable before pickup.
  if (status !== "confirmed" && status !== "paid") return null;
  const paid = status === "paid";

  function go() {
    setError(null);
    startTransition(async () => {
      const res = await cancelMatchAction(matchId, packageId);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)} className="mt-3 self-center text-[13px] font-semibold text-muted underline">
        Cancel this match
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-2xl bg-neutral-50 p-3 text-center">
      <p className="text-[13px] font-semibold text-ink">
        {paid ? "Cancel and refund the payment?" : "Cancel this match?"}
      </p>
      {error && <p className="mt-1 text-[12px] font-medium text-error">{error}</p>}
      <div className="mt-2 flex justify-center gap-2">
        <button onClick={go} disabled={pending} className="rounded-xl bg-error px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40">
          {pending ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button onClick={() => setConfirm(false)} disabled={pending} className="rounded-xl bg-neutral-200 px-4 py-2 text-[13px] font-semibold text-ink">
          Keep it
        </button>
      </div>
    </div>
  );
}
