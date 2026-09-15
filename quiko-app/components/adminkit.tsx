import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared console primitives. The admin pages each rolled their own card, key/value
 * row and empty state; on a 1500px console the hand-rolled `justify-between` rows
 * stretched a label and its value to opposite edges of the screen.
 */

/** Section heading with a trailing rule — never mistakable for a menu row. */
export function AdminHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 mt-7 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-ink">
      {children}
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </h2>
  );
}

export function Panel({
  title,
  children,
  accent = false,
}: {
  title?: string;
  children: ReactNode;
  /** Yellow left edge, for the primary record on a page. */
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-canvas p-4 shadow-card ${accent ? "border-l-2 border-brand" : ""}`}
    >
      {title && (
        <h2 className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-ink">
          {title}
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </h2>
      )}
      {children}
    </div>
  );
}

/** Fixed label column keeps the pair together instead of spreading it edge to edge. */
export function KV({ k, v, link }: { k: string; v: ReactNode; link?: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-line py-1.5 text-[14px] last:border-0">
      <span className="text-muted">{k}</span>
      {link ? (
        <Link href={link} className="break-words font-semibold underline hover:text-ink">
          {v}
        </Link>
      ) : (
        <span className="break-words font-semibold">{v}</span>
      )}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border-2 border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}

/** A console search/filter bar. */
export function FilterBar({
  name,
  defaultValue,
  placeholder,
  label,
  autoFocus,
}: {
  name: string;
  defaultValue?: string;
  placeholder: string;
  label: string;
  autoFocus?: boolean;
}) {
  return (
    <form className="mt-4 flex max-w-[640px] gap-2">
      <input
        name={name}
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-[15px] outline-none transition-colors focus:border-ink"
      />
      <button className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-ink-soft">
        {label}
      </button>
    </form>
  );
}
