// See app/admin/loading.tsx — the support queue is gated and query-backed too,
// so the navigation should commit immediately rather than stall on the fetch.
export default function SupportLoading() {
  return (
    <div aria-busy="true" aria-label="Loading support queue">
      <div className="h-7 w-44 animate-pulse rounded-lg bg-line" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-canvas shadow-card" />
        ))}
      </div>
    </div>
  );
}
