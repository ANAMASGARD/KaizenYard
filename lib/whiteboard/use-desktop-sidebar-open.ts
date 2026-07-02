"use client";

import { usePersistedSidebarOpen } from "@/lib/use-persisted-sidebar-open";

const STORAGE_KEY = "kaizenyard-whiteboard-sidebar-open";

export function useDesktopSidebarOpen() {
  return usePersistedSidebarOpen(STORAGE_KEY);
}
