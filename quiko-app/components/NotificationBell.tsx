import Link from "next/link";
import { IconBell } from "@/components/icons";
import { unreadCount } from "@/lib/queries/notifications";

/** Header bell with an unread badge. Server component — pass the profile id. */
export async function NotificationBell({ profileId }: { profileId: string }) {
  const count = await unreadCount(profileId);
  return (
    <Link
      href="/app/notifications"
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-card active:scale-95"
    >
      <IconBell width={20} height={20} className="text-ink" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-error px-1 text-[11px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
