import Link from "next/link";
import Image from "next/image";
import { PhoneFrame } from "@/components/PhoneFrame";
import { IconMapPin, IconPackage } from "@/components/icons";

export default function SplashPage() {
  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col bg-brand px-7 pt-safe">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Image
            src="/quiko-logo.jpg"
            alt="Quiko — Just Quick As That"
            width={1600}
            height={615}
            priority
            className="h-auto w-full max-w-[320px]"
          />

          {/* Route visual */}
          <div className="mt-10 flex w-full max-w-[280px] items-center gap-2">
            <RouteEnd label="Send" />
            <div className="relative flex-1">
              <div className="border-t-2 border-dashed border-ink/30" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink p-1.5 text-brand">
                <IconPackage width={16} height={16} />
              </div>
            </div>
            <RouteEnd label="Deliver" />
          </div>

          <p className="mt-10 max-w-[17rem] text-[17px] font-semibold leading-snug text-ink">
            Same People. New Possibilities.
          </p>
          <p className="mt-2 max-w-[16rem] text-[15px] leading-relaxed text-ink-soft">
            Your parcel travels with real people already going your way. Faster,
            cheaper, greener.
          </p>
        </div>

        <div className="pb-10 pt-4">
          <Link
            href="/tour"
            className="flex w-full items-center justify-center rounded-2xl bg-ink px-6 py-4 text-[15px] font-bold tracking-tight text-brand shadow-pop transition-transform active:scale-[0.98]"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="mt-2.5 flex w-full items-center justify-center rounded-2xl border-2 border-ink bg-transparent px-6 py-3.5 text-[15px] font-bold tracking-tight text-ink transition-transform active:scale-[0.98]"
          >
            Log in
          </Link>
          <p className="mt-3 text-center text-[13px] text-ink-soft">
            Browse free — sign in only when you send
          </p>
          <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-wnr">
            by WnR
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}

function RouteEnd({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-brand">
        <IconMapPin width={16} height={16} />
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </span>
    </div>
  );
}
