import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { IconChat, IconArrowRight } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getConversations } from "@/lib/queries/messages";
import { countActiveMatches } from "@/lib/queries/matches";
import { unreadMessagesByMatch } from "@/lib/queries/notifications";
import { initials, placeShort } from "@/core/format";

/** "10:42 am" today, "Yesterday", else "15 Sep". */
function when(d: Date) {
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(new Date()) - day(d)) / 86_400_000);
  if (days === 0) return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function MessagesPage() {
  const user = await requireUser();
  const [threads, unread, matchCount] = await Promise.all([
    getConversations(user.id),
    unreadMessagesByMatch(user.id),
    countActiveMatches(user.id),
  ]);
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  return (
    <PhoneFrame>
      <header className="pt-safe rounded-b-3xl bg-brand px-5 pb-7">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-ink">Messages</h1>
            <p className="text-sm font-semibold text-ink-soft">Chats with your senders &amp; travellers.</p>
          </div>
          <NotificationBell profileId={user.id} />
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6 pt-4">
        {threads.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-ink">
              <IconChat width={26} height={26} />
            </span>
            <p className="mt-4 text-[15px] font-semibold">No conversations yet</p>
            <p className="mt-1 max-w-[16rem] text-sm text-muted">
              Once you&rsquo;re matched with a sender or traveller, you can chat with them here.
            </p>
          </div>
        ) : (
          <ul className="mt-2 flex flex-col gap-2.5">
            {threads.map(({ match, package: pkg, counterpart, role, last }) => {
              const n = unread[match.id] ?? 0;
              const preview = !last
                ? "No messages yet — say hello"
                : `${last.senderId === user.id ? "You: " : ""}${
                    last.body ?? (last.locationLabel ? `📍 ${last.locationLabel}` : "Sent an attachment")
                  }`;
              return (
                <li key={match.id}>
                  <Link href={`/app/chat/${match.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-canvas p-3.5 shadow-card">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-brand">
                      {initials(counterpart.fullName, "?")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className={`truncate text-[15px] ${n > 0 ? "font-black" : "font-bold"}`}>
                          {counterpart.fullName ?? (role === "sender" ? "Your traveller" : "Your sender")}
                        </span>
                        <span className="ml-auto shrink-0 text-[11px] text-muted">
                          {when(last?.createdAt ?? match.updatedAt ?? match.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[12px] text-muted">
                        <span className="truncate">{placeShort(pkg.fromCity)}</span>
                        <IconArrowRight width={10} height={10} className="shrink-0" />
                        <span className="truncate">{placeShort(pkg.toCity)}</span>
                      </div>
                      <p className={`mt-0.5 truncate text-[13px] ${n > 0 ? "font-semibold text-ink" : "text-muted"}`}>
                        {preview}
                      </p>
                    </div>
                    {n > 0 && (
                      <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-ink px-1.5 text-[11px] font-bold text-brand">
                        {n > 9 ? "9+" : n}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav matchCount={matchCount} messageCount={totalUnread} />
    </PhoneFrame>
  );
}
