"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updateGeneratedAppRuntimeState } from "@/lib/templates/actions";
import { RUNTIME_AUTOSAVE_DEBOUNCE_MS } from "@/lib/templates/types";

type UseAppRuntimeOptions = {
  appId: number;
  initialState: Record<string, unknown>;
  debounceMs?: number;
};

export function useAppRuntime({
  appId,
  initialState,
  debounceMs = RUNTIME_AUTOSAVE_DEBOUNCE_MS,
}: UseAppRuntimeOptions) {
  const [runtimeState, setRuntimeState] =
    useState<Record<string, unknown>>(initialState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Record<string, unknown> | null>(null);
  const appIdRef = useRef(appId);

  useEffect(() => {
    appIdRef.current = appId;
  }, [appId]);

  const flush = useCallback(async () => {
    const payload = pendingRef.current;
    if (!payload) return;

    const flushAppId = appIdRef.current;
    if (flushAppId <= 0) {
      pendingRef.current = null;
      return;
    }

    pendingRef.current = null;

    try {
      await updateGeneratedAppRuntimeState(flushAppId, payload);
    } catch {
      pendingRef.current = payload;
    }
  }, []);

  const updateSectionState = useCallback(
    (sectionId: string, value: unknown) => {
      setRuntimeState((current) => {
        const next = { ...current, [sectionId]: value };
        if (appIdRef.current <= 0) {
          return next;
        }

        pendingRef.current = next;

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
          void flush();
        }, debounceMs);

        return next;
      });
    },
    [debounceMs, flush],
  );

  const replaceRuntimeState = useCallback(
    (next: Record<string, unknown>) => {
      setRuntimeState(next);
      if (appIdRef.current <= 0) {
        return;
      }
      pendingRef.current = next;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        void flush();
      }, debounceMs);
    },
    [debounceMs, flush],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      void flush();
    };
  }, [appId, flush]);

  return { runtimeState, updateSectionState, replaceRuntimeState };
}

export function mergeRuntimeWithSample(
  sampleData: Record<string, unknown>,
  runtimeState: Record<string, unknown>,
): Record<string, unknown> {
  return { ...sampleData, ...runtimeState };
}
