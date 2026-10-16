"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptRequestAction, declineRequestAction, acceptOfferAction, declineOfferAction,
  getIncomingAction,
} from "@/app/app/actions";
import { IconArrowRight, IconCheck, IconX } from "@/components/icons";
import { inr, dateShort, initials, placeShort } from "@/core/format";
import type { IncomingItem } from "@/lib/queries/requests";

const POLL_MS = 20_000;
const SEEN_KEY = "quiko_incoming_snoozed";

function readSnoozed(): string[] {
  try { return JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]"); } catch { return []; }
}

// Pops up on the main page for anything waiting on the user's answer — requests
// from senders (traveller side) and offers from travellers (sender side). New
// ones appear while the page is open (polled; also on tab focus). "Later" snoozes
// an item for this session so it doesn't nag; the bell and detail pages still list it.
export function IncomingRequestsPopup({ initial }: { initial: IncomingItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [snoozed, setSnoozed] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const live = useRef(true);

  useEffect(() => {
    // sessionStorage is client-only, so restore after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnoozed(readSnoozed());
    live.current = true;
    return () => { live.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await getIncomingAction();
      if (live.current) setItems(next);
    } catch {}
  }, []);

  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh]);

  const queue = items.filter((i) => !snoozed.includes(i.id));
  const current = queue[0];
  if (!current) return null;

  function snooze(id: string) {
    const next = [...snoozed, id];
    setSnoozed(next);
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(next)); } catch {}
    setError(null);
  }

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, goTo?: string) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) { setError(r.error); return; }
      await refresh();
      if (goTo) router.push(goTo); else router.refresh();
    });
  }

  const isRequest = current.kind === "request";
  const dest = isRequest ? `/app/travel/trips/${current.tripId}` : `/app/packages/${current.packageId}`;

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-ink/50 px-4 pb-6"
      role="dialog" aria-modal="true" aria-label="New request">
      <div className="w-full max-w-[400px] rounded-3xl bg-canvas p-5 shadow-pop">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-brand">
            {initials(current.who)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
              {isRequest ? "New delivery request" : "New offer to carry"}
              {queue.length > 1 && ` · 1 of ${queue.length}`}
            </p>
            <p className="truncate text-[17px] font-black">{current.who}</p>
          </div>
          <span className="text-xl font-black tabular-nums">{inr(current.amount)}</span>
        </div>

        <div className="mt-4 rounded-2xl bg-surface px-4 py-3">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="truncate">{placeShort(current.from)}</span>
            <IconArrowRight width={14} height={14} className="shrink-0 text-muted" />
            <span className="truncate">{placeShort(current.to)}</span>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            {current.weightKg} kg · {dateShort(current.when)}
          </p>
        </div>

        {error && <p className="mt-3 rounded-xl bg-error-soft px-3 py-2 text-sm font-medium text-error">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button type="button" disabled={pending}
            onClick={() => run(() =>
              isRequest
                ? declineRequestAction(current.id, current.tripId)
                : declineOfferAction(current.id, current.packageId))}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-surface py-3 text-[15px] font-semibold text-ink disabled:opacity-40">
            <IconX width={16} height={16} /> Decline
          </button>
          <button type="button" disabled={pending}
            onClick={() => run(() =>
              isRequest
                ? acceptRequestAction(current.id, current.tripId)
                : acceptOfferAction(current.id, current.packageId), dest)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-ink py-3 text-[15px] font-semibold text-white disabled:opacity-40">
            <IconCheck width={16} height={16} /> {pending ? "Working…" : "Accept"}
          </button>
        </div>
        <button type="button" disabled={pending} onClick={() => snooze(current.id)}
          className="mt-2 w-full py-2 text-sm font-semibold text-muted">
          Later
        </button>
      </div>
    </div>
  );
}
