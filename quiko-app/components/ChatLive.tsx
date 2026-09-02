"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Scrolls the thread to the latest message and polls for new ones (simple
// near-real-time until websockets/push land).
export function ChatLive({ count }: { count: number }) {
  const router = useRouter();
  const anchor = useRef<HTMLDivElement>(null);

  // Jump to the newest message whenever the count changes.
  useEffect(() => {
    anchor.current?.scrollIntoView({ block: "end" });
  }, [count]);

  // Poll for the other party's messages.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(id);
  }, [router]);

  return <div ref={anchor} />;
}
