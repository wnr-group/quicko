"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconX } from "@/components/icons";
import { approveKycAction, rejectKycAction } from "@/app/app/actions";

export function KycReviewActions({ kycId }: { kycId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      {rejecting ? (
        <div className="flex flex-col gap-2">
          <input value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional, shown to the user)" maxLength={200}
            className="w-full rounded-xl border border-line px-3 py-2.5 text-[14px] outline-none focus:border-ink" />
          <div className="flex gap-2">
            <button disabled={pending} onClick={() => setRejecting(false)}
              className="flex-1 rounded-xl bg-neutral-100 py-2.5 text-[14px] font-semibold text-ink disabled:opacity-40">
              Cancel
            </button>
            <button disabled={pending} onClick={() => run(() => rejectKycAction(kycId, reason))}
              className="flex-1 rounded-xl bg-error py-2.5 text-[14px] font-semibold text-white disabled:opacity-40">
              Confirm reject
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button disabled={pending} onClick={() => setRejecting(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-100 py-2.5 text-[14px] font-semibold text-ink disabled:opacity-40">
            <IconX width={15} height={15} /> Reject
          </button>
          <button disabled={pending} onClick={() => run(() => approveKycAction(kycId))}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink py-2.5 text-[14px] font-semibold text-white disabled:opacity-40">
            <IconCheck width={15} height={15} /> Approve
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
