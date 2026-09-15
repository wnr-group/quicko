"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { replySupportAction, setSupportStatusAction } from "@/app/app/actions";

export function SupportReply({ threadId, status }: { threadId: string; status: "open" | "closed" }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, clear = false) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else {
        if (clear) setText("");
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {error && <p className="text-[12px] text-error">{error}</p>}
      <div className="flex items-end gap-2 rounded-2xl border border-line bg-white p-2 shadow-card">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) run(() => replySupportAction(threadId, text.trim()), true);
            }
          }}
          rows={2}
          placeholder="Reply to the customer…"
          maxLength={2000}
          className="max-h-40 min-h-11 flex-1 resize-none rounded-xl bg-surface px-3.5 py-2 text-[15px] outline-none"
        />
        <button
          onClick={() => run(() => replySupportAction(threadId, text.trim()), true)}
          disabled={pending || !text.trim()}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-ink transition-colors active:scale-95 enabled:hover:bg-brand-strong disabled:bg-surface disabled:text-muted"
        >
          Send
        </button>
      </div>
      <button
        onClick={() => run(() => setSupportStatusAction(threadId, status === "open" ? "closed" : "open"))}
        disabled={pending}
        className="self-start text-[13px] font-semibold text-muted hover:text-ink disabled:opacity-40"
      >
        {status === "open" ? "Mark resolved →" : "Reopen ticket"}
      </button>
    </div>
  );
}
