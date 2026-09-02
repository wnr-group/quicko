"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { IconArrowRight, IconMapPin } from "@/components/icons";
import { sendMessageAction, sendLocationAction } from "@/app/app/actions";
import type { PinnedLocation } from "@/core/geo";

const LocationSheet = dynamic(() => import("@/components/LocationSheet"), { ssr: false });

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
    <div className="pb-safe border-t border-line bg-white px-3 pt-2">
      {error && <p className="px-2 pb-1 text-[12px] text-error">{error}</p>}
      <div className="flex items-end gap-2">
        <button
          onClick={() => setSheet(true)}
          disabled={pending}
          aria-label="Share location"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral-100 text-ink active:scale-95 disabled:opacity-40"
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
          className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-neutral-50 px-4 py-2.5 text-[15px] outline-none focus:border-ink"
        />
        <button
          onClick={send}
          disabled={pending || !text.trim()}
          aria-label="Send"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white active:scale-95 disabled:opacity-40"
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
