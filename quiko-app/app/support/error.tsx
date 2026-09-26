"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";

// Without this, a query that stalls (a frozen Lambda handed a dead pooler
// socket) leaves the streamed RSC response open and the console simply loads
// forever. db/index.ts now gives queries a deadline; this turns the resulting
// throw into something the user can actually see and retry — a retry lands on
// a fresh invocation with a fresh connection, which normally succeeds.
export default function ConsoleError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[console] render failed:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-canvas p-6 text-center shadow-card">
      <h2 className="text-lg font-black tracking-tight">Couldn&rsquo;t load this page</h2>
      <p className="mt-1.5 text-sm text-muted">
        The database didn&rsquo;t answer in time. This is usually a stale connection
        rather than an outage — trying again normally works.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-4 w-full rounded-2xl bg-ink px-4 py-3 text-[15px] font-semibold text-brand shadow-ink transition-transform active:scale-[0.99]"
      >
        Try again
      </button>
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] text-muted">ref {error.digest}</p>
      )}
    </div>
  );
}
