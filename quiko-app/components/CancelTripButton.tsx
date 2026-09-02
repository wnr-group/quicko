"use client";

import { useState, useTransition } from "react";
import { deleteTripAction } from "@/app/app/actions";
import { IconX } from "@/components/icons";

export function CancelTripButton({ tripId }: { tripId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteTripAction(tripId);
      if (res && !res.ok) {
        setError(res.error);
        setConfirming(false);
      }
    });
  }

  return (
    <div>
      <button onClick={onClick} disabled={pending}
        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition-colors ${
          confirming ? "bg-error text-white" : "bg-error-soft text-error"
        }`}>
        {!confirming && <IconX width={16} height={16} />}
        {pending ? "Cancelling…" : confirming ? "Tap again to confirm" : "Cancel trip"}
      </button>
      {error && <p className="mt-2 text-center text-sm text-error">{error}</p>}
    </div>
  );
}
