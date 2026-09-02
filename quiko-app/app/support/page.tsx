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
        <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 text-[13px] font-semibold">
          <Tab href="/support" label="Open" active={tab === "open"} />
          <Tab href="/support?status=closed" label="Closed" active={tab === "closed"} />
        </div>
      </div>

      {threads.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center text-sm text-muted">
          {tab === "open" ? "No open tickets. 🎉" : "No closed tickets."}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {threads.map(({ thread, user, last }) => (
            <Link
              key={thread.id}
              href={`/support/${thread.id}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card active:scale-[0.99]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">
                {initials(user.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{user.fullName ?? formatPhone(user.phone)}</span>
                  {last && !last.fromStaff && (
                    <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-ink">NEEDS REPLY</span>
                  )}
                </div>
                <div className="truncate text-[13px] text-muted">
                  {last ? `${last.fromStaff ? "You: " : ""}${last.body}` : "—"}
                </div>
              </div>
              <span className="shrink-0 text-[12px] text-muted">{timeAgo(thread.lastMessageAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`rounded-lg px-3 py-1.5 ${active ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
      {label}
    </Link>
  );
}
