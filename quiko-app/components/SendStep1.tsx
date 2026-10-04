"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Card, Label, FieldButton, StepBtn, StepHeader } from "@/components/formkit";
import { IconMapPin, IconFlag, IconPlus, IconMinus } from "@/components/icons";
import { reverseGeocode } from "@/components/geocode";
import { toSendQuery } from "@/lib/sendParams";
import type { PinnedLocation } from "@/core/geo";

const LocationSheet = dynamic(() => import("@/components/LocationSheet"), { ssr: false });

// Persist the route/timing across the send flow so returning to this step
// (back from Explore) restores what the user already picked.
const STORE_KEY = "quiko_send_step1";

export function SendStep1({
  today, weekOut,
}: {
  today: string; weekOut: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState<PinnedLocation | null>(null);
  const [to, setTo] = useState<PinnedLocation | null>(null);
  const [sheet, setSheet] = useState<"from" | "to" | null>(null);
  const [weightKg, setWeightKg] = useState(1);

  useEffect(() => {
    // Restore a previous selection (e.g. after tapping back from Explore) so the
    // pickup/destination and weight the user already chose aren't lost.
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<{
          from: PinnedLocation; to: PinnedLocation;
          weightKg: number;
        }>;
        // Restoring client-only state after hydration: an effect is correct here
        // (a lazy useState initializer would mismatch the server render).
        /* eslint-disable react-hooks/set-state-in-effect */
        if (s.from) setFrom(s.from);
        if (s.to) setTo(s.to);
        if (s.weightKg) setWeightKg(s.weightKg);
        /* eslint-enable react-hooks/set-state-in-effect */
        if (s.from) return; // had a pickup already → don't override with geolocation
      }
    } catch {}

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

  const ready = !!from && !!to;

  function explore() {
    if (!from || !to) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ from, to, weightKg }));
    } catch {}
    // No timing choice on this step: look a week ahead; Explore's "Should reach
    // between" filter narrows it.
    const q = toSendQuery({
      from, to, timePreference: "flexible", dateFrom: today, dateTo: weekOut,
      weightKg, serviceLevel: "standard",
    });
    router.push(`/app/send/explore?${q}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader step={1} total={2} label="Route & weight" />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5">
        <Card>
          <Label>Where are you sending?</Label>
          <div className="overflow-hidden rounded-2xl border border-line-strong bg-canvas">
            <FieldButton badge="A" ink icon={<IconMapPin width={14} height={14} />}
              label="Pickup" value={from?.label} placeholder="Set pickup location"
              onClick={() => setSheet("from")} />
            <div className="ml-[26px] border-t border-line" />
            <FieldButton badge="B" icon={<IconFlag width={14} height={14} />}
              label="Destination" value={to?.label} placeholder="Where to?"
              onClick={() => setSheet("to")} />
          </div>
        </Card>

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
      </div>

      <div className="pb-safe border-t border-line bg-canvas px-5 pt-3">
        <Button variant="brand" onClick={explore} disabled={!ready}>
          {!from || !to ? "Set pickup & destination" : "Explore travellers"}
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
