"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconArrowRight } from "@/components/icons";
import { sendSupportMessageAction, setMySupportStatusAction } from "@/app/app/actions";

type Msg = { id: string; fromStaff: boolean; body: string };

export function SupportChat({
  messages,
  threadId,
  status,
  prefill = "",
}: {
  messages: Msg[];
  threadId: string | null;
  status: "open" | "closed" | null;
  prefill?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(prefill);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function send() {
    const body = text.trim();
    if (!body || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await sendSupportMessageAction(body);
      if (res.ok) {
        setText("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function setStatus(next: "open" | "closed") {
    if (!threadId || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await setMySupportStatusAction(threadId, next);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {threadId && (
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${status === "closed" ? "bg-surface text-muted" : "bg-brand text-ink"}`}>
            {status === "closed" ? "Resolved" : "Open"}
          </span>
          <button
            onClick={() => setStatus(status === "closed" ? "open" : "closed")}
            disabled={pending}
            className="text-[13px] font-semibold text-muted hover:text-ink disabled:opacity-40"
          >
            {status === "closed" ? "Reopen" : "Mark resolved →"}
          </button>
        </div>
      )}
      {messages.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line-strong bg-surface p-6 text-center text-sm text-muted">
          Tell us what you need help with — the Quiko team will reply here.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.fromStaff ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[14px] ${
                  m.fromStaff ? "rounded-bl-sm bg-canvas text-ink shadow-card" : "rounded-br-sm bg-brand text-ink"
                }`}
              >
                {m.fromStaff && <div className="mb-0.5 text-[11px] font-bold text-brand-strong">Quiko Support</div>}
                {m.body}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-[12px] text-error">{error}</p>}

      <div className="sticky bottom-3 mt-1 flex items-end gap-2 rounded-2xl border border-line bg-white p-2 shadow-card">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Message support…"
          maxLength={2000}
          className="max-h-28 min-h-10 flex-1 resize-none rounded-xl bg-surface px-3.5 py-2 text-[15px] outline-none"
        />
        <button
          onClick={send}
          disabled={pending || !text.trim()}
          aria-label="Send"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-ink active:scale-95 disabled:opacity-40"
        >
          <IconArrowRight width={18} height={18} />
        </button>
      </div>
    </div>
  );
}
