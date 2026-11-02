"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PinnedLocation } from "@/core/geo";
import { locateCurrent, locateMessage } from "@/components/currentLocation";

export type PickupStatus = "idle" | "locating" | "done" | "failed";

/**
 * Fills the pickup with the user's current location once, when `enabled`.
 * `retry()` forces a fresh fix. Never overwrites a pickup the user already set
 * (onFound is only called while `isEmpty()` is true).
 */
export function useDefaultPickup(
  enabled: boolean,
  isEmpty: () => boolean,
  onFound: (loc: PinnedLocation) => void,
) {
  const [status, setStatus] = useState<PickupStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const alive = useRef(true);
  const cb = useRef({ isEmpty, onFound });
  useEffect(() => { cb.current = { isEmpty, onFound }; });

  const run = useCallback(async (force: boolean) => {
    setStatus("locating");
    setMessage(null);
    const r = await locateCurrent(force);
    if (!alive.current) return;
    if (r.ok) {
      if (cb.current.isEmpty()) cb.current.onFound(r.loc);
      setStatus("done");
    } else {
      setStatus("failed");
      setMessage(locateMessage[r.reason]);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (enabled) void run(false);
    return () => { alive.current = false; };
  }, [enabled, run]);

  return { status, message, retry: () => run(true) };
}
