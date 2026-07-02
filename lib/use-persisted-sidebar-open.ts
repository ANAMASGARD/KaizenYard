"use client";

import { useCallback, useEffect, useState } from "react";

export function usePersistedSidebarOpen(storageKey: string, defaultOpen = true) {
  const [open, setOpenState] = useState(defaultOpen);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setOpenState(stored === "true");
      }
    } catch {
      // localStorage unavailable
    }
  }, [storageKey]);

  const setOpen = useCallback(
    (value: boolean) => {
      setOpenState(value);
      try {
        localStorage.setItem(storageKey, String(value));
      } catch {
        // localStorage unavailable
      }
    },
    [storageKey],
  );

  return { open, setOpen };
}
