"use client";

import { useEffect } from "react";

// iOS Safari's 100vh includes the area under its toolbars, and older versions
// lack dvh, so a "full-height" frame pushes its pinned bottom bar off-screen.
// This publishes the real visible height (which also shrinks for the on-screen
// keyboard) as --app-h; globals.css falls back to 100dvh/100vh without it.
export function ViewportHeight() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    const set = () => root.style.setProperty("--app-h", `${Math.round(vv?.height ?? window.innerHeight)}px`);
    set();
    window.addEventListener("resize", set);
    window.addEventListener("orientationchange", set);
    vv?.addEventListener("resize", set);
    return () => {
      window.removeEventListener("resize", set);
      window.removeEventListener("orientationchange", set);
      vv?.removeEventListener("resize", set);
      root.style.removeProperty("--app-h");
    };
  }, []);
  return null;
}
