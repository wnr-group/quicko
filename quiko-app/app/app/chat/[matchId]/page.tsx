import { notFound } from "next/navigation";
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

  return (
    <PhoneFrame>
      <TopBar title={name} back action={<ReportUser reportedUserId={thread.counterpart.id} matchId={matchId} />} />
      <div className="border-b border-line bg-white px-5 pb-2">
        <div className="flex items-center gap-1.5 text-[13px] text-muted">
          <span className="truncate font-semibold text-ink">{thread.route.fromCity}</span>
          <IconArrowRight width={13} height={13} className="shrink-0" />
          <span className="truncate font-semibold text-ink">{thread.route.toCity}</span>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {thread.messages.length === 0 ? (
          <div className="mt-10 text-center text-sm text-muted">
            Say hello 👋 — coordinate the pickup spot and timing with {name}.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {thread.messages.map((m) => {
              const mine = m.senderId === thread.myId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] ${
                      mine ? "rounded-br-md bg-ink text-white" : "rounded-bl-md bg-white text-ink shadow-card"
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
                          <span className="block truncate font-semibold">{m.locationLabel ?? "Shared location"}</span>
                          <span className="block text-[12px] underline opacity-80">Open in maps</span>
                        </span>
                      </a>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    )}
                    <div className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/50" : "text-muted"}`}>
                      {msgTime(m.createdAt)}
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
