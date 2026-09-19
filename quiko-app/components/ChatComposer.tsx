"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { IconArrowRight, IconMapPin } from "@/components/icons";
import { sendMessageAction, sendLocationAction } from "@/app/app/actions";
import type { PinnedLocation } from "@/core/geo";

const LocationSheet = dynamic(() => import("@/components/LocationSheet"), { ssr: false });

/** Coordinating a handover is a small, predictable set of messages — offering
 *  them as chips beats typing the same thing on a phone every time. */
const QUICK_REPLIES = [
  "On my way",
  "I've arrived",
  "Running late",
  "Where exactly?",
  "Thanks!",
];

export function ChatComposer({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function send() {
    const body = text.trim();
    if (!body || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await sendMessageAction(matchId, body);
      if (res.ok) {
        setText("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function shareLocation(loc: PinnedLocation) {
    setSheet(false);
    setError(null);
    startTransition(async () => {
      const res = await sendLocationAction(matchId, loc.lat, loc.lng, loc.label);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="pb-safe border-t border-line bg-canvas px-3 pt-2">
      {error && <p className="px-2 pb-1 text-[12px] text-error">{error}</p>}

      {/* Tapping fills the box rather than sending, so a mistap costs nothing. */}
      {!text.trim() && (
        <div className="no-scrollbar -mx-3 mb-2 flex gap-2 overflow-x-auto px-3">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setText(q)}
              className="shrink-0 rounded-full border border-line-strong bg-canvas px-3 py-1.5 text-[13px] font-semibold text-ink transition-colors active:scale-95 hover:border-ink hover:bg-brand-soft"
            >
              {q}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={() => setSheet(true)}
          disabled={pending}
          aria-label="Share location"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-strong bg-canvas text-ink transition-colors active:scale-95 hover:bg-brand-soft disabled:opacity-40"
        >
          <IconMapPin width={20} height={20} />
        </button>
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
          placeholder="Message…"
          maxLength={1000}
          className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-ink focus:bg-canvas"
        />
        <button
          onClick={send}
          disabled={pending || !text.trim()}
          aria-label="Send"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-ink shadow-brand transition-colors active:scale-95 enabled:hover:bg-brand-strong disabled:bg-surface disabled:text-muted disabled:shadow-none"
        >
          <IconArrowRight width={20} height={20} />
        </button>
      </div>

      {sheet && (
        <LocationSheet which="from" initial={null} onConfirm={shareLocation} onClose={() => setSheet(false)} />
      )}
    </div>
  );
}
