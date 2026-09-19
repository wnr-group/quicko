import Link from "next/link";
import { initials, timeWindow, dateShort } from "@/core/format";
import { TRANSPORT_ICONS, IconShieldCheck, IconChevronRight, IconArrowRight, IconStar } from "@/components/icons";

// Discovery card: name + schedule + trust signals (no price — details not given yet).
export function ExploreTravelerCard({
  href, profileHref, name, kycLevel, transport, travelDate, arriveDate, departTime, arriveTime, rating, deliveries,
}: {
  href: string; profileHref: string; name: string; kycLevel: number; transport: string;
  travelDate: string; arriveDate?: string | null; departTime: string | null; arriveTime: string | null;
  rating: number; deliveries: number;
}) {
  const Transport = TRANSPORT_ICONS[transport] ?? TRANSPORT_ICONS.bus;
  return (
    <div className="rounded-3xl bg-canvas p-4 shadow-card">
      <Link href={href} className="flex items-center gap-3 active:scale-[0.99]">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-brand">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-bold">{name}</span>
            {kycLevel >= 3 && <IconShieldCheck width={16} height={16} className="shrink-0 text-info" />}
            <span className="ml-auto flex items-center gap-1 text-[12px] text-muted">
              <Transport width={14} height={14} /> <span className="capitalize">{transport}</span>
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[13px]">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted">Departs</div>
              <div className="font-semibold">{dateShort(travelDate)} · {timeWindow(departTime)}</div>
            </div>
            <IconArrowRight width={15} height={15} className="mt-3 shrink-0 text-muted" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted">Arrives</div>
              <div className="font-bold text-ink">{dateShort(arriveDate ?? travelDate)} · {timeWindow(arriveTime)}</div>
            </div>
          </div>
        </div>
        <IconChevronRight width={18} height={18} className="shrink-0 text-muted" />
      </Link>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
          {rating > 0 ? (
            <>
              <IconStar width={13} height={13} className="text-brand-strong" />
              {rating.toFixed(1)}
            </>
          ) : (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-ink">New traveller</span>
          )}
          {deliveries > 0 && <span className="text-muted">· {deliveries} deliveries</span>}
        </span>
        <Link href={profileHref} className="text-[12px] font-bold text-ink underline underline-offset-2">
          View profile
        </Link>
      </div>
    </div>
  );
}
