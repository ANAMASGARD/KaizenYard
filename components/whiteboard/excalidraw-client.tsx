"use client";

import { useEffect, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./whiteboard-excalidraw.css";
import type {
  ExcalidrawImperativeAPI,
  UIOptions,
} from "@excalidraw/excalidraw/types";
import {
  sanitizeAppStateForExcalidraw,
  type WhiteboardScene,
} from "@/lib/whiteboard/scene";
import { whenExcalidrawReady, safeUpdateScene } from "@/lib/whiteboard/excalidraw-mount";

const UI_OPTIONS: Partial<UIOptions> = {
  welcomeScreen: false,
  canvasActions: {
    changeViewBackgroundColor: true,
    clearCanvas: true,
    export: false,
    loadScene: false,
    saveToActiveFile: false,
    toggleTheme: false,
  },
};

const DEFAULT_APP_STATE = {
  showWelcomeScreen: false,
  openMenu: null,
  openSidebar: null,
} as const;

type ExcalidrawClientProps = {
  initialScene: WhiteboardScene;
  viewModeEnabled: boolean;
  zenModeEnabled?: boolean;
  onChange: ExcalidrawImperativeAPI extends never
    ? never
    : NonNullable<Parameters<typeof Excalidraw>[0]["onChange"]>;
  onApiReady: (api: ExcalidrawImperativeAPI) => void;
  onInteractive?: () => void;
  onPointerUpdate?: NonNullable<
    Parameters<typeof Excalidraw>[0]["onPointerUpdate"]
  >;
};

export function ExcalidrawClient({
  initialScene,
  viewModeEnabled,
  zenModeEnabled = false,
  onChange,
  onApiReady,
  onInteractive,
  onPointerUpdate,
}: ExcalidrawClientProps) {
  const reportedRef = useRef(false);
  const interactiveRef = useRef(false);
  const mountedRef = useRef(true);
  const readyCancelRef = useRef<(() => void) | null>(null);
  const onInteractiveRef = useRef(onInteractive);
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  useEffect(() => {
    onInteractiveRef.current = onInteractive;
  }, [onInteractive]);

  useEffect(() => {
    const api = excalidrawApiRef.current;
    if (!api) return;
    safeUpdateScene(api, {
      appState: {
        zenModeEnabled,
      } as Parameters<ExcalidrawImperativeAPI["updateScene"]>[0]["appState"],
    });
  }, [zenModeEnabled]);

  useEffect(() => {
    mountedRef.current = true;
    interactiveRef.current = false;
    reportedRef.current = false;
    return () => {
      mountedRef.current = false;
      readyCancelRef.current?.();
      readyCancelRef.current = null;
    };
  }, [initialScene]);

  function handleChange(
    ...args: Parameters<NonNullable<Parameters<typeof Excalidraw>[0]["onChange"]>>
  ) {
    const appState = args[1];
    if (
      !interactiveRef.current &&
      appState &&
      appState.isLoading === false
    ) {
      interactiveRef.current = true;
      onInteractiveRef.current?.();
    }
    onChange(...args);
  }

  return (
    <div className="kaizenyard-excalidraw">
      <Excalidraw
        excalidrawAPI={(api) => {
          if (reportedRef.current) return;
          reportedRef.current = true;
          readyCancelRef.current?.();
          readyCancelRef.current = whenExcalidrawReady(
            api,
            () => {
              if (!mountedRef.current) return;
              excalidrawApiRef.current = api;
              onApiReady(api);
            },
            () => mountedRef.current,
          );
        }}
        initialData={{
          elements: initialScene.elements as never,
          appState: {
            viewBackgroundColor: "#ffffff",
            ...DEFAULT_APP_STATE,
            ...sanitizeAppStateForExcalidraw(initialScene.appState),
          },
          files: initialScene.files as never,
        }}
        viewModeEnabled={viewModeEnabled}
        zenModeEnabled={zenModeEnabled}
        onChange={handleChange}
        onPointerUpdate={onPointerUpdate}
        UIOptions={UI_OPTIONS}
      />
    </div>
  );
}
