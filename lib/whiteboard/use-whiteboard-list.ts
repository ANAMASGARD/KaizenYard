"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createWhiteboard, listWhiteboards } from "@/lib/whiteboard/actions";
import { whiteboardRecordToListItem } from "@/lib/whiteboard/mappers";
import type { WhiteboardListItem } from "@/lib/whiteboard/types";

export function useWhiteboardList() {
  const [whiteboards, setWhiteboards] = useState<WhiteboardListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const queryRef = useRef(query);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const refresh = useCallback(async (searchQuery?: string) => {
    const q = searchQuery ?? queryRef.current.trim();
    const items = await listWhiteboards({ query: q || undefined });
    setWhiteboards(items);
    return items;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await listWhiteboards();
        if (!cancelled) setWhiteboards(items);
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

  const addWhiteboard = useCallback((item: WhiteboardListItem) => {
    setWhiteboards((prev) => {
      if (prev.some((w) => w.id === item.id)) return prev;
      return [item, ...prev];
    });
  }, []);

  const patchWhiteboard = useCallback(
    (whiteboardId: number, patch: Partial<WhiteboardListItem>) => {
      setWhiteboards((prev) =>
        prev.map((w) => (w.id === whiteboardId ? { ...w, ...patch } : w)),
      );
    },
    [],
  );

  const removeWhiteboard = useCallback((whiteboardId: number) => {
    setWhiteboards((prev) => prev.filter((w) => w.id !== whiteboardId));
  }, []);

  const createWhiteboardItem = useCallback(async () => {
    const created = await createWhiteboard();
    const item = whiteboardRecordToListItem(created);
    addWhiteboard(item);
    return item;
  }, [addWhiteboard]);

  return {
    whiteboards,
    loading,
    query,
    setQuery,
    refresh,
    addWhiteboard,
    patchWhiteboard,
    removeWhiteboard,
    createWhiteboardItem,
  };
}
