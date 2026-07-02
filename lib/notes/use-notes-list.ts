"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createNote, listNotes } from "@/lib/notes/actions";
import { noteRecordToListItem } from "@/lib/notes/mappers";
import type { NoteListItem } from "@/lib/notes/types";

export function useNotesList() {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const queryRef = useRef(query);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const refresh = useCallback(async (searchQuery?: string) => {
    const q = searchQuery ?? queryRef.current.trim();
    const items = await listNotes({ query: q || undefined });
    setNotes(items);
    return items;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await listNotes();
        if (!cancelled) setNotes(items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh(query.trim() || undefined);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, refresh]);

  const addNote = useCallback((item: NoteListItem) => {
    setNotes((prev) => {
      if (prev.some((n) => n.id === item.id)) return prev;
      return [item, ...prev];
    });
  }, []);

  const patchNote = useCallback(
    (noteId: number, patch: Partial<NoteListItem>) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
      );
    },
    [],
  );

  const removeNote = useCallback((noteId: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  const createNoteItem = useCallback(async () => {
    const created = await createNote();
    const item = noteRecordToListItem(created);
    addNote(item);
    return item;
  }, [addNote]);

  return {
    notes,
    loading,
    query,
    setQuery,
    refresh,
    addNote,
    patchNote,
    removeNote,
    createNoteItem,
  };
}
