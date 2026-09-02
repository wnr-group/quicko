"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Card, Label, FieldButton, Segmented, TIME_OPTIONS } from "@/components/formkit";
import { IconMapPin, IconFlag } from "@/components/icons";
import { reverseGeocode } from "@/components/geocode";
import { toSendQuery } from "@/lib/sendParams";
import type { PinnedLocation } from "@/core/geo";
import type { TimePreference } from "@/core/types";

const LocationSheet = dynamic(() => import("@/components/LocationSheet"), { ssr: false });

export function SendStep1({
  today, tomorrow, weekOut,
}: {
  today: string; tomorrow: string; weekOut: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState<PinnedLocation | null>(null);
  const [to, setTo] = useState<PinnedLocation | null>(null);
  const [sheet, setSheet] = useState<"from" | "to" | null>(null);
  const [timePreference, setTimePreference] = useState<TimePreference>("next_day");
  const [flexFrom, setFlexFrom] = useState("");
  const [flexTo, setFlexTo] = useState("");

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

  const from0 = flexFrom || today;
  const to0 = flexTo || weekOut;
  const dateFrom =
    timePreference === "same_day" ? today : timePreference === "next_day" ? tomorrow : from0;
  const dateTo = timePreference === "flexible" ? to0 : dateFrom;
  const dateOk = timePreference !== "flexible" || from0 <= to0;
  const ready = !!from && !!to && dateOk;

  function explore() {
    if (!from || !to) return;
    const q = toSendQuery({ from, to, timePreference, dateFrom, dateTo });
    router.push(`/app/send/explore?${q}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5">
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

        <Card>
          <Label>When should it arrive?</Label>
          <Segmented options={TIME_OPTIONS} value={timePreference}
            onChange={(v) => setTimePreference(v)} />
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
            We&rsquo;ll show travelers arriving in this window. You add package
            details after you pick one — so no price yet.
          </p>
        </Card>
      </div>

      <div className="pb-safe border-t border-line bg-white px-5 pt-3">
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
