import { useSyncExternalStore } from "react";

let nowSnapshot = 0;
let intervalId: number | undefined;
const listeners = new Set<() => void>();

function emitChange() {
  const next = Date.now();
  if (next === nowSnapshot) return;
  nowSnapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    nowSnapshot = Date.now();
    intervalId = window.setInterval(emitChange, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId !== undefined) {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }
  };
}

function getSnapshot() {
  return nowSnapshot;
}

function getServerSnapshot() {
  return 0;
}

export function useNowMs() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
