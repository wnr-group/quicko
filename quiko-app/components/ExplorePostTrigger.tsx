"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFromExploreAction } from "@/app/app/actions";
import type { SendParams } from "@/lib/sendParams";

// Step 2 is the last step: tapping a traveller (or "notify me") posts the package
// right here. Signed-out / unregistered users are sent to `gate` (login or
// onboarding) first and land back on Explore, ready to tap again.
export function ExplorePostTrigger({
  params, tripId, gate, className, children,
}: {
  params: SendParams;
  tripId?: string;
  gate: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function post() {
    if (gate) { router.push(gate); return; }
    setError(null);
    startTransition(async () => {
      const res = await createFromExploreAction(
        {
          fromLabel: params.from.label, fromLat: params.from.lat, fromLng: params.from.lng,
          toLabel: params.to.label, toLat: params.to.lat, toLng: params.to.lng,
          travelDate: params.dateFrom, dateTo: params.dateTo,
          weightKg: params.weightKg, timePreference: params.timePreference,
          // The server sets the tier and price from the chosen traveller's arrival date.
          offerPrice: 1_000_000,
        },
        tripId,
      );
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <>
      <button type="button" onClick={post} disabled={pending}
        className={`${className ?? ""} ${pending ? "opacity-60" : ""}`}>
        {pending ? "Posting…" : children}
      </button>
      {error && (
        <p className="pointer-events-auto mt-2 w-full rounded-xl bg-error-soft px-3 py-2 text-sm font-medium text-error">{error}</p>
      )}
    </>
  );
}
