"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "kaizenyard:sidebar-collapsed";
const STORAGE_EVENT = "kaizenyard:sidebar-change";

function createCollapsedStore() {
  let hydrated = false;

  function subscribe(onStoreChange: () => void) {
    if (typeof window === "undefined") {
      return () => {};
    }

    if (!hydrated) {
      hydrated = true;
      queueMicrotask(() => onStoreChange());
    }

    window.addEventListener(STORAGE_EVENT, onStoreChange);
    window.addEventListener("storage", onStoreChange);
    return () => {
      window.removeEventListener(STORAGE_EVENT, onStoreChange);
      window.removeEventListener("storage", onStoreChange);
    };
  }

  function getSnapshot() {
    if (!hydrated) {
      return false;
    }
    return localStorage.getItem(STORAGE_KEY) === "true";
  }

  function getServerSnapshot() {
    return false;
  }

  return { subscribe, getSnapshot, getServerSnapshot };
}

const collapsedStore = createCollapsedStore();

function setCollapsedStorage(value: boolean) {
  localStorage.setItem(STORAGE_KEY, String(value));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(
    collapsedStore.subscribe,
    collapsedStore.getSnapshot,
    collapsedStore.getServerSnapshot,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedStorage(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedStorage(!collapsedStore.getSnapshot());
  }, []);

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
      mobileOpen,
      setMobileOpen,
    }),
    [collapsed, mobileOpen, setCollapsed, toggleCollapsed],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
