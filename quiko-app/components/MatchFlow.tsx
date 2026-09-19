"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inr, initials } from "@/core/format";
import { detourFee as calcDetourFee, FREE_DETOUR_KM } from "@/core/pricing";
import { IconSparkles, IconCheck, IconStar, IconChat } from "@/components/icons";
import { CancelMatchButton } from "@/components/CancelMatchButton";
import {
  payForMatchAction,
  rateTravelerAction,
  setReceiverAction,
  setDetourOptOutAction,
  raiseDisputeAction,
  withdrawDisputeAction,
} from "@/app/app/actions";

const DISPUTE_REASONS: { value: "lost" | "damaged" | "wrong_otp" | "no_show" | "other"; label: string }[] = [
  { value: "no_show", label: "Traveller no-show" },
  { value: "lost", label: "Package lost" },
  { value: "damaged", label: "Damaged" },
  { value: "wrong_otp", label: "OTP issue" },
  { value: "other", label: "Something else" },
];
const CAN_DISPUTE = ["paid", "picked_up", "in_transit", "delivered"];

const STAGES = ["Matched", "Paid", "Picked up", "In transit", "Delivered"];
const STAGE_OF: Record<string, number> = {
  confirmed: 0, paid: 1, picked_up: 2, in_transit: 3, delivered: 4, completed: 4,
};
const WAITING: Record<string, { title: string; body: (name: string) => string }> = {
  paid: {
    title: "Payment secured 🔒",
    body: (n) => `${n} will pick up your package soon. Share the OTP above only when your receiver has it in hand.`,
  },
  picked_up: {
    title: "Picked up",
    body: (n) => `${n} has your package and is on the way. Keep the OTP ready for your receiver.`,
  },
  in_transit: {
    title: "In transit",
    body: (n) => `${n} is en route. Your receiver gives the OTP above to ${n} to complete delivery.`,
  },
};

type Res = { ok: true } | { ok: false; error: string };

