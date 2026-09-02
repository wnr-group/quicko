"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const TRANSPORTS = [
  { value: "", label: "Any" },
  { value: "flight", label: "Flight" },
  { value: "train", label: "Train" },
  { value: "bus", label: "Bus" },
  { value: "car", label: "Car" },
];
const RATINGS = [
  { value: "", label: "Any rating" },
  { value: "3", label: "3★+" },
  { value: "4", label: "4★+" },
];

export function TravelerFilters({ transport, minRating }: { transport: string; minRating: string }) {
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
      <ChipRow options={TRANSPORTS} value={transport} onPick={(v) => set("transport", v)} />
      <ChipRow options={RATINGS} value={minRating} onPick={(v) => set("minRating", v)} />
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
            value === o.value ? "bg-ink text-white" : "bg-white text-ink shadow-card"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
