"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdrawRequestAction } from "@/app/app/actions";

// Take back a request/offer you sent that hasn't been answered yet. Two taps
// (ask, then confirm) so a stray touch can't retract it.
export function WithdrawRequestButton({
  requestId, packageId, tripId, label = "Withdraw",
}: {
  requestId: string; packageId: string; tripId?: string; label?: string;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function withdraw() {
    setError(null);
    startTransition(async () => {
      const r = await withdrawRequestAction(requestId, packageId, tripId);
      if (r.ok) router.refresh();
      else { setError(r.error); setAsking(false); }
    });
  }

  return (
    <div className="w-full">
      {asking ? (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-[13px] font-semibold text-ink">Withdraw this?</span>
          <button type="button" disabled={pending} onClick={() => setAsking(false)}
            className="rounded-xl bg-surface px-3 py-2 text-[13px] font-semibold text-ink disabled:opacity-40">
            Keep
          </button>
          <button type="button" disabled={pending} onClick={withdraw}
            className="rounded-xl bg-ink px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-40">
            {pending ? "Withdrawing…" : "Yes, withdraw"}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAsking(true)}
          className="w-full rounded-xl bg-surface py-2.5 text-[14px] font-semibold text-ink">
          {label}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
