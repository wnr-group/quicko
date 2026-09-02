"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui";
import { IconMapPin, IconFlag, IconChevronRight, IconPlus, IconMinus } from "@/components/icons";
import { calculatePrice } from "@/core/pricing";
import { roadDistanceKm, type PinnedLocation } from "@/core/geo";
import { reverseGeocode } from "@/components/geocode";
import type { TimePreference } from "@/core/types";
import { createPackageAction, updatePackageAction } from "@/app/app/actions";

const LocationSheet = dynamic(() => import("@/components/LocationSheet"), { ssr: false });

const TIME_OPTIONS: { value: TimePreference; label: string }[] = [
  { value: "same_day", label: "Same day" },
  { value: "next_day", label: "Next day" },
  { value: "flexible", label: "Flexible" },
];

export interface PackageFormInitial {
  from: PinnedLocation;
  to: PinnedLocation;
  travelDate: string;
  dateTo?: string | null;
  weightKg: number;
  declaredValue?: number;
  timePreference: TimePreference;
  offerPrice: number;
  description?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
}

// Reused for create (minimal) and edit (packageId + initial, extra fields shown).
export function CreatePackageForm({
  packageId,
  initial,
  today,
  tomorrow,
  weekOut,
}: {
  packageId?: string;
  initial?: PackageFormInitial;
  today: string;
  tomorrow: string;
  weekOut: string;
}) {
  const isEdit = !!packageId;
  const [from, setFrom] = useState<PinnedLocation | null>(initial?.from ?? null);
  const [to, setTo] = useState<PinnedLocation | null>(initial?.to ?? null);
  const [sheet, setSheet] = useState<"from" | "to" | null>(null);

  const [weightKg, setWeightKg] = useState(initial?.weightKg ?? 1);
  const [timePreference, setTimePreference] = useState<TimePreference>(initial?.timePreference ?? "next_day");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [receiverName, setReceiverName] = useState(initial?.receiverName ?? "");
  const [receiverPhone, setReceiverPhone] = useState(initial?.receiverPhone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [flexFrom, setFlexFrom] = useState(
    initial?.timePreference === "flexible" ? initial.travelDate : "",
  );
  const [flexTo, setFlexTo] = useState(
    initial?.timePreference === "flexible" ? initial.dateTo ?? initial.travelDate : "",
  );
  const from0 = flexFrom || today;
  const to0 = flexTo || weekOut;

  // Timing choice drives the date window (single day for same/next; range for flexible).
  const travelDate =
    timePreference === "same_day" ? today : timePreference === "next_day" ? tomorrow : from0;
  const dateTo = timePreference === "flexible" ? to0 : travelDate;
  const dateOk = timePreference !== "flexible" || from0 <= to0;

  useEffect(() => {
    if (from || initial || !("geolocation" in navigator)) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (cancelled) return;
        setFrom({ lat, lng, label: "Current location" });
        const label = await reverseGeocode(lat, lng);
        if (!cancelled) setFrom({ lat, lng, label });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const distance = from && to ? roadDistanceKm(from, to) : 0;
  // Price is computed for the request but never shown here — seen at payment.
  const breakdown = useMemo(
    () => calculatePrice({ weightKg, distanceKm: distance, timePreference }),
    [weightKg, distance, timePreference],
  );
  const descOk = description.trim().length >= 3;
  const ready = !!from && !!to && distance > 0 && dateOk && descOk;

  function submit() {
    if (!from || !to) return;
    setError(null);
    startTransition(async () => {
      const payload = {
        fromLabel: from.label, fromLat: from.lat, fromLng: from.lng,
        toLabel: to.label, toLat: to.lat, toLng: to.lng,
        travelDate, dateTo, weightKg, timePreference,
        offerPrice: breakdown.maxPrice,
        description: description.trim(),
        receiverName: receiverName.trim() || undefined,
        receiverPhone: receiverPhone.trim() || undefined,
      };
      const res = isEdit
        ? await updatePackageAction(packageId!, payload)
        : await createPackageAction(payload);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5">
        {/* Route */}
        <Card>
          <Label>Where are you sending?</Label>
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <FieldButton badge="A" ink icon={<IconMapPin width={14} height={14} />}
              label="Pickup" value={from?.label} placeholder="Set pickup location"
              onClick={() => setSheet("from")} />
            <div className="ml-[26px] border-t border-line" />
            <FieldButton badge="B" icon={<IconFlag width={14} height={14} />}
              label="Destination" value={to?.label} placeholder="Where to?"
              onClick={() => setSheet("to")} />
          </div>
        </Card>

        {/* Receiver — only in edit; optional. Captured on match otherwise. */}
        {isEdit && (
          <Card>
            <Label>Who&rsquo;s receiving it?</Label>
            <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Receiver's name" maxLength={60}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[15px] outline-none focus:border-ink" />
            <input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)}
              inputMode="tel" placeholder="Receiver's phone"
              className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[15px] outline-none focus:border-ink" />
          </Card>
        )}

        {/* Weight */}
        <Card>
          <Label>Weight</Label>
          <div className="flex items-center justify-between">
            <StepBtn label="Decrease weight" onClick={() => setWeightKg((w) => Math.max(1, w - 1))} disabled={weightKg <= 1}>
              <IconMinus />
            </StepBtn>
            <div className="text-center tabular-nums">
              <span className="text-3xl font-black">{weightKg}</span>
              <span className="ml-1 text-sm font-semibold text-muted">kg</span>
            </div>
            <StepBtn label="Increase weight" onClick={() => setWeightKg((w) => Math.min(15, w + 1))} disabled={weightKg >= 15}>
              <IconPlus />
            </StepBtn>
          </div>
        </Card>

        {/* Description (mandatory) */}
        <Card>
          <Label>Description</Label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Documents and a small gift for family" rows={3} maxLength={300}
            className="w-full resize-none rounded-xl border border-line bg-white px-3.5 py-3 text-[15px] outline-none focus:border-ink" />
        </Card>

        {/* When */}
        <Card>
          <Label>When should it arrive?</Label>
          <Segmented options={TIME_OPTIONS} value={timePreference}
            onChange={(v) => setTimePreference(v as TimePreference)} />
          {timePreference === "flexible" && (
            <div className="mt-3 flex items-end gap-2">
              <label className="flex-1">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">Earliest</span>
                <input type="date" value={from0} min={today} onChange={(e) => setFlexFrom(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[14px] outline-none focus:border-ink" />
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">Latest</span>
                <input type="date" value={to0} min={from0} onChange={(e) => setFlexTo(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[14px] outline-none focus:border-ink" />
              </label>
            </div>
          )}
          <p className="mt-2.5 text-[12px] leading-snug text-muted">
            The sooner you need it, the higher the price — same-day costs the most,
            flexible is the cheapest.
          </p>
        </Card>

        {error && <p className="mt-4 rounded-xl bg-error-soft px-3 py-2 text-sm font-medium text-error">{error}</p>}
      </div>

      <div className="pb-safe border-t border-line bg-white px-5 pt-3">
        <Button variant="brand" onClick={submit} disabled={!ready || pending}>
          {pending
            ? "Saving…"
            : !from || !to
              ? "Set pickup & destination"
              : !dateOk
                ? "Pick a valid date range"
                : !descOk
                  ? "Describe your package"
                  : isEdit
                    ? "Save changes"
                    : "Post & Find Travelers"}
        </Button>
      </div>

      {sheet && (
        <LocationSheet
          which={sheet}
          initial={sheet === "from" ? from : to ?? from}
          onConfirm={(loc) => {
            if (sheet === "from") setFrom(loc);
            else setTo(loc);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 rounded-3xl bg-white p-4 shadow-card">{children}</div>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-2.5 block text-[13px] font-bold uppercase tracking-wide text-muted">{children}</span>;
}

function StepBtn({ onClick, disabled, label, children }: {
  onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-ink transition-colors active:scale-95 disabled:opacity-30 enabled:hover:bg-neutral-200">
      {children}
    </button>
  );
}

function FieldButton({ badge, ink, icon, label, value, placeholder, onClick }: {
  badge: string; ink?: boolean; icon: React.ReactNode; label: string;
  value?: string; placeholder: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2.5 px-3 py-3.5 text-left active:bg-neutral-50">
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

function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-neutral-100 p-1">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all ${on ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
