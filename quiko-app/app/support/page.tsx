import Link from "next/link";
import { listSupportThreads } from "@/lib/queries/support";
import { formatPhone, initials, timeAgo } from "@/core/format";

export default async function SupportQueue({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const tab = status === "closed" ? "closed" : "open";
  const threads = await listSupportThreads(tab);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Support queue</h1>
        <div className="flex gap-1 rounded-xl bg-surface p-1 text-[13px] font-semibold">
          <Tab href="/support" label="Open" active={tab === "open"} />
          <Tab href="/support?status=closed" label="Closed" active={tab === "closed"} />
        </div>
      </div>

      {threads.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted">
          {tab === "open" ? "No open tickets. 🎉" : "No closed tickets."}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {threads.map(({ thread, user, last }) => {
            // A resolved ticket never "needs reply" — the old flag looked only at
            // who sent last, so closed threads were badged for action.
            const needsReply = thread.status === "open" && !!last && !last.fromStaff;
            return (
            <Link
              key={thread.id}
              href={`/support/${thread.id}`}
              className={`grid items-center gap-4 rounded-2xl bg-canvas p-4 shadow-card transition-colors hover:bg-brand-soft lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_140px_auto] ${
                needsReply ? "border-l-2 border-brand" : "border-l-2 border-line"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">
                  {initials(user.fullName)}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-bold">
                    {user.fullName ?? formatPhone(user.phone)}
                  </div>
                  <div className="truncate text-[13px] text-muted">{formatPhone(user.phone)}</div>
                </div>
              </div>

              <div className="min-w-0 truncate text-[13px] text-muted">
                {last ? (
                  <>
                    {last.fromStaff && <span className="font-semibold text-ink">You: </span>}
                    {last.body}
                  </>
                ) : (
                  "—"
                )}
              </div>

              <div>
                {needsReply ? (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink">
                    Needs reply
                  </span>
                ) : thread.status === "closed" ? (
                  <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-success">
                    Resolved
                  </span>
                ) : (
                  <span className="text-[12px] font-semibold text-muted">Awaiting customer</span>
                )}
              </div>

              <span className="shrink-0 text-[12px] tabular-nums text-muted">
                {timeAgo(thread.lastMessageAt)}
              </span>
            </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`rounded-lg px-3 py-1.5 ${active ? "bg-brand text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
      {label}
    </Link>
  );
}
