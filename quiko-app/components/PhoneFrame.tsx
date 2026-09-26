import type { ReactNode } from "react";

// Centers the app in a phone-width column on desktop, full-bleed on real phones.
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-surface">
      {/* Fixed viewport height so headers/bottom-nav stay put and only the inner
          `flex-1 overflow-y-auto` region scrolls — a native-app feel. */}
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-canvas shadow-pop">
        {children}
      </div>
    </div>
  );
}
