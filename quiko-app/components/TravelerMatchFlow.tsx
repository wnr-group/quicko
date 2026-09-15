"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inr } from "@/core/format";
import { splitPayment } from "@/core/pricing";
import { IconCheck, IconMapPin, IconChat, IconPackage } from "@/components/icons";
import { KindChip, RouteTimeline } from "@/components/RouteCard";
import { PhotoCapture } from "@/components/PhotoCapture";
import { CancelMatchButton } from "@/components/CancelMatchButton";
import { advanceMatchAction, confirmDeliveryAction, withdrawDisputeAction } from "@/app/app/actions";

type Res = { ok: true } | { ok: false; error: string };

export function TravelerMatchFlow({
  matchId, tripId, packageId, status, price,
  fromCity, toCity, weight, senderName, receiverName, receiverPhone, disputeRaisedByMe = false,
}: {
  matchId: string; tripId: string; packageId: string; status: string; price: number;
  fromCity: string; toCity: string; weight: number;
  senderName: string; receiverName: string | null; receiverPhone: string | null;
  disputeRaisedByMe?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [pickupOtp, setPickupOtp] = useState("");
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const earn = splitPayment(price).travelerEarns;

  function run(fn: () => Promise<Res>) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-3xl border-l-2 border-brand bg-canvas p-4 shadow-card">
      <div className="mb-2.5 flex items-center gap-2">
        <KindChip icon={<IconPackage width={13} height={13} strokeWidth={2.25} />} label="Package" />
        <span className="ml-auto shrink-0 text-[15px] font-black">{inr(earn)}</span>
      </div>
      <RouteTimeline from={fromCity} to={toCity} />
      <div className="mt-3 border-t border-line pt-2.5 text-[13px] text-muted">
        {weight}kg · from {senderName}
      </div>

      <Link href={`/app/chat/${matchId}`}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl bg-surface py-2.5 text-[14px] font-semibold text-ink active:scale-[0.98]">
        <IconChat width={16} height={16} /> Message {senderName}
      </Link>

      {error && <p className="mt-2 text-sm font-medium text-error">{error}</p>}

      <div className="mt-3 border-t border-line pt-3">
        {status === "confirmed" && (
          <Info tone="wait">Matched! Waiting for {senderName} to pay into escrow.</Info>
        )}

        {status === "disputed" && (
          <>
            <Info tone="wait">
              Delivery under review 🕓 — a problem was reported. Quiko support is looking
              into it and will update you here. No action needed from you for now.
            </Info>
            {disputeRaisedByMe && (
              <button
                disabled={pending}
                onClick={() => run(() => withdrawDisputeAction(matchId, packageId))}
                className="mt-2 text-[13px] font-semibold text-ink underline disabled:opacity-40"
              >
                Sorted it out? Withdraw dispute
              </button>
            )}
          </>
        )}

        {status === "paid" && (
          <>
            <Info tone="go">Payment secured 🔒 — pick it up from {fromCity}.</Info>
            <Receiver name={receiverName} phone={receiverPhone} />
            <Info tone="wait">Collect the package, then enter the pickup OTP {senderName} gives you.</Info>
            <input inputMode="numeric" value={pickupOtp}
              onChange={(e) => setPickupOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Pickup OTP"
              className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] outline-none focus:border-ink" />
            <PhotoCapture label="Add pickup photo (recommended)" value={pickupPhoto} onCapture={setPickupPhoto} />
            <Btn disabled={pending || pickupOtp.length < 4}
              onClick={() => run(() => advanceMatchAction(matchId, tripId, packageId, "picked_up", pickupPhoto ?? undefined, pickupOtp))}>
              {pending ? "…" : "Confirm pickup"}
            </Btn>
          </>
        )}

        {status === "picked_up" && (
          <>
            <Info tone="go">Got it — start your journey and mark when you set off.</Info>
            <Btn disabled={pending} onClick={() => run(() => advanceMatchAction(matchId, tripId, packageId, "in_transit"))}>
              {pending ? "…" : "Mark in transit"}
            </Btn>
          </>
        )}

        {status === "in_transit" && (
          <>
            <Info tone="go">Hand over to the receiver, then enter the OTP they give you.</Info>
            <Receiver name={receiverName} phone={receiverPhone} />
            <input inputMode="numeric" value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Delivery OTP"
              className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] outline-none focus:border-ink" />
            <PhotoCapture label="Add delivery photo (optional)" value={deliveryPhoto} onCapture={setDeliveryPhoto} />
            <Btn disabled={pending || otp.length < 4}
              onClick={() => run(() => confirmDeliveryAction(matchId, tripId, packageId, otp, deliveryPhoto ?? undefined))}>
              {pending ? "Confirming…" : "Confirm delivery"}
            </Btn>
          </>
        )}

        {(status === "delivered" || status === "completed") && (
          <div className="flex items-center gap-3 rounded-2xl bg-success-soft p-3.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-success text-white">
              <IconCheck width={22} height={22} />
            </span>
            <div>
              <div className="font-bold text-success">Delivered!</div>
              <div className="text-[13px] text-ink-soft">{inr(earn)} added to your earnings.</div>
            </div>
          </div>
        )}

        <div className="flex flex-col">
          <Link
            href={`/app/support?about=${encodeURIComponent(`${fromCity} → ${toCity}`)}`}
            className="mt-3 self-center text-[13px] font-semibold text-muted underline"
          >
            Get help with this delivery
          </Link>
          <CancelMatchButton matchId={matchId} packageId={packageId} status={status} />
        </div>
      </div>
    </div>
  );
}

function Info({ tone, children }: { tone: "wait" | "go"; children: React.ReactNode }) {
  return (
    <p className={`rounded-xl px-3 py-2.5 text-[13px] font-medium ${tone === "go" ? "bg-brand-soft text-ink" : "bg-surface text-muted"}`}>
      {children}
    </p>
  );
}

function Receiver({ name, phone }: { name: string | null; phone: string | null }) {
  if (!name) return null;
  return (
    <div className="mt-2 flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-[13px]">
      <IconMapPin width={15} height={15} className="text-muted" />
      <span className="font-semibold">{name}</span>
      {phone && <a href={`tel:${phone}`} className="ml-auto font-semibold text-info">{phone}</a>}
    </div>
  );
}

function Btn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="mt-3 w-full rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-40">
      {children}
    </button>
  );
}
