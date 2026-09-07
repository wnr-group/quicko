"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inr, initials } from "@/core/format";
import {
  TRANSPORT_ICONS, IconStar, IconShieldCheck, IconCheck, IconMapPin, IconChevronDown,
} from "@/components/icons";
import { sendRequestAction } from "@/app/app/actions";

const KYC_LABEL = ["", "Phone verified", "Verified", "Verified Pro", "Premium Verified"];

export function TravelerCard({
  packageId, tripId, amount, name, rating, deliveries, kycLevel,
  transport, capacityKg, pickupArea, deliveryArea, alreadyRequested,
}: {
  packageId: string; tripId: string; amount: number; name: string;
  rating: number; deliveries: number; kycLevel: number; transport: string;
  capacityKg: number; pickupArea: string; deliveryArea: string; alreadyRequested: boolean;
}) {
  const router = useRouter();
  const [requested, setRequested] = useState(alreadyRequested);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const Transport = TRANSPORT_ICONS[transport] ?? TRANSPORT_ICONS.bus;
  const verified = kycLevel >= 3;

  function request() {
    setError(null);
    startTransition(async () => {
      const res = await sendRequestAction({ packageId, tripId, amount });
      if (res.ok) { setRequested(true); router.refresh(); }
      else setError(res.error);
    });
  }

  return (
    <div className="rounded-3xl bg-white p-4 shadow-card">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-brand">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-bold">{name}</span>
            {verified && <IconShieldCheck width={16} height={16} className="shrink-0 text-info" />}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
            <IconStar width={13} height={13} className="text-brand-strong" />
            <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
            <span>· {deliveries} deliveries</span>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-bold text-ink">
          {capacityKg}kg free
        </span>
        <IconChevronDown width={18} height={18} className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-[13px] text-muted">
        <span className="flex items-center gap-1.5">
          <Transport width={16} height={16} className="text-ink" />
          <span className="capitalize">{transport}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <IconMapPin width={15} height={15} />
          Picks up {pickupArea}
        </span>
      </div>

      {open && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-neutral-50 p-3 text-[13px]">
          <Row k="Verification" v={KYC_LABEL[kycLevel] ?? "Phone verified"} />
          <Row k="Delivers to" v={deliveryArea || "—"} />
          <Row k="Rating" v={`${rating.toFixed(1)} ★`} />
          <Row k="Deliveries" v={String(deliveries)} />
        </dl>
      )}

      {error && <p className="mt-2 text-sm font-medium text-error">{error}</p>}

      <button
        onClick={request}
        disabled={requested || pending || !verified}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition-all active:scale-[0.98] ${
          requested ? "bg-success-soft text-success" : "bg-ink text-white hover:bg-ink-soft disabled:opacity-50"
        }`}
      >
        {requested ? (<><IconCheck width={18} height={18} /> Request sent</>)
          : !verified ? "Identity not verified"
          : pending ? "Sending…" : `Request for ${inr(amount)}`}
      </button>
      {!verified && !requested && (
        <p className="mt-1.5 text-center text-[12px] leading-snug text-muted">
          This traveller hasn&rsquo;t finished identity verification, so they can&rsquo;t
          carry packages yet.
        </p>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{k}</dt>
      <dd className="font-semibold text-ink">{v}</dd>
    </div>
  );
}
