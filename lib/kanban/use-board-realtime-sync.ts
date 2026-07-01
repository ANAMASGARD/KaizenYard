"use client";

import { useCallback, useEffect, useRef } from "react";
import { useBroadcastEvent, useEventListener } from "@liveblocks/react/suspense";

const BOARD_CHANGED_EVENT = { type: "board-changed" as const };

export function useBoardRealtimeSync(onRemoteChange: () => void) {
  const broadcast = useBroadcastEvent();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRemoteChangeRef = useRef(onRemoteChange);

  useEffect(() => {
    onRemoteChangeRef.current = onRemoteChange;
  }, [onRemoteChange]);

  useEventListener(({ event }) => {
    if (event.type !== "board-changed") {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onRemoteChangeRef.current();
    }, 300);
  });

  const notifyBoardChanged = useCallback(() => {
    broadcast(BOARD_CHANGED_EVENT);
  }, [broadcast]);

  return { notifyBoardChanged };
}
