"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconX } from "@/components/icons";
import { acceptOfferAction, declineOfferAction } from "@/app/app/actions";

type Res = { ok: true } | { ok: false; error: string };

export function SenderRequestActions({ requestId, packageId }: { requestId: string; packageId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<Res>) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() => run(() => declineOfferAction(requestId, packageId))}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-neutral-100 py-3 text-[15px] font-semibold text-ink disabled:opacity-40"
        >
          <IconX width={16} height={16} /> Decline
        </button>
        <button
          disabled={pending}
          onClick={() => run(() => acceptOfferAction(requestId, packageId))}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-ink py-3 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          <IconCheck width={16} height={16} /> Accept
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
