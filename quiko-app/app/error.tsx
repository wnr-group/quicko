"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";

// Root boundary. A segment's own error.tsx does NOT wrap the layout above it
// in the same segment, so a gate like requireSupport() failing inside
// app/admin/layout.tsx lands here rather than in app/admin/error.tsx. Without
// this the user got a bare 500 — or, before db/index.ts grew a query deadline,
// a streamed response that simply never ended.
export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[app] render failed:", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-5">
      <div className="w-full max-w-sm rounded-3xl bg-canvas p-6 text-center shadow-card">
        <h1 className="text-lg font-black tracking-tight">Something went wrong</h1>
        <p className="mt-1.5 text-sm text-muted">
          We couldn&rsquo;t finish loading that. It&rsquo;s usually temporary — try again.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-4 w-full rounded-2xl bg-ink px-4 py-3 text-[15px] font-semibold text-brand shadow-ink transition-transform active:scale-[0.99]"
        >
          Try again
        </button>
        <a
          href="/app"
          className="mt-2.5 block rounded-2xl border border-line-strong px-4 py-3 text-[15px] font-semibold text-ink transition-colors hover:bg-brand-soft"
        >
          Back to app
        </a>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-muted">ref {error.digest}</p>
        )}
      </div>
    </main>
  );
}
