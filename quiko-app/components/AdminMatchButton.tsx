"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCreateMatchAction } from "@/app/app/actions";

export function AdminMatchButton({ packageId, tripId }: { packageId: string; tripId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    startTransition(async () => {
      const res = await adminCreateMatchAction(packageId, tripId);
      if (res.ok) router.push(`/admin/matches/${res.matchId}`);
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={go}
        disabled={pending}
        className="rounded-xl bg-ink px-3.5 py-2 text-[13px] font-semibold text-white active:scale-95 disabled:opacity-40"
      >
        {pending ? "Matching…" : "Match"}
      </button>
      {error && <span className="text-[11px] font-medium text-error">{error}</span>}
    </div>
  );
}
