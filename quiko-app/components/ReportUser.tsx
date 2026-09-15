"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { createReportAction } from "@/app/app/actions";
import { IconFlag } from "@/components/icons";

export function ReportUser({ reportedUserId, matchId }: { reportedUserId: string; matchId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"user" | "prohibited">("user");
  const [detail, setDetail] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape, and don't let the page scroll behind the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createReportAction(reportedUserId, matchId, type, detail);
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  const sheet = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Report a problem"
    >
      <div
        className="pb-safe max-h-[85dvh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden="true" className="mx-auto mb-4 block h-1 w-10 rounded-full bg-line-strong" />
        {done ? (
          <div className="py-4 text-center">
            <p className="text-lg font-black">Thanks for the report</p>
            <p className="mt-1 text-sm text-muted">Our safety team will review it.</p>
            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-2xl bg-brand py-3.5 text-[15px] font-bold text-ink shadow-brand transition-colors hover:bg-brand-strong"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="text-lg font-black tracking-tight">Report a problem</p>
            {error && <p className="mt-1 text-[13px] font-medium text-error">{error}</p>}
            <div className="mt-3 flex gap-2">
              <TypeBtn active={type === "user"} onClick={() => setType("user")}>
                Behaviour
              </TypeBtn>
              <TypeBtn active={type === "prohibited"} onClick={() => setType("prohibited")}>
                Prohibited item
              </TypeBtn>
            </div>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              placeholder="Tell us what happened…"
              className="mt-3 w-full resize-none rounded-xl border border-line-strong px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-ink"
            />
            <button
              onClick={submit}
              disabled={pending || detail.trim().length < 3}
              className="mt-3 w-full rounded-2xl bg-brand py-3.5 text-[15px] font-bold text-ink shadow-brand transition-all active:scale-[0.98] enabled:hover:bg-brand-strong disabled:bg-surface disabled:text-muted disabled:shadow-none"
            >
              {pending ? "Sending…" : "Submit report"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 w-full rounded-2xl py-2.5 text-[14px] font-semibold text-muted transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Report"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line-strong bg-canvas text-ink transition-colors active:scale-95 hover:bg-brand-soft"
      >
        <IconFlag width={17} height={17} />
      </button>

      {/* This button lives in TopBar, which has `backdrop-blur`. A
          backdrop-filter makes an element a containing block for
          `position: fixed` descendants, so the sheet was clipped to the ~65px
          header instead of filling the viewport. Portalling to <body> takes it
          out of that containing block. Safe during SSR: `open` starts false. */}
      {open && typeof document !== "undefined" && createPortal(sheet, document.body)}
    </>
  );
}

function TypeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${
        active ? "bg-brand text-ink" : "bg-surface text-ink hover:bg-brand-soft"
      }`}
    >
      {children}
    </button>
  );
}
