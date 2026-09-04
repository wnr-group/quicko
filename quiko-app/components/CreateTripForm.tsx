"use client";

import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Card, Label, FieldButton, Segmented, StepBtn, TIME_WINDOWS } from "@/components/formkit";
import { IconMapPin, IconFlag, IconPlus, IconMinus, IconArrowLeft, IconHome } from "@/components/icons";
import { reverseGeocode } from "@/components/geocode";
import { roadDistanceKm, type PinnedLocation } from "@/core/geo";
import { DETOUR_RATE, FREE_DETOUR_KM } from "@/core/pricing";
import { createTripAction } from "@/app/app/actions";

const LocationSheet = dynamic(() => import("@/components/LocationSheet"), { ssr: false });

const TRANSPORT = [
  { value: "flight" as const, label: "Flight" },
  { value: "train" as const, label: "Train" },
  { value: "bus" as const, label: "Bus" },
  { value: "car" as const, label: "Car" },
];

/** Step-aware header — back steps to screen 1 before it leaves the page. */
function WizardHeader({
  step, onBack,
}: {
  step: 1 | 2;
  onBack: () => void;
}) {
  const router = useRouter();
  return (
    <header className="pt-safe sticky top-0 z-20 bg-canvas/85 px-4 pb-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink shadow-card active:scale-95"
        >
          <IconArrowLeft />
        </button>
        <h1 className="flex-1 truncate text-[17px] font-bold">Post a trip</h1>
        <button
          onClick={() => router.push("/app")}
          aria-label="Go to home"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink shadow-card active:scale-95"
        >
          <IconHome />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-brand" : "bg-neutral-200"}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-brand" : "bg-neutral-200"}`} />
      </div>
      <p className="mt-1.5 text-[12px] font-semibold text-muted">
        Step {step} of 2 — {step === 1 ? "Your journey" : "Your vehicle & capacity"}
      </p>
    </header>
  );
}

export function CreateTripForm({ today }: { today: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [from, setFrom] = useState<PinnedLocation | null>(null);
  const [to, setTo] = useState<PinnedLocation | null>(null);
  const [sheet, setSheet] = useState<"from" | "to" | null>(null);
  const [departDate, setDepartDate] = useState(today);
  const [departTime, setDepartTime] = useState("08:00");
  const [arriveDate, setArriveDate] = useState(today);
  const [arriveTime, setArriveTime] = useState("16:00");
  const [transport, setTransport] = useState<"flight" | "train" | "bus" | "car">("flight");
  const [capacityKg, setCapacityKg] = useState(10);
  const [detourOn, setDetourOn] = useState(false);
  const [extraDetourKm, setExtraDetourKm] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (from || !("geolocation" in navigator)) return;
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
  const orderOk =
    arriveDate > departDate || (arriveDate === departDate && arriveTime >= departTime);
  const step1Ready =
    !!from && !!to && distance > 0 && !!departDate && !!departTime && !!arriveDate && !!arriveTime && orderOk;
  const ready = step1Ready;

  function goBack() {
    if (step === 2) setStep(1);
    else router.back();
  }

  function submit() {
    if (!from || !to) return;
    setError(null);
    startTransition(async () => {
      const res = await createTripAction({
        fromLabel: from.label, fromLat: from.lat, fromLng: from.lng,
        toLabel: to.label, toLat: to.lat, toLng: to.lng,
        travelDate: departDate, arriveDate, departTime, arriveTime, transport, capacityKg,
        extraDetourKm: detourOn ? extraDetourKm : 0,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <WizardHeader step={step} onBack={goBack} />

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5">
        {step === 1 && (
          <>
            <Card>
              <Label>Your journey</Label>
              <div className="overflow-hidden rounded-2xl border border-line bg-white">
                <FieldButton badge="A" ink icon={<IconMapPin width={14} height={14} />}
                  label="Starting from" value={from?.label} placeholder="Set start location"
                  onClick={() => setSheet("from")} />
                <div className="ml-[26px] border-t border-line" />
                <FieldButton badge="B" icon={<IconFlag width={14} height={14} />}
                  label="Going to" value={to?.label} placeholder="Where to?"
                  onClick={() => setSheet("to")} />
              </div>
            </Card>

            <Card>
              <Label>Departure</Label>
              <div className="flex items-end gap-2">
                <label className="flex-[1.3]">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">Date</span>
                  <input type="date" value={departDate} min={today}
                    onChange={(e) => {
                      setDepartDate(e.target.value);
                      if (arriveDate < e.target.value) setArriveDate(e.target.value);
                    }}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] outline-none focus:border-ink" />
                </label>
                <label className="flex-1">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">Window</span>
                  <select value={departTime} onChange={(e) => setDepartTime(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] outline-none focus:border-ink">
                    {TIME_WINDOWS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                  </select>
                </label>
              </div>
            </Card>

            <Card>
              <Label>Arrival</Label>
              <div className="flex items-end gap-2">
                <label className="flex-[1.3]">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">Date</span>
                  <input type="date" value={arriveDate} min={departDate} onChange={(e) => setArriveDate(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] outline-none focus:border-ink" />
                </label>
                <label className="flex-1">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">Window</span>
                  <select value={arriveTime} onChange={(e) => setArriveTime(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] outline-none focus:border-ink">
                    {TIME_WINDOWS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                  </select>
                </label>
              </div>
              {!orderOk && (
                <p className="mt-2 text-[12px] font-medium text-error">Arrival must be after departure.</p>
              )}
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <Card>
              <Label>How are you travelling?</Label>
              <Segmented options={TRANSPORT} value={transport} onChange={(v) => setTransport(v)} />
            </Card>

            <Card>
              <Label>Spare capacity</Label>
              <div className="flex items-center justify-between">
                <StepBtn label="Decrease capacity" onClick={() => setCapacityKg((c) => Math.max(1, c - 1))} disabled={capacityKg <= 1}>
                  <IconMinus />
                </StepBtn>
                <div className="text-center tabular-nums">
                  <span className="text-3xl font-black">{capacityKg}</span>
                  <span className="ml-1 text-sm font-semibold text-muted">kg</span>
                </div>
                <StepBtn label="Increase capacity" onClick={() => setCapacityKg((c) => Math.min(30, c + 1))} disabled={capacityKg >= 30}>
                  <IconPlus />
                </StepBtn>
              </div>
              <p className="mt-2.5 text-[12px] leading-snug text-muted">
                How much weight you can carry for senders on this trip.
              </p>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Label>Willing to detour to earn more?</Label>
                  <p className="text-[12px] leading-snug text-muted">
                    A {FREE_DETOUR_KM} km detour is always free. Go further to serve more
                    senders and earn ₹{DETOUR_RATE}/km extra.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={detourOn}
                  aria-label="Willing to detour to earn more"
                  onClick={() => setDetourOn((v) => !v)}
                  className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${detourOn ? "bg-brand" : "bg-neutral-300"}`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${detourOn ? "left-[22px]" : "left-0.5"}`}
                  />
                </button>
              </div>

              {detourOn && (
                <div className="mt-4">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-[13px] font-semibold text-ink">
                      Up to +{extraDetourKm} km beyond the free {FREE_DETOUR_KM} km
                    </span>
                    <span className="text-[13px] font-bold text-ink">≈ ₹{extraDetourKm * DETOUR_RATE} max</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={extraDetourKm}
                    onChange={(e) => setExtraDetourKm(Number(e.target.value))}
                    className="w-full accent-brand"
                    aria-label="Extra detour kilometres"
                  />
                  <div className="flex justify-between text-[11px] font-medium text-muted">
                    <span>+1 km</span>
                    <span>+10 km</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-snug text-muted">
                    You&rsquo;ll only earn the extra when a package actually pulls you off
                    route — and only if the sender keeps door-to-door.
                  </p>
                </div>
              )}
            </Card>
          </>
        )}

        {error && <p className="mt-4 rounded-xl bg-error-soft px-3 py-2 text-sm font-medium text-error">{error}</p>}
      </div>

      <div className="pb-safe border-t border-line bg-white px-5 pt-3">
        {step === 1 ? (
          <Button variant="brand" onClick={() => setStep(2)} disabled={!step1Ready}>
            {!from || !to ? "Set your route" : "Continue"}
          </Button>
        ) : (
          <Button variant="brand" onClick={submit} disabled={!ready || pending}>
            {pending ? "Posting…" : "Post trip"}
          </Button>
        )}
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
