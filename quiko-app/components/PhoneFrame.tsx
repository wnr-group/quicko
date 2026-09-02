import type { ReactNode } from "react";

// Centers the app in a phone-width column on desktop, full-bleed on real phones.
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-neutral-200/70">
      <div className="relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-canvas">
        {children}
      </div>
    </div>
  );
}
