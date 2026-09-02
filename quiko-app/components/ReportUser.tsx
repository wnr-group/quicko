"use client";

import { useState, useTransition } from "react";
import { createReportAction } from "@/app/app/actions";

export function ReportUser({ reportedUserId, matchId }: { reportedUserId: string; matchId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"user" | "prohibited">("user");
  const [detail, setDetail] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createReportAction(reportedUserId, matchId, type, detail);
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Report"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-muted shadow-card active:scale-95"
      >
        ⚑
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[430px] rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="py-4 text-center">
                <p className="text-lg font-black">Thanks for the report</p>
                <p className="mt-1 text-sm text-muted">Our safety team will review it.</p>
                <button onClick={() => setOpen(false)} className="mt-4 w-full rounded-2xl bg-ink py-3 text-[15px] font-semibold text-white">Close</button>
              </div>
            ) : (
              <>
                <p className="text-lg font-black">Report a problem</p>
                {error && <p className="mt-1 text-[13px] font-medium text-error">{error}</p>}
                <div className="mt-3 flex gap-2">
                  <TypeBtn active={type === "user"} onClick={() => setType("user")}>Behaviour</TypeBtn>
                  <TypeBtn active={type === "prohibited"} onClick={() => setType("prohibited")}>Prohibited item</TypeBtn>
                </div>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  rows={3}
                  placeholder="Tell us what happened…"
                  className="mt-3 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-[15px] outline-none focus:border-ink"
                />
                <button
                  onClick={submit}
                  disabled={pending || detail.trim().length < 3}
                  className="mt-3 w-full rounded-2xl bg-ink py-3 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-40"
                >
                  {pending ? "Sending…" : "Submit report"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TypeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex-1 rounded-xl px-3 py-2 text-[13px] font-semibold ${active ? "bg-ink text-white" : "bg-neutral-100 text-ink"}`}>
      {children}
    </button>
  );
}
