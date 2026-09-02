const STYLES: Record<string, string> = {
  active: "bg-info-soft text-info",
  pending: "bg-warning-soft text-warning",
  matched: "bg-brand-soft text-ink",
  confirmed: "bg-brand-soft text-ink",
  accepted: "bg-success-soft text-success",
  paid: "bg-brand-soft text-ink",
  in_transit: "bg-warning-soft text-warning",
  picked_up: "bg-warning-soft text-warning",
  delivered: "bg-success-soft text-success",
  completed: "bg-success-soft text-success",
  declined: "bg-neutral-100 text-muted",
  cancelled: "bg-neutral-100 text-muted",
  disputed: "bg-error-soft text-error",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] ?? "bg-neutral-100 text-muted";
  return (
    <span
      className={`inline-block shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cls}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