export function MatchFlow({
  packageId, matchId, status, price, pickupOtp, otp, travelerName, travelerId, hasReceiver, route,
  detourKm, detourFee, detourOptedOut, detourSelfCollect,
  pickupPhotoUrl, deliveryPhotoUrl, disputeRaisedByMe,
}: {
  packageId: string; matchId: string; status: string;
  price: number; pickupOtp: string; otp: string; travelerName: string; travelerId: string; hasReceiver: boolean; route: string;
  detourKm: number; detourFee: number; detourOptedOut: boolean; detourSelfCollect: boolean;
  pickupPhotoUrl: string | null; deliveryPhotoUrl: string | null; disputeRaisedByMe: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState<(typeof DISPUTE_REASONS)[number]["value"]>("no_show");
  const [reportDetail, setReportDetail] = useState("");
  const reached = STAGE_OF[status] ?? 0;
  const potentialDetourFee = calcDetourFee(detourKm); // fee if door-service is kept
  const isPayableDetour = !detourSelfCollect && detourKm > FREE_DETOUR_KM;

  function run(fn: () => Promise<Res>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* Match summary */}
      <div className="rounded-3xl bg-brand p-5 shadow-brand">
        <div className="flex items-center gap-2 text-ink">
          <IconSparkles width={22} height={22} />
          <span className="text-xl font-black">It&rsquo;s a match!</span>
        </div>
        <Link href={`/app/travelers/${travelerId}`} className="mt-3 flex items-center gap-3 active:scale-[0.99]">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-sm font-bold text-brand">
            {initials(travelerName)}
          </span>
          <div>
            <div className="font-bold">{travelerName}</div>
            <div className="text-[13px] text-ink-soft underline">View profile & reviews</div>
          </div>
        </Link>
        <dl className="mt-4 space-y-1.5 border-t border-ink/15 pt-3 text-[14px]">
          {detourFee > 0 ? (
            <>
              {/* Show the base explicitly: detourFee is already inside `price`
                  (see matches.detour_fee — "fee currently included in agreedPrice"),
                  so without this row the total reads as if the detour is still to be added. */}
              <Row k="Base fare" v={inr(price - detourFee)} />
              <Row k={`Door-to-door detour · +${detourKm} km`} v={`+${inr(detourFee)}`} />
              <Row k="You pay" v={inr(price)} strong />
            </>
          ) : (
            <Row k="You pay" v={inr(price)} strong />
          )}
        </dl>
        <Link href={`/app/chat/${matchId}`}
          className="mt-4 flex items-center justify-center gap-1.5 rounded-2xl bg-ink py-3 text-[15px] font-semibold text-white active:scale-[0.98]">
          <IconChat width={17} height={17} /> Message {travelerName}
        </Link>
      </div>

      {/* Tracking timeline (after payment) */}
      {reached >= 1 && (
        <div className="rounded-3xl bg-canvas p-5 shadow-card">
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink">Tracking</h3>
          <ol className="flex flex-col">
            {STAGES.map((s, i) => {
              const done = i <= reached;
              const last = i === STAGES.length - 1;
              return (
                <li key={s} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`grid h-6 w-6 place-items-center rounded-full ${done ? "bg-ink text-brand" : "bg-line text-transparent"}`}>
                      <IconCheck width={14} height={14} />
                    </span>
                    {!last && <span className={`w-0.5 flex-1 ${i < reached ? "bg-ink" : "bg-line"}`} />}
                  </div>
                  <span className={`pb-4 text-[14px] font-semibold ${done ? "text-ink" : "text-muted"}`}>{s}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {(pickupPhotoUrl || deliveryPhotoUrl) && (
        <div className="rounded-3xl bg-canvas p-5 shadow-card">
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink">Proof photos</h3>
          <div className="flex flex-wrap gap-3">
            {pickupPhotoUrl && (
              <div className="flex flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pickupPhotoUrl} alt="Pickup proof" className="h-24 w-24 rounded-xl object-cover" />
                <span className="text-[11px] font-semibold text-muted">Pickup</span>
              </div>
            )}
            {deliveryPhotoUrl && (
              <div className="flex flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={deliveryPhotoUrl} alt="Delivery proof" className="h-24 w-24 rounded-xl object-cover" />
                <span className="text-[11px] font-semibold text-muted">Delivery</span>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="rounded-xl bg-error-soft px-3 py-2 text-sm font-medium text-error">{error}</p>}

      {/* Under review */}
      {status === "disputed" && (
        <Panel>
          <p className="text-sm font-semibold">Delivery under review 🕓</p>
          <p className="text-sm text-gray-600">
            A problem was reported on this delivery. Quiko support is looking into it and
            will update you here — your payment stays safely held until it&rsquo;s resolved.
          </p>
          {disputeRaisedByMe && (
            <button
              disabled={pending}
              onClick={() => run(() => withdrawDisputeAction(matchId, packageId))}
              className="mt-1 self-start text-[13px] font-semibold text-ink underline disabled:opacity-40"
            >
              Sorted it out? Withdraw dispute
            </button>
          )}
        </Panel>
      )}

      {/* Report a problem */}
      {CAN_DISPUTE.includes(status) && (
        showReport ? (
          <Panel>
            <p className="text-sm font-semibold">What went wrong?</p>
            <div className="flex flex-wrap gap-2">
              {DISPUTE_REASONS.map((r) => (
                <button key={r.value} onClick={() => setReason(r.value)}
                  className={`rounded-lg px-2.5 py-1.5 text-[13px] font-semibold ${reason === r.value ? "bg-brand text-ink" : "bg-surface text-ink"}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea value={reportDetail} onChange={(e) => setReportDetail(e.target.value)} rows={2}
              placeholder="Add details (optional)"
              className="w-full resize-none rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-ink" />
            <div className="flex gap-2">
              <button disabled={pending} onClick={() => run(() => raiseDisputeAction(matchId, packageId, reason, reportDetail))}
                className="flex-1 rounded-2xl bg-ink py-3 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-40">
                {pending ? "Reporting…" : "Submit report"}
              </button>
              <button onClick={() => setShowReport(false)} className="rounded-2xl bg-surface px-4 text-sm font-semibold text-ink">Cancel</button>
            </div>
          </Panel>
        ) : (
          <button onClick={() => setShowReport(true)} className="self-center text-[13px] font-semibold text-muted underline">
            Report a problem
          </button>
        )
      )}

      {/* Detour: decide door-service vs self-collect BEFORE paying */}
      {status === "confirmed" && detourSelfCollect && (
        <Panel>
          <p className="text-sm font-semibold">Self-collect on this one</p>
          <p className="text-sm text-gray-600">
            Your route is a bit far off {travelerName}&rsquo;s path — beyond the detour
            they offered. Meet them on their route to hand over and collect; sort the exact
            spot in chat. No extra charge.
          </p>
        </Panel>
      )}
      {status === "confirmed" && isPayableDetour && (
        <Panel>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold">Door-to-door detour · +{detourKm} km</p>
              <p className="text-sm text-gray-600">
                {travelerName} goes {detourKm} km off route to collect and deliver for you
                (+{inr(potentialDetourFee)}). Turn this off to meet on their route and skip
                the charge — arrange the spot in chat.
              </p>
            </div>
            <Toggle
              on={!detourOptedOut}
              disabled={pending}
              onClick={() => run(() => setDetourOptOutAction(matchId, packageId, !detourOptedOut))}
            />
          </div>
          <p className="text-[13px] font-semibold text-ink">
            {detourOptedOut
              ? `You'll self-collect — no detour charge. You pay ${inr(price)}.`
              : `Door-to-door included — ${inr(potentialDetourFee)} of your ${inr(price)} total.`}
          </p>
        </Panel>
      )}

      {/* Step actions */}
      {status === "confirmed" && !hasReceiver && (
        <Panel>
          <p className="text-sm font-semibold">Add receiver details</p>
          <p className="text-sm text-gray-600">
            Now that you&rsquo;re matched, tell us who receives the package — the
            traveler needs this to hand it over.
          </p>
          <input value={rName} onChange={(e) => setRName(e.target.value)} maxLength={60}
            placeholder="Receiver's name"
            className="w-full rounded-xl border border-line px-3.5 py-3 text-[15px] outline-none focus:border-ink" />
          <input value={rPhone} onChange={(e) => setRPhone(e.target.value)} inputMode="tel"
            placeholder="Receiver's phone"
            className="w-full rounded-xl border border-line px-3.5 py-3 text-[15px] outline-none focus:border-ink" />
          <PrimaryBtn
            disabled={pending || rName.trim().length < 2 || rPhone.replace(/\D/g, "").length < 10}
            onClick={() => run(() => setReceiverAction(packageId, rName, rPhone))}>
            {pending ? "Saving…" : "Save & continue to payment"}
          </PrimaryBtn>
        </Panel>
      )}

      {status === "confirmed" && hasReceiver && (
        <Panel>
          <p className="text-sm text-gray-700">
            Pay to confirm. Your money is held safely in escrow and released only
            after delivery.
          </p>
          <PrimaryBtn disabled={pending} onClick={() => run(() => payForMatchAction(matchId, packageId))}>
            {pending ? "Processing…" : `Pay ${inr(price)} securely`}
          </PrimaryBtn>
          <DemoNote>Payment is simulated — Cashfree Easy Split wires in at launch.</DemoNote>
        </Panel>
      )}

      {status === "paid" && pickupOtp && (
        <OtpShare
          otp={pickupOtp}
          label="Pickup OTP — give this to the traveller at hand-off"
          note="Only read it out once the package is physically with them."
        />
      )}

      {(status === "paid" || status === "picked_up" || status === "in_transit") && (
        <>
          <OtpShare otp={otp} label="Delivery OTP — give this to your receiver" />
          <Panel>
            <p className="text-sm font-semibold">{WAITING[status].title}</p>
            <p className="text-sm text-gray-600">{WAITING[status].body(travelerName)}</p>
          </Panel>
        </>
      )}

      {status === "delivered" && (
        <Panel>
          <p className="text-sm font-semibold">Rate {travelerName}</p>
          <div className="flex justify-center gap-2 py-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}
                className={n <= stars ? "text-brand-strong" : "text-line-strong"}>
                <IconStar width={34} height={34} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            rows={2}
            className="w-full resize-none rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
          <PrimaryBtn disabled={pending} onClick={() => run(() => rateTravelerAction(matchId, packageId, stars, comment))}>
            {pending ? "Submitting…" : "Submit rating"}
          </PrimaryBtn>
        </Panel>
      )}

      {status === "completed" && (
        <div className="rounded-3xl bg-success-soft p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success text-white">
            <IconCheck width={26} height={26} />
          </div>
          <p className="mt-3 text-lg font-black">Delivery complete!</p>
          <p className="mt-1 text-sm text-gray-600">Thanks for using Quiko. 📦</p>
        </div>
      )}

      <Link href={`/app/support?about=${encodeURIComponent(route)}`} className="mt-2 self-center text-[13px] font-semibold text-muted underline">
        Get help with this delivery
      </Link>

      <CancelMatchButton matchId={matchId} packageId={packageId} status={status} />
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between${strong ? " border-t border-ink/15 pt-1.5 text-[15px]" : ""}`}>
      <dt className={strong ? "font-semibold" : "text-ink-soft"}>{k}</dt>
      <dd className="font-bold">{v}</dd>
    </div>
  );
}
function Panel({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-3xl bg-canvas p-5 shadow-card">{children}</div>;
}
function PrimaryBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-40">
      {children}
    </button>
  );
}
function DemoNote({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-[12px] text-muted">{children}</p>;
}
function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Keep door-to-door detour"
      disabled={disabled}
      onClick={onClick}
      className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-brand" : "bg-line-strong"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
function OtpShare({ otp, label, note }: { otp: string; label: string; note?: string }) {
  return (
    <div className="rounded-3xl bg-ink px-5 py-4 text-center">
      <div className="text-[12px] font-medium uppercase tracking-wide text-brand/70">{label}</div>
      <div className="mt-1 text-3xl font-black tracking-[0.35em] text-brand">{otp}</div>
      {note && <div className="mt-1 text-[13px] leading-snug text-muted-invert">{note}</div>}
    </div>
  );
}
