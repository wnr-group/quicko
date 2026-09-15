import { notFound } from "next/navigation";
import Link from "next/link";
import { placeShort, initials } from "@/core/format";
import { StatusBadge } from "@/components/StatusBadge";
import { IconChevronRight } from "@/components/icons";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatLive } from "@/components/ChatLive";
import { ReportUser } from "@/components/ReportUser";
import { IconArrowRight, IconMapPin } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getMatchThread } from "@/lib/queries/messages";

function msgTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

const sameDay = (a: Date, b: Date) => startOfDay(a) === startOfDay(b);

/** "Today" / "Yesterday" / "Tue, 15 Sept" — the separator between days. */
function dayLabel(d: Date) {
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const user = await requireUser();
  const thread = await getMatchThread(matchId, user.id);
  if (!thread) notFound();

  const name = thread.counterpart.fullName ?? "Your match";
  // I'm the sender => they carry it, and the record I care about is my package.
  const theirRole = thread.role === "sender" ? "Traveller" : "Sender";
  const contextHref =
    thread.role === "sender"
      ? `/app/packages/${thread.match.packageId}`
      : `/app/travel/trips/${thread.match.tripId}`;

  return (
    <PhoneFrame>
      <TopBar title={name} back action={<ReportUser reportedUserId={thread.counterpart.id} matchId={matchId} />} />

      {/* Who this is and which delivery it concerns — a chat with no context
          makes you leave to remember what you agreed. Tapping opens the record. */}
      <div className="border-b border-line bg-canvas px-4 pb-3">
        <Link
          href={contextHref}
          className="block rounded-2xl border-l-2 border-brand bg-canvas p-2.5 shadow-card transition-transform active:scale-[0.99]"
        >
          <span className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-bold text-brand">
              {initials(thread.counterpart.fullName, "?")}
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">{name}</span>
            <StatusBadge status={thread.match.status} />
          </span>
          {/* Role and route share the second line; two badges beside the name
              squeezed it to "Ru…" on a phone. */}
          <span className="mt-1.5 flex items-center gap-1.5 text-[12px]">
            <span className="shrink-0 font-bold uppercase tracking-wide text-muted">
              {theirRole}
            </span>
            <span className="shrink-0 text-muted">·</span>
            <span className="truncate font-semibold text-ink">
              {placeShort(thread.route.fromCity)}
            </span>
            <IconArrowRight width={11} height={11} className="shrink-0 text-muted" />
            <span className="truncate font-semibold text-ink">
              {placeShort(thread.route.toCity)}
            </span>
            <IconChevronRight width={14} height={14} className="ml-auto shrink-0 text-muted" />
          </span>
        </Link>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {thread.messages.length === 0 ? (
          <div className="mt-12 flex flex-col items-center px-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-2xl">
              👋
            </span>
            <p className="mt-4 text-[15px] font-bold text-ink">Say hello to {name}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Agree the exact pickup spot and a time that works. Tap a suggestion
              below to start.
            </p>
          </div>
        ) : (
          <div>
            {thread.messages.map((m, i) => {
              const prev = thread.messages[i - 1];
              const next = thread.messages[i + 1];
              const mine = m.senderId === thread.myId;

              const newDay = !prev || !sameDay(prev.createdAt, m.createdAt);
              // Consecutive messages from one person read as a single run: tight
              // spacing, a squared inner corner, and only the last one timestamped.
              const startsRun = newDay || !prev || prev.senderId !== m.senderId;
              const endsRun =
                !next || next.senderId !== m.senderId || !sameDay(next.createdAt, m.createdAt);

              const corner = [
                "rounded-2xl",
                mine ? "rounded-br-md" : "rounded-bl-md",
                startsRun ? "" : mine ? "rounded-tr-md" : "rounded-tl-md",
              ].join(" ");

              return (
                <div key={m.id}>
                  {newDay && (
                    <div className={`mb-4 flex items-center gap-3 ${i === 0 ? "" : "mt-5"}`}>
                      <span className="h-px flex-1 bg-line" />
                      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
                        {dayLabel(m.createdAt)}
                      </span>
                      <span className="h-px flex-1 bg-line" />
                    </div>
                  )}

                  <div
                    className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${
                      startsRun && !newDay ? "mt-3" : "mt-0.5"
                    }`}
                  >
                    {!mine &&
                      (endsRun ? (
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-brand">
                          {initials(thread.counterpart.fullName, "?")}
                        </span>
                      ) : (
                        // keep the run aligned without repeating the avatar
                        <span aria-hidden="true" className="h-7 w-7 shrink-0" />
                      ))}
                    <div
                      className={`max-w-[74%] px-3.5 py-2 text-[15px] ${corner} ${
                        mine ? "bg-brand text-ink" : "bg-canvas text-ink shadow-card"
                      }`}
                    >
                      {m.lat != null && m.lng != null ? (
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${m.lat}&mlon=${m.lng}#map=16/${m.lat}/${m.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2"
                        >
                          <IconMapPin width={20} height={20} className="shrink-0" />
                          <span className="min-w-0">
                            <span className="block break-words font-semibold">
                              {m.locationLabel ?? "Shared location"}
                            </span>
                            <span
                              className={`block text-[12px] underline ${mine ? "text-ink-soft" : "text-muted"}`}
                            >
                              Open in maps
                            </span>
                          </span>
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      )}

                      {/* Only the last message of a run is timestamped. On the
                          yellow bubble this must be ink — white washes out. */}
                      {endsRun && (
                        <div
                          className={`mt-0.5 text-right text-[11px] ${mine ? "text-ink/55" : "text-muted"}`}
                        >
                          {msgTime(m.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <ChatLive count={thread.messages.length} />
      </div>

      <ChatComposer matchId={matchId} />
    </PhoneFrame>
  );
}
