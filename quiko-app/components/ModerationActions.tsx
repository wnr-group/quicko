"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actionReportAction } from "@/app/app/actions";

export function ModerationActions({ reportId, canSuspend, admin }: { reportId: string; canSuspend: boolean; admin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function act(action: "warn" | "suspend" | "dismiss") {
    setError(null);
    startTransition(async () => {
      const res = await actionReportAction(reportId, action);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {error && <span className="text-[12px] font-medium text-error">{error}</span>}
      <button onClick={() => act("warn")} disabled={pending || !canSuspend}
        className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-bold text-ink active:scale-95 disabled:opacity-40">
        Warn
      </button>
      {admin && (
        <button onClick={() => act("suspend")} disabled={pending || !canSuspend}
          className="rounded-lg bg-error px-3 py-1.5 text-[12px] font-bold text-white active:scale-95 disabled:opacity-40">
          Suspend
        </button>
      )}
      <button onClick={() => act("dismiss")} disabled={pending}
        className="rounded-lg bg-neutral-100 px-3 py-1.5 text-[12px] font-bold text-ink active:scale-95 disabled:opacity-40">
        Dismiss
      </button>
    </div>
  );
}
