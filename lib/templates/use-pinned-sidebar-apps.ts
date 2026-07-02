"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listPinnedGeneratedApps } from "@/lib/templates/actions";
import { PINNED_APPS_CHANGED_EVENT } from "@/lib/templates/pinned-apps-events";
import type { PinnedSidebarApp } from "@/lib/templates/types";

async function fetchPinnedApps(): Promise<PinnedSidebarApp[]> {
  try {
    return await listPinnedGeneratedApps();
  } catch {
    return [];
  }
}

export function usePinnedSidebarApps() {
  const [apps, setApps] = useState<PinnedSidebarApp[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchPinnedApps();
      if (mountedRef.current) setApps(rows);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const rows = await fetchPinnedApps();
        if (!cancelled) setApps(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const onChanged = () => {
      void refreshRef.current();
    };
    window.addEventListener(PINNED_APPS_CHANGED_EVENT, onChanged);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      window.removeEventListener(PINNED_APPS_CHANGED_EVENT, onChanged);
    };
  }, []);

  return { apps, loading, refresh };
}
