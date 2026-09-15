import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupportThread } from "@/lib/queries/support";
import { SupportReply } from "@/components/SupportReply";
import { formatPhone, initials, timeAgo } from "@/core/format";

export default async function SupportThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSupportThread(id);
  if (!data) notFound();
  const { thread, user, messages } = data;

  return (
    <div className="mx-auto w-full max-w-[820px]">
      <Link href="/support" className="text-[13px] font-semibold text-muted hover:text-ink">← Queue</Link>

      <div className="mt-3 flex items-center gap-3 rounded-2xl border-l-2 border-brand bg-canvas p-4 shadow-card">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-brand">
          {initials(user.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-black">{user.fullName ?? "—"}</div>
          <div className="text-[13px] text-muted">{formatPhone(user.phone)}</div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            thread.status === "open" ? "bg-brand text-ink" : "bg-surface text-muted"
          }`}
        >
          {thread.status === "open" ? "Open" : "Resolved"}
        </span>
      </div>

      {/* A conversation is read in a column — full-console-width bubbles are
          hard to follow. */}
      <div className="mt-5 flex flex-col gap-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.fromStaff ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[14px] ${
                m.fromStaff ? "rounded-br-sm bg-brand text-ink" : "rounded-bl-sm bg-canvas text-ink shadow-card"
              }`}
            >
              {m.body}
              {/* White on the yellow staff bubble was invisible. */}
              <div className={`mt-1 text-[11px] ${m.fromStaff ? "text-ink/55" : "text-muted"}`}>
                {m.fromStaff ? "You" : user.fullName ?? "Customer"} · {timeAgo(m.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <SupportReply threadId={thread.id} status={thread.status} />
    </div>
  );
}
