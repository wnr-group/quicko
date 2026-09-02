"use client";

import { useEffect, useRef } from "react";
import { markNotificationsReadAction } from "@/app/app/actions";

/** Clears the unread badge once the inbox has been viewed. */
export function MarkNotificationsRead({ hasUnread }: { hasUnread: boolean }) {
  const done = useRef(false);
  useEffect(() => {
    if (!hasUnread || done.current) return;
    done.current = true;
    void markNotificationsReadAction();
  }, [hasUnread]);
  return null;
}
