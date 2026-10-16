"use client";

import { useEffect, useRef } from "react";
import { markChatReadAction } from "@/app/app/actions";

/** Opening a conversation reads it, so its unread badge clears. */
export function MarkChatRead({ matchId, hasUnread }: { matchId: string; hasUnread: boolean }) {
  const done = useRef(false);
  useEffect(() => {
    if (!hasUnread || done.current) return;
    done.current = true;
    void markChatReadAction(matchId);
  }, [matchId, hasUnread]);
  return null;
}
