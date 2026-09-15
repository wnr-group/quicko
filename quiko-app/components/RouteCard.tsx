import type { ReactNode } from "react";
import Link from "next/link";

/** What the card represents. Packages read yellow, trips read black, so the
 *  two are distinguishable at a glance in a mixed list. */
export type RouteKind = {
  icon?: ReactNode;
  label: string;
  tone?: "package" | "trip";
};

/**
 * The shared package/trip card: a journey timeline.
 *
 * Origin and destination each get their own full-width line joined by a
 * connector rail, so long geocoded names ("Goods Shed Road, Coimbatore") read
 * in full instead of being split across two shrinking columns. A type chip
 * heads the card, and meta plus status sit in a footer, so every card is the
 * same height regardless of how long the place names are.
 */
/** The type chip on its own, for detail screens that build their own card. */
export function KindChip({ icon, label, tone }: RouteKind) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-[11px] font-bold uppercase tracking-wide ${
        tone === "trip" ? "bg-ink text-brand" : "bg-brand text-ink"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}

/** Origin over destination on a connector rail. Names wrap rather than clip. */
export function RouteTimeline({
  from, to, size = "md", onBrand = false, fromMeta, toMeta,
}: {
  from: string; to: string; size?: "md" | "lg";
  /** Set on a yellow surface, where a yellow rail would disappear. */
  onBrand?: boolean;
  /** Optional sub-line under each end, e.g. the departure / arrival window. */
  fromMeta?: ReactNode;
  toMeta?: ReactNode;
}) {
  const text = size === "lg" ? "text-[17px]" : "text-[15px]";
  const rail = onBrand ? "bg-ink/25" : "bg-brand";
  const dotA = onBrand ? "border-ink bg-canvas" : "border-ink bg-brand";
  const dotB = onBrand ? "bg-ink ring-canvas" : "bg-brand ring-ink";
  return (
    <div className="relative pl-[22px]">
      <span aria-hidden="true" className={`absolute bottom-3 left-[4.5px] top-3 w-px ${rail}`} />
      <div className="relative">
        <span aria-hidden="true"
          className={`absolute -left-[22px] top-[6px] h-2.5 w-2.5 rounded-full border-2 ${dotA}`} />
        <span className={`break-words ${text} font-bold leading-snug`}>{from}</span>
        {fromMeta != null && <div className="mt-1">{fromMeta}</div>}
      </div>
      <div className="relative mt-3">
        <span aria-hidden="true"
          className={`absolute -left-[22px] top-[6px] h-2.5 w-2.5 rounded-full ring-2 ${dotB}`} />
        <span className={`break-words ${text} font-bold leading-snug`}>{to}</span>
        {toMeta != null && <div className="mt-1">{toMeta}</div>}
      </div>
    </div>
  );
}

export function RouteCard({
  href,
  kind,
  from,
  to,
  amount,
  meta,
  badge,
}: {
  href?: string;
  /** Type chip shown top-left, e.g. Package / Trip. */
  kind?: RouteKind;
  from: string;
  to: string;
  /** Price or figure, shown top-right. */
  amount?: ReactNode;
  /** Secondary line in the footer, e.g. "2kg · from Ruby". */
  meta?: ReactNode;
  /** Status pill, right-aligned in the footer. */
  badge?: ReactNode;
}) {
  const body = (
    <>
      {(kind != null || amount != null) && (
        <div className="mb-2.5 flex items-center gap-2">
          {kind != null && <KindChip {...kind} />}
          {amount != null && (
            <span className="ml-auto shrink-0 text-[15px] font-black">{amount}</span>
          )}
        </div>
      )}

      <RouteTimeline from={from} to={to} />

      {(meta != null || badge != null) && (
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-2.5">
          {meta != null && (
            <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{meta}</span>
          )}
          {badge != null && <span className="ml-auto shrink-0">{badge}</span>}
        </div>
      )}
    </>
  );

  const cls = "block rounded-2xl border-l-2 border-brand bg-canvas p-3.5 shadow-card";
  return href ? (
    <Link href={href} className={`${cls} transition-transform active:scale-[0.99]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
