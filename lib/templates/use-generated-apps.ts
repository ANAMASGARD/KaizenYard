"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteGeneratedApp,
  listGeneratedApps,
  pinGeneratedAppToSidebar,
  unpinGeneratedAppFromSidebar,
} from "@/lib/templates/actions";
import type { GeneratedAppListItem } from "@/lib/templates/types";

export function useGeneratedApps() {
  const [apps, setApps] = useState<GeneratedAppListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listGeneratedApps();
      setApps(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load apps");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listGeneratedApps();
        if (!cancelled) setApps(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load apps");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patchApp = useCallback((id: number, patch: Partial<GeneratedAppListItem>) => {
    setApps((current) =>
      current.map((app) => (app.id === id ? { ...app, ...patch } : app)),
    );
  }, []);

  const removeApp = useCallback((id: number) => {
    setApps((current) => current.filter((app) => app.id !== id));
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      await deleteGeneratedApp(id);
      removeApp(id);
    },
    [removeApp],
  );

  const handlePin = useCallback(
    async (id: number) => {
      const updated = await pinGeneratedAppToSidebar(id);
      patchApp(id, updated);
      return updated;
    },
    [patchApp],
  );

  const handleUnpin = useCallback(
    async (id: number) => {
      const updated = await unpinGeneratedAppFromSidebar(id);
      patchApp(id, updated);
      await refresh();
      return updated;
    },
    [patchApp, refresh],
  );

  const pinnedCount = apps.filter((app) => app.sidebarPinned).length;

  return {
    apps,
    loading,
    error,
    refresh,
    patchApp,
    removeApp,
    handleDelete,
    handlePin,
    handleUnpin,
    pinnedCount,
  };
}
