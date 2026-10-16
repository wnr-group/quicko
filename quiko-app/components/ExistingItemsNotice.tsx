import Link from "next/link";
import { IconArrowRight } from "@/components/icons";

export type ExistingItem = { id: string; from: string; to: string; meta: string; href: string };

const MAX_SHOWN = 3;

// Shown before the send / plan-a-trip flow when the user already has an open one:
// edit (or open) the existing item, or deliberately start another.
export function ExistingItemsNotice({
  kind, items, openLabel, continueHref,
}: {
  kind: "package" | "trip";
  items: ExistingItem[];
  openLabel: string;
  continueHref: string;
}) {
  const noun = kind === "package" ? "package" : "trip";
  const shown = items.slice(0, MAX_SHOWN);
  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8 pt-4">
      <h2 className="text-xl font-black tracking-tight">
        You already have {items.length === 1 ? `an active ${noun}` : `${items.length} active ${noun}s`}
      </h2>
      <p className="mt-1 text-[14px] leading-snug text-muted">
        {kind === "package"
          ? "Want to change it instead of sending a new one?"
          : "Want to manage it instead of planning a new one?"}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {shown.map((it) => (
          <div key={it.id} className="rounded-3xl bg-canvas p-4 shadow-card">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="truncate">{it.from}</span>
              <IconArrowRight width={14} height={14} className="shrink-0 text-muted" />
              <span className="truncate">{it.to}</span>
            </div>
            <div className="mt-1 text-[13px] text-muted">{it.meta}</div>
            <Link href={it.href}
              className="mt-3 flex w-full items-center justify-center rounded-2xl bg-brand px-5 py-3 text-[15px] font-bold text-ink shadow-brand active:scale-[0.98]">
              {openLabel}
            </Link>
          </div>
        ))}
        {items.length > shown.length && (
          <p className="text-center text-[13px] text-muted">+ {items.length - shown.length} more in your list</p>
        )}
      </div>

      <Link href={continueHref} replace
        className="mt-5 flex w-full items-center justify-center rounded-2xl border-2 border-ink bg-canvas px-5 py-3.5 text-[15px] font-bold text-ink active:scale-[0.98]">
        {kind === "package" ? "Send a new package anyway" : "Plan a new trip anyway"}
      </Link>
    </div>
  );
}
