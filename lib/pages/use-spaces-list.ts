"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createSpace, listSpaces } from "@/lib/pages/actions";
import { spaceRecordToListItem } from "@/lib/pages/mappers";
import { initialsFromDisplayName } from "@/lib/pages/initials";
import type { SpaceFilter, SpaceListItem, SpaceSort } from "@/lib/pages/types";

export function useSpacesList() {
  const { user } = useUser();
  const [spaces, setSpaces] = useState<SpaceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SpaceFilter>("all");
  const [sort, setSort] = useState<SpaceSort>("updated");
  const queryRef = useRef(query);
  const filterRef = useRef(filter);
  const sortRef = useRef(sort);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);
  useEffect(() => {
    sortRef.current = sort;
  }, [sort]);

  const refresh = useCallback(async () => {
    const items = await listSpaces({
      query: queryRef.current.trim() || undefined,
      filter: filterRef.current,
      sort: sortRef.current,
    });
    setSpaces(items);
    return items;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await listSpaces();
        if (!cancelled) setSpaces(items);
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
      void refresh();
    }, 250);
    return () => clearTimeout(timer);
  }, [query, filter, sort, refresh]);

  const patchSpace = useCallback(
    (spaceId: number, patch: Partial<SpaceListItem>) => {
      setSpaces((prev) =>
        prev.map((s) => (s.id === spaceId ? { ...s, ...patch } : s)),
      );
    },
    [],
  );

  const removeSpace = useCallback((spaceId: number) => {
    setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
  }, []);

  const createSpaceItem = useCallback(
    async (input?: Parameters<typeof createSpace>[0]) => {
      const created = await createSpace(input);
      const ownerInitials = user
        ? initialsFromDisplayName(
            user.fullName,
            user.primaryEmailAddress?.emailAddress ?? "",
          )
        : "??";
      const item = spaceRecordToListItem(created, ownerInitials);
      setSpaces((prev) => [item, ...prev]);
      return item;
    },
    [user],
  );

  return {
    spaces,
    loading,
    query,
    setQuery,
    filter,
    setFilter,
    sort,
    setSort,
    refresh,
    patchSpace,
    removeSpace,
    createSpaceItem,
  };
}
