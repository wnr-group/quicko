// Shown while the dashboard's queries resolve. Without it the whole console
// sits behind the page render, so clicking "Open admin panel" looks like a
// dead button on a slow database instead of a console that is loading.
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading console">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-line" />
      <div className="mt-2 h-4 w-56 animate-pulse rounded bg-line" />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border-l-2 border-line bg-canvas px-3.5 py-3 shadow-card">
            <div className="h-3 w-14 animate-pulse rounded bg-line" />
            <div className="mt-2 h-6 w-10 animate-pulse rounded bg-line" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl bg-canvas shadow-card" />
        ))}
      </div>
    </div>
  );
}
