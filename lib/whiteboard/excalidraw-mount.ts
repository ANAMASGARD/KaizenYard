"use client";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

/** Excalidraw hands out the imperative API in its constructor — before React mounts _App. */
export function isExcalidrawReady(api: ExcalidrawImperativeAPI): boolean {
  return api.getAppState().isLoading === false;
}

/**
 * Run `fn` only after Excalidraw has finished its async `initializeScene`
 * (appState.isLoading === false). Polls with rAF until ready or cancelled.
 */
export function whenExcalidrawReady(
  api: ExcalidrawImperativeAPI,
  fn: () => void,
  isActive: () => boolean = () => true,
): () => void {
  let cancelled = false;
  let rafId = 0;

  const tick = () => {
    if (cancelled || !isActive()) return;

    if (!isExcalidrawReady(api)) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    // One extra frame after isLoading clears so React has committed _App.
    rafId = requestAnimationFrame(() => {
      if (cancelled || !isActive() || !isExcalidrawReady(api)) return;
      fn();
    });
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}

export function safeUpdateScene(
  api: ExcalidrawImperativeAPI,
  update: Parameters<ExcalidrawImperativeAPI["updateScene"]>[0],
  isActive: () => boolean = () => true,
): () => void {
  return whenExcalidrawReady(
    api,
    () => {
      if (!isActive() || !isExcalidrawReady(api)) return;
      api.updateScene(update);
    },
    isActive,
  );
}
