"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { Card, Label, Segmented, StepBtn, StepHeader, SERVICE_OPTIONS } from "@/components/formkit";
import { IconPlus, IconMinus } from "@/components/icons";
import { calculatePrice, type ServiceLevel } from "@/core/pricing";
import { roadDistanceKm } from "@/core/geo";
import { dateShort, placeShort } from "@/core/format";
import { createFromExploreAction } from "@/app/app/actions";
import type { SendParams } from "@/lib/sendParams";

export function ExploreDetailsForm({
  params, tripId, notify, travelerName, travelerWhen,
}: {
  params: SendParams;
  tripId?: string;
  notify?: boolean;
  travelerName?: string;
  travelerWhen?: string;
}) {
  const [weightKg, setWeightKg] = useState(1);
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>("standard");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const distance = roadDistanceKm(params.from, params.to);
  // Price is computed here but never shown — the sender sees it at payment.
  const breakdown = useMemo(
    () => calculatePrice({ weightKg, distanceKm: distance, serviceLevel }),
    [weightKg, distance, serviceLevel],
  );
  const descOk = description.trim().length >= 3;
  const ready = distance > 0 && descOk;

  const dateLabel =
    params.dateTo && params.dateTo !== params.dateFrom
      ? `${dateShort(params.dateFrom)} – ${dateShort(params.dateTo)}`
      : dateShort(params.dateFrom);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createFromExploreAction(
        {
          fromLabel: params.from.label, fromLat: params.from.lat, fromLng: params.from.lng,
          toLabel: params.to.label, toLat: params.to.lat, toLng: params.to.lng,
          travelDate: params.dateFrom, dateTo: params.dateTo,
          weightKg, timePreference: params.timePreference, serviceLevel,
          offerPrice: breakdown.maxPrice,
          description: description.trim(),
        },
        tripId,
      );
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader step={3} total={3} label={notify ? "Package details" : "Confirm & request"} />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5">
        {/* Route + traveler summary */}
        <Card>
          <div className="truncate text-[15px] font-bold">
            {placeShort(params.from.label)}{" "}
            <span className="font-normal text-muted">&rarr;</span>{" "}
            {placeShort(params.to.label)}
          </div>
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">
            {params.from.label} &rarr; {params.to.label}
          </p>
          <div className="mt-1 text-[13px] text-muted">Arrive {dateLabel}</div>
          {tripId && travelerName && (
            <div className="mt-3 rounded-2xl bg-brand px-3.5 py-2.5">
              <div className="text-[13px] font-bold text-ink">Requesting {travelerName}</div>
              {travelerWhen && <div className="text-[12px] text-ink-soft">{travelerWhen}</div>}
            </div>
          )}
        </Card>

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

        {/* Service level (price/speed tier) */}
        <Card>
          <Label>Service level</Label>
          <Segmented options={SERVICE_OPTIONS} value={serviceLevel}
            onChange={(v) => setServiceLevel(v as ServiceLevel)} />
          <p className="mt-2.5 text-[13px] leading-snug text-muted">
            {serviceLevel === "flexible"
              ? "Flexible saves you 35% — you wait for a matching journey."
              : serviceLevel === "express"
                ? "Express prioritises the fastest travellers, at a premium."
                : serviceLevel === "fast"
                  ? "Fast leans toward quicker journeys for a small premium."
                  : "Standard — the balanced default."}
          </p>
        </Card>

        {/* Description (mandatory) */}
        <Card>
          <Label>Description</Label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Documents and a small gift for family" rows={3} maxLength={300}
            className="w-full resize-none rounded-xl border border-line bg-white px-3.5 py-3 text-[15px] outline-none focus:border-ink" />
        </Card>

        {error && <p className="mt-4 rounded-xl bg-error-soft px-3 py-2 text-sm font-medium text-error">{error}</p>}
      </div>

      <div className="pb-safe border-t border-line bg-white px-5 pt-3">
        <Button variant="brand" onClick={submit} disabled={!ready || pending}>
          {pending
            ? "Posting…"
            : !descOk
              ? "Describe your package"
              : notify
                ? "Post & get notified"
                : `Send request to ${travelerName ?? "traveler"}`}
        </Button>
      </div>
    </div>
  );
}
