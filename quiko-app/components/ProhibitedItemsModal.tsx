"use client";

import { useEffect, useRef, useState } from "react";
import { IconX } from "@/components/icons";

const ITEMS: { t: string; d: string }[] = [
  { t: "Cash & valuables", d: "Currency, gift cards, jewellery, precious metals or stones." },
  { t: "High-value electronics", d: "Anything worth over ₹15,000 — phones, laptops, cameras." },
  { t: "Identity & legal documents", d: "Passports, Aadhaar/PAN cards, cheques, contracts, certificates." },
  { t: "Weapons & dangerous goods", d: "Firearms, ammunition, knives, explosives, fireworks." },
  { t: "Drugs & intoxicants", d: "Narcotics, prescription drugs without papers, alcohol, tobacco." },
  { t: "Hazardous materials", d: "Flammable, corrosive or toxic chemicals, gas, loose lithium batteries." },
  { t: "Perishables & liquids", d: "Fresh food, meat, dairy, or any liquid over 100 ml." },
  { t: "Living things", d: "Animals, plants, seeds, or biological samples." },
  { t: "Illegal or restricted items", d: "Counterfeit or stolen goods, and anything banned by law." },
];

const COUNTDOWN = 3;

export function ProhibitedItemsModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) setReachedEnd(true);
  }

  // Edge case: if the list already fits without scrolling, unlock the timer.
  useEffect(() => {
    const el = bodyRef.current;
    const t = setTimeout(() => {
      if (el && el.scrollHeight <= el.clientHeight + 12) setReachedEnd(true);
    }, 150);
    return () => clearTimeout(t);
  }, []);

  // Countdown starts once the user has read to the bottom.
  useEffect(() => {
    if (!reachedEnd || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [reachedEnd, seconds]);

  const ready = reachedEnd && seconds === 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/30">
      <div className="flex h-full w-full max-w-[430px] flex-col bg-white">
        <div className="pt-safe flex items-center justify-between px-5 pb-3 shadow-sm">
          <h2 className="text-[17px] font-bold">Prohibited items</h2>
          <button onClick={onClose} aria-label="Close"
            className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 active:scale-95">
            <IconX />
          </button>
        </div>

        <div ref={bodyRef} onScroll={onScroll}
          className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[14px] leading-snug text-gray-600">
            These items <b className="text-ink">cannot</b> be sent through Quiko. Read the
            full list before confirming.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {ITEMS.map((it, i) => (
              <li key={i} className="rounded-2xl border border-line p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-error-soft text-[13px] font-bold text-error">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-bold">{it.t}</div>
                    <div className="mt-0.5 text-[13px] leading-snug text-muted">{it.d}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-2xl bg-error-soft p-4 text-[13px] leading-snug text-error">
            Sending prohibited items can get your account permanently banned and may be a
            criminal offence. The traveler can inspect, refuse, and report your package at
            pickup.
          </p>
        </div>

        <div className="pb-safe border-t border-line px-5 pt-3">
          <button disabled={!ready} onClick={onConfirm}
            className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-white transition-opacity disabled:opacity-40">
            {!reachedEnd
              ? "Scroll down to read all"
              : seconds > 0
                ? `I confirm (${seconds})`
                : "I confirm — my package has none of these"}
          </button>
        </div>
      </div>
    </div>
  );
}
