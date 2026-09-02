// Shared form primitives for the package/send forms. Rendered inside client
// components (the button variants carry onClick).
import { IconChevronRight } from "@/components/icons";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 rounded-3xl bg-white p-4 shadow-card">{children}</div>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2.5 block text-[13px] font-bold uppercase tracking-wide text-muted">
      {children}
    </span>
  );
}

export function FieldButton({
  badge, ink, icon, label, value, placeholder, onClick,
}: {
  badge: string; ink?: boolean; icon: React.ReactNode; label: string;
  value?: string; placeholder: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-3.5 text-left active:bg-neutral-50">
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${ink ? "bg-ink text-white" : "bg-brand text-ink"}`}>
        {badge}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted">
          {icon} {label}
        </span>
        <span className={`block truncate text-[14px] font-semibold ${value ? "text-ink" : "text-muted"}`}>
          {value ?? placeholder}
        </span>
      </span>
      <IconChevronRight width={18} height={18} className="shrink-0 text-muted" />
    </button>
  );
}

export function Segmented<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-neutral-100 p-1">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all ${
            value === o.value ? "bg-white text-ink shadow-sm" : "text-muted"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StepBtn({
  onClick, disabled, label, children,
}: {
  onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-ink transition-colors active:scale-95 disabled:opacity-30 enabled:hover:bg-neutral-200">
      {children}
    </button>
  );
}

export const TIME_OPTIONS = [
  { value: "same_day" as const, label: "Same day" },
  { value: "next_day" as const, label: "Next day" },
  { value: "flexible" as const, label: "Flexible" },
];

/** 4-hour departure/arrival windows. Value = start of the window (HH:MM). */
export const TIME_WINDOWS = [
  { value: "00:00", label: "12 – 4 AM" },
  { value: "04:00", label: "4 – 8 AM" },
  { value: "08:00", label: "8 AM – 12 PM" },
  { value: "12:00", label: "12 – 4 PM" },
  { value: "16:00", label: "4 – 8 PM" },
  { value: "20:00", label: "8 PM – 12 AM" },
];
