"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updateWhiteboard } from "@/lib/whiteboard/actions";
import { WHITEBOARD_AUTOSAVE_DEBOUNCE_MS } from "@/lib/whiteboard/persistence";
import type { WhiteboardScene } from "@/lib/whiteboard/scene";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export type WhiteboardSaveResult = {
  updatedAt: string;
  title?: string;
};

type UseWhiteboardAutosaveOptions = {
  whiteboardId: number;
  debounceMs?: number;
  onSaved?: (result: WhiteboardSaveResult) => void;
};

export function useWhiteboardAutosave({
  whiteboardId,
  debounceMs = WHITEBOARD_AUTOSAVE_DEBOUNCE_MS,
  onSaved,
}: UseWhiteboardAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{
    title?: string;
    content?: WhiteboardScene;
  } | null>(null);
  const onSavedRef = useRef(onSaved);
  const whiteboardIdRef = useRef(whiteboardId);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  useEffect(() => {
    whiteboardIdRef.current = whiteboardId;
  }, [whiteboardId]);

  const flush = useCallback(async () => {
    const payload = pendingRef.current;
    if (!payload) return;

    const flushId = whiteboardIdRef.current;
    const savedTitle = payload.title;
    pendingRef.current = null;
    setStatus("saving");

    try {
      const saved = await updateWhiteboard(flushId, payload);
      setStatus("saved");
      onSavedRef.current?.({
        updatedAt: saved.updatedAt,
        ...(savedTitle !== undefined ? { title: saved.title } : {}),
      });
    } catch {
      setStatus("error");
    }
  }, []);

  const schedule = useCallback(
    (patch: { title?: string; content?: WhiteboardScene }) => {
      pendingRef.current = { ...pendingRef.current, ...patch };
      setStatus("unsaved");

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        void flush();
      }, debounceMs);
    },
    [debounceMs, flush],
  );

  const saveNow = useCallback(
    (patch: { title?: string; content?: WhiteboardScene }) => {
      pendingRef.current = { ...pendingRef.current, ...patch };
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return flush();
    },
    [flush],
  );

  useEffect(() => {
    pendingRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset status when switching boards
    setStatus("saved");
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [whiteboardId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (pendingRef.current) {
        void flush();
      }
    };
  }, [flush]);

  return { status, schedule, saveNow };
}
