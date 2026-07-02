"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updateNote } from "@/lib/notes/actions";
import { NOTE_AUTOSAVE_DEBOUNCE_MS } from "@/lib/notes/persistence";
import type { TiptapJson } from "@/lib/notes/types";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export type NoteSaveResult = {
  updatedAt: string;
  title?: string;
};

type UseNoteAutosaveOptions = {
  noteId: number;
  debounceMs?: number;
  onSaved?: (result: NoteSaveResult) => void;
};

export function useNoteAutosave({
  noteId,
  debounceMs = NOTE_AUTOSAVE_DEBOUNCE_MS,
  onSaved,
}: UseNoteAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{
    title?: string;
    content?: TiptapJson;
  } | null>(null);
  const onSavedRef = useRef(onSaved);
  const noteIdRef = useRef(noteId);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  useEffect(() => {
    noteIdRef.current = noteId;
  }, [noteId]);

  const flush = useCallback(async () => {
    const payload = pendingRef.current;
    if (!payload) return;

    const flushNoteId = noteIdRef.current;
    const savedTitle = payload.title;
    pendingRef.current = null;
    setStatus("saving");

    try {
      const saved = await updateNote(flushNoteId, payload);
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
  }, [noteId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      void flush();
    };
  }, [noteId, flush]);

  return { status, schedule, saveNow };
}
