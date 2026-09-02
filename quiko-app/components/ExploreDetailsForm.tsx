"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { Card, Label, StepBtn } from "@/components/formkit";
import { IconPlus, IconMinus, IconArrowRight } from "@/components/icons";
import { calculatePrice } from "@/core/pricing";
import { roadDistanceKm } from "@/core/geo";
import { dateShort } from "@/core/format";
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
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const distance = roadDistanceKm(params.from, params.to);
  // Price is computed here but never shown — the sender sees it at payment.
  const breakdown = useMemo(
    () => calculatePrice({ weightKg, distanceKm: distance, timePreference: params.timePreference }),
    [weightKg, distance, params.timePreference],
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
          weightKg, timePreference: params.timePreference,
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
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5">
        {/* Route + traveler summary */}
        <Card>
          <div className="flex items-center gap-1.5 text-[15px] font-bold">
            <span className="truncate">{params.from.label}</span>
            <IconArrowRight width={15} height={15} className="shrink-0 text-muted" />
            <span className="truncate">{params.to.label}</span>
          </div>
          <div className="mt-1 text-[13px] text-muted">Arrive {dateLabel}</div>
          {tripId && travelerName && (
            <div className="mt-3 rounded-2xl bg-brand-soft px-3.5 py-2.5">
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
