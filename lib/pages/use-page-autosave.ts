"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updatePage } from "@/lib/pages/actions";
import { PAGE_AUTOSAVE_DEBOUNCE_MS } from "@/lib/pages/persistence";
import type { TiptapJson } from "@/lib/pages/types";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export type PageSaveResult = {
  updatedAt: string;
  title?: string;
};

type UsePageAutosaveOptions = {
  pageId: number;
  debounceMs?: number;
  onSaved?: (result: PageSaveResult) => void;
};

export function usePageAutosave({
  pageId,
  debounceMs = PAGE_AUTOSAVE_DEBOUNCE_MS,
  onSaved,
}: UsePageAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{
    title?: string;
    content?: TiptapJson;
  } | null>(null);
  const onSavedRef = useRef(onSaved);
  const pageIdRef = useRef(pageId);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  useEffect(() => {
    pageIdRef.current = pageId;
  }, [pageId]);

  const flush = useCallback(async () => {
    const payload = pendingRef.current;
    if (!payload) return;

    const flushPageId = pageIdRef.current;
    const savedTitle = payload.title;
    pendingRef.current = null;
    setStatus("saving");

    try {
      const saved = await updatePage(flushPageId, payload);
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
    (patch: { title?: string; content?: TiptapJson }) => {
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
    (patch: { title?: string; content?: TiptapJson }) => {
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
    setStatus("saved");
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [pageId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      void flush();
    };
  }, [pageId, flush]);

  return { status, schedule, saveNow };
}
