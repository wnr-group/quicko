"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconMapPin, IconPackage, IconShieldCheck, IconPlane, IconStar, IconArrowLeft,
} from "@/components/icons";

const SLIDES = [
  {
    icon: <IconMapPin width={34} height={34} />,
    title: "Explore travellers",
    body: "See people already travelling your route and exactly when they arrive — no login needed to browse.",
  },
  {
    icon: <IconPackage width={34} height={34} />,
    title: "Pick & describe",
    body: "Choose a traveller, add your package details, and set the price you're happy to pay.",
  },
  {
    icon: <IconShieldCheck width={34} height={34} />,
    title: "Pay into escrow",
    body: "Your money is held safely by Quiko and released to the traveller only after delivery.",
  },
  {
    icon: <IconPlane width={34} height={34} />,
    title: "Track it live",
    body: "Follow your package from pickup, through transit, all the way to your receiver.",
  },
  {
    icon: <IconStar width={34} height={34} />,
    title: "Confirm & rate",
    body: "Your receiver confirms with a delivery OTP, payment releases, and you rate the traveller. Done!",
  },
];

export function TourCarousel() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  function next() {
    if (last) router.push("/app");
    else setI((n) => n + 1);
  }

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="pt-safe flex items-center justify-between px-5 pb-2">
        {i > 0 ? (
          <button onClick={() => setI((n) => n - 1)} aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-card active:scale-95">
            <IconArrowLeft />
          </button>
        ) : (
          <span className="h-10 w-10" />
        )}
        <Link href="/app" className="px-2 py-1 text-[15px] font-semibold text-muted">
          Skip
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-[1.75rem] bg-brand text-ink shadow-brand">
          {slide.icon}
        </span>
        <div className="mt-2 text-[13px] font-bold uppercase tracking-wide text-muted">
          Step {i + 1} of {SLIDES.length}
        </div>
        <h1 className="mt-2 text-[26px] font-black tracking-tight">{slide.title}</h1>
        <p className="mt-3 max-w-[18rem] text-[15px] leading-relaxed text-ink-soft">{slide.body}</p>
      </div>

      <div className="pb-10 px-6 pt-4">
        <div className="mb-5 flex justify-center gap-1.5">
          {SLIDES.map((_, n) => (
            <span key={n}
              className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-ink" : "w-1.5 bg-neutral-300"}`} />
          ))}
        </div>
        <button onClick={next}
          className="flex w-full items-center justify-center rounded-2xl bg-ink px-6 py-4 text-[15px] font-semibold text-white shadow-pop transition-transform active:scale-[0.98]">
          {last ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
