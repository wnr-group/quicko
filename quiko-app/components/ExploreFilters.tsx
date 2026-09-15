"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SORTS = [
  { value: "arrival", label: "Earliest arrival" },
  { value: "departure", label: "Earliest departure" },
  { value: "rating", label: "Highest rated" },
  { value: "trust", label: "Most trusted" },
];
const TRANSPORTS = [
  { value: "", label: "Any" },
  { value: "flight", label: "Flight" },
  { value: "train", label: "Train" },
  { value: "bus", label: "Bus" },
  { value: "car", label: "Car" },
];
export function ExploreFilters({ sort, transport }: { sort: string; transport: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-3 flex flex-col gap-2">
      <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-card">
        <span className="text-[12px] font-bold uppercase tracking-wide text-muted">Sort</span>
        <select
          value={sort}
          onChange={(e) => set("sort", e.target.value === "arrival" ? "" : e.target.value)}
          className="flex-1 bg-transparent text-[14px] font-semibold outline-none"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </label>

      <ChipRow options={TRANSPORTS} value={transport} onPick={(v) => set("transport", v)} />
    </div>
  );
}

function ChipRow({ options, value, onPick }: { options: { value: string; label: string }[]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onPick(o.value)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
            value === o.value ? "bg-brand text-ink" : "bg-canvas text-ink shadow-card"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
