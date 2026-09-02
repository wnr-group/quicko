import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TopBar } from "@/components/ui";
import { MarkNotificationsRead } from "@/components/MarkNotificationsRead";
import {
  IconBell,
  IconSparkles,
  IconShieldCheck,
  IconCheck,
  IconStar,
  IconX,
  IconPackage,
  IconPlane,
  IconChat,
} from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/queries/notifications";
import { timeAgo } from "@/core/format";

const ICONS: Record<string, (p: { width?: number; height?: number }) => React.ReactElement> = {
  request_received: IconPackage,
  offer_received: IconPackage,
  trip_match: IconPlane,
  package_match: IconPackage,
  matched: IconSparkles,
  declined: IconX,
  paid: IconShieldCheck,
  picked_up: IconPlane,
  in_transit: IconPlane,
  delivered: IconCheck,
  rated: IconStar,
  message: IconChat,
  kyc: IconShieldCheck,
};

export default async function NotificationsPage() {
  const user = await requireUser();
  // Match events live in the Matches tab now — keep them out of the inbox.
  const items = (await listNotifications(user.id)).filter((n) => n.type !== "matched");
  const hasUnread = items.some((n) => !n.read);

  return (
    <PhoneFrame>
      <TopBar title="Notifications" back />
      <MarkNotificationsRead hasUnread={hasUnread} />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-ink">
              <IconBell width={26} height={26} />
            </span>
            <p className="mt-4 text-[15px] font-semibold">You&rsquo;re all caught up</p>
            <p className="mt-1 text-sm text-muted">
              Matches, payments and delivery updates will show up here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((n) => {
              const Icon = ICONS[n.type] ?? IconBell;
              const href = (n.data as { href?: string } | null)?.href;
              const body = (
                <div
                  className={`flex gap-3 rounded-2xl p-3.5 shadow-card ${
                    n.read ? "bg-white" : "bg-brand-soft"
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-brand">
                    <Icon width={18} height={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="flex-1 text-[15px] font-bold leading-snug">{n.title}</p>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-error" />}
                    </div>
                    {n.body && <p className="mt-0.5 text-[13px] text-ink-soft">{n.body}</p>}
                    <p className="mt-1 text-[12px] text-muted">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {href ? (
                    <Link href={href} className="block active:scale-[0.99]">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PhoneFrame>
  );
}
