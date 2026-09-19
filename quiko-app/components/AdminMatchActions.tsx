"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { matchMoneyAction, dismissDisputeAction } from "@/app/app/actions";

const HELD = ["paid", "picked_up", "in_transit", "disputed"];

export function AdminMatchActions({ matchId, status, admin }: { matchId: string; status: string; admin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const held = HELD.includes(status);
  const canCancel = status === "confirmed";
  const done = status === "completed" || status === "cancelled";

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else {
        setConfirm(null);
        router.refresh();
      }
    });
  }
  const act = (action: "refund" | "release" | "hold" | "cancel") => run(() => matchMoneyAction(matchId, action));

  if (done) {
    return (
      <div className="mt-3 rounded-2xl bg-canvas p-4 text-[13px] text-muted shadow-card">
        This match is {status}. No further money actions.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl bg-canvas p-4 shadow-card">
      <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">Ops actions</h2>
      {error && <p className="mb-2 text-[13px] font-medium text-error">{error}</p>}

      {confirm ? (
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold">
            {confirm === "refund" && "Refund the sender in full and cancel this match?"}
            {confirm === "release" && "Release the full escrow to the traveller and complete this match?"}
            {confirm === "hold" && "Freeze this match for review (mark disputed)?"}
            {confirm === "cancel" && "Cancel this match and reopen the package?"}
          </p>
          <div className="flex gap-2">
            <button onClick={() => act(confirm as "refund")} disabled={pending}
              className="rounded-xl bg-ink px-3.5 py-2 text-[13px] font-semibold text-white active:scale-95 disabled:opacity-40">
              {pending ? "Working…" : "Confirm"}
            </button>
            <button onClick={() => setConfirm(null)} disabled={pending}
              className="rounded-xl bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-brand-soft">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {/* Money actions — admin only */}
          {admin && held && (
            <>
              <Btn tone="error" onClick={() => setConfirm("refund")}>Refund sender</Btn>
              <Btn tone="success" onClick={() => setConfirm("release")}>Release to traveller</Btn>
              {status !== "disputed" && <Btn tone="ink" onClick={() => setConfirm("hold")}>Hold / dispute</Btn>}
            </>
          )}
          {admin && canCancel && <Btn tone="ink" onClick={() => setConfirm("cancel")}>Cancel match</Btn>}

          {/* Dismiss a dispute — support may do this too */}
          {status === "disputed" && (
            <button
              onClick={() => run(() => dismissDisputeAction(matchId))}
              disabled={pending}
              className="rounded-xl bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-brand-soft disabled:opacity-40"
            >
              Dismiss (no action)
            </button>
          )}

          {((admin && !held && !canCancel) || (!admin && status !== "disputed")) && (
            <p className="text-[13px] text-muted">
              {admin ? "No money actions available in this state." : "No actions here — money actions are admin-only."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Btn({ tone, onClick, children }: { tone: "error" | "success" | "ink"; onClick: () => void; children: React.ReactNode }) {
  const bg = tone === "error" ? "bg-error" : tone === "success" ? "bg-success" : "bg-ink";
  return (
    <button onClick={onClick} className={`rounded-xl ${bg} px-3.5 py-2 text-[13px] font-semibold text-white active:scale-95`}>
      {children}
    </button>
  );
}
