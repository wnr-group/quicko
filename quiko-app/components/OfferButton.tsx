"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconCheck } from "@/components/icons";
import { inr } from "@/core/format";
import { offerToCarryAction } from "@/app/app/actions";

export function OfferButton({
  tripId,
  packageId,
  price,
}: {
  tripId: string;
  packageId: string;
  price: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [offered, setOffered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function offer() {
    setError(null);
    startTransition(async () => {
      const res = await offerToCarryAction(tripId, packageId);
      if (res.ok) {
        setOffered(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (offered) {
    return (
      <div className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl bg-success-soft py-3 text-[15px] font-semibold text-success">
        <IconCheck width={16} height={16} /> Offer sent
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        onClick={offer}
        disabled={pending}
        className="w-full rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-40"
      >
        {pending ? "Sending…" : `Offer to carry · ${inr(price)}`}
      </button>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
