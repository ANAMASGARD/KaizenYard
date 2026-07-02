"use client";

import { useCallback, useState } from "react";

function readStoredSidebarOpen(storageKey: string, defaultOpen: boolean): boolean {
  if (typeof window === "undefined") {
    return defaultOpen;
  }
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      return stored === "true";
    }
  } catch {
    // localStorage unavailable
  }
  return defaultOpen;
}

export function usePersistedSidebarOpen(storageKey: string, defaultOpen = true) {
  const [open, setOpenState] = useState(() => readStoredSidebarOpen(storageKey, defaultOpen));

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
