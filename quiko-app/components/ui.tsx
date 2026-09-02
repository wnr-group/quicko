"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconHome } from "@/components/icons";

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "brand" | "outline" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[15px] font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";
  const styles = {
    primary: "bg-ink text-white hover:bg-ink-soft",
    brand: "bg-brand text-ink shadow-brand hover:bg-brand-strong",
    outline: "border border-line bg-white text-ink hover:bg-neutral-50",
    ghost: "bg-neutral-100 text-ink hover:bg-neutral-200",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function TopBar({
  title,
  back,
  action,
  home = true,
}: {
  title: string;
  back?: boolean;
  action?: ReactNode;
  /** Show a one-tap Home button on the right so users never have to press back repeatedly. */
  home?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="pt-safe sticky top-0 z-20 flex items-center gap-3 bg-canvas/85 px-4 pb-3 backdrop-blur-md">
      {back && (
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink shadow-card active:scale-95"
        >
          <IconArrowLeft />
        </button>
      )}
      <h1 className="flex-1 truncate text-[17px] font-bold">{title}</h1>
      {action}
      {home && (
        <button
          onClick={() => router.push("/app")}
          aria-label="Go to home"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink shadow-card active:scale-95"
        >
          <IconHome />
        </button>
      )}
    </header>
  );
}
