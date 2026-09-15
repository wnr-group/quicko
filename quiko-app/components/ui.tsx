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
  /** primary/brand are the yellow CTA; `dark` is the black counterpart. */
  variant?: "primary" | "brand" | "dark" | "outline" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[15px] font-bold tracking-tight transition-all active:scale-[0.98] disabled:pointer-events-none disabled:bg-surface disabled:text-muted disabled:shadow-none";
  const styles = {
    primary: "bg-brand text-ink shadow-brand hover:bg-brand-strong",
    brand: "bg-brand text-ink shadow-brand hover:bg-brand-strong",
    dark: "bg-ink text-brand shadow-ink hover:bg-ink-soft",
    outline: "border-2 border-ink bg-canvas text-ink hover:bg-brand-soft",
    ghost: "bg-surface text-ink hover:bg-brand-soft",
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
    <header className="pt-safe sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-canvas/90 px-4 pb-3 backdrop-blur-md">
      {back && (
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line-strong bg-canvas text-ink transition-colors active:scale-95 hover:bg-brand-soft"
        >
          <IconArrowLeft />
        </button>
      )}
      <h1 className="flex-1 truncate text-[17px] font-bold tracking-tight">{title}</h1>
      {action}
      {home && (
        <button
          onClick={() => router.push("/app")}
          aria-label="Go to home"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line-strong bg-canvas text-ink transition-colors active:scale-95 hover:bg-brand-soft"
        >
          <IconHome />
        </button>
      )}
    </header>
  );
}
