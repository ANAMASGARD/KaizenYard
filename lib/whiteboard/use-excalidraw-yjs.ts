"use client";

import { useCallback, useEffect, useRef } from "react";
import type { LiveblocksYjsProvider } from "@liveblocks/yjs";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { Excalidraw } from "@excalidraw/excalidraw";
import type * as Y from "yjs";
import {
  EMPTY_WHITEBOARD_SCENE,
  isSceneEmpty,
  parseWhiteboardScene,
  sanitizeAppStateForExcalidraw,
  sanitizeAppStateForPersistence,
  type WhiteboardScene,
} from "@/lib/whiteboard/scene";
import { safeUpdateScene, whenExcalidrawReady } from "@/lib/whiteboard/excalidraw-mount";

const YJS_KEYS = {
  elements: "elements",
  appState: "appState",
  files: "files",
} as const;

type UseExcalidrawYjsOptions = {
  yDoc: Y.Doc;
  provider: LiveblocksYjsProvider;
  initialScene: WhiteboardScene;
  excalidrawApi: ExcalidrawImperativeAPI | null;
  readOnly: boolean;
  canApplyToCanvas: boolean;
  onSceneChange: (scene: WhiteboardScene) => void;
};

function readSceneFromYMap(yMap: Y.Map<string>): WhiteboardScene | null {
  const elementsRaw = yMap.get(YJS_KEYS.elements);
  const appStateRaw = yMap.get(YJS_KEYS.appState);
  const filesRaw = yMap.get(YJS_KEYS.files);

  if (!elementsRaw && !appStateRaw && !filesRaw) {
    return null;
  }

  try {
    return parseWhiteboardScene({
      elements: elementsRaw ? JSON.parse(elementsRaw) : [],
      appState: appStateRaw ? JSON.parse(appStateRaw) : {},
      files: filesRaw ? JSON.parse(filesRaw) : {},
    });
  } catch {
    return null;
  }
}

function writeSceneToYMap(yMap: Y.Map<string>, scene: WhiteboardScene): void {
  const sanitized = {
    elements: scene.elements,
    appState: sanitizeAppStateForPersistence(scene.appState),
    files: scene.files,
  };
  yMap.set(YJS_KEYS.elements, JSON.stringify(sanitized.elements));
  yMap.set(YJS_KEYS.appState, JSON.stringify(sanitized.appState));
  yMap.set(YJS_KEYS.files, JSON.stringify(sanitized.files));
}

export function useExcalidrawYjs({
  yDoc,
  provider,
  initialScene,
  excalidrawApi,
  readOnly,
  canApplyToCanvas,
  onSceneChange,
}: UseExcalidrawYjsOptions) {
  const seededRef = useRef(false);
  const applyingRemoteRef = useRef(false);
  const onSceneChangeRef = useRef(onSceneChange);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    onSceneChangeRef.current = onSceneChange;
  }, [onSceneChange]);

  const applySceneToCanvas = useCallback(
    (scene: WhiteboardScene) => {
      if (!excalidrawApi || !canApplyToCanvas) return;

      return whenExcalidrawReady(
        excalidrawApi,
        () => {
          if (!mountedRef.current || !excalidrawApi || !canApplyToCanvas) {
            return;
          }
          applyingRemoteRef.current = true;
          excalidrawApi.updateScene({
            elements: scene.elements as unknown as Parameters<
              ExcalidrawImperativeAPI["updateScene"]
            >[0]["elements"],
            appState: sanitizeAppStateForExcalidraw(
              scene.appState,
            ) as unknown as Parameters<
              ExcalidrawImperativeAPI["updateScene"]
            >[0]["appState"],
          });
          if (Object.keys(scene.files).length > 0) {
            excalidrawApi.addFiles(
              scene.files as unknown as Parameters<
                ExcalidrawImperativeAPI["addFiles"]
              >[0],
            );
          }
          requestAnimationFrame(() => {
            applyingRemoteRef.current = false;
          });
        },
        () =>
          mountedRef.current && Boolean(excalidrawApi) && canApplyToCanvas,
      );
    },
    [canApplyToCanvas, excalidrawApi],
  );

  useEffect(() => {
    const yMap = yDoc.getMap<string>("scene");

    const seedIfNeeded = () => {
      if (seededRef.current) return;

      const existing = readSceneFromYMap(yMap);
      if (existing && !isSceneEmpty(existing)) {
        seededRef.current = true;
        applySceneToCanvas(existing);
        return;
      }

      const seed = parseWhiteboardScene(initialScene);
      if (!isSceneEmpty(seed)) {
        writeSceneToYMap(yMap, seed);
        applySceneToCanvas(seed);
      }
      seededRef.current = true;
    };

    if (provider.synced) {
      seedIfNeeded();
    }

    const onSync = (synced: boolean) => {
      if (synced) seedIfNeeded();
    };

    provider.on("sync", onSync);

    const onYMapChange = () => {
      if (applyingRemoteRef.current) return;
      const scene = readSceneFromYMap(yMap);
      if (!scene) return;
      applySceneToCanvas(scene);
      onSceneChangeRef.current(scene);
    };

    yMap.observe(onYMapChange);

    return () => {
      provider.off("sync", onSync);
      yMap.unobserve(onYMapChange);
    };
  }, [applySceneToCanvas, canApplyToCanvas, initialScene, provider, yDoc]);

  useEffect(() => {
    if (!canApplyToCanvas) return;
    const yMap = yDoc.getMap<string>("scene");
    const existing = readSceneFromYMap(yMap);
    if (existing && !isSceneEmpty(existing) && seededRef.current) {
      applySceneToCanvas(existing);
    }
  }, [applySceneToCanvas, canApplyToCanvas, yDoc]);

  const handleChange = useCallback(
    (
      elements: Parameters<
        NonNullable<Parameters<typeof Excalidraw>[0]["onChange"]>
      >[0],
      appState: Parameters<
        NonNullable<Parameters<typeof Excalidraw>[0]["onChange"]>
      >[1],
      files: Parameters<
        NonNullable<Parameters<typeof Excalidraw>[0]["onChange"]>
      >[2],
    ) => {
      if (readOnly || applyingRemoteRef.current) return;

      const scene: WhiteboardScene = {
        elements: [...elements] as WhiteboardScene["elements"],
        appState: sanitizeAppStateForPersistence(
          appState as unknown as Record<string, unknown>,
        ),
        files: { ...files } as Record<string, unknown>,
      };

      const yMap = yDoc.getMap<string>("scene");
      writeSceneToYMap(yMap, scene);
      onSceneChangeRef.current(scene);
    },
    [readOnly, yDoc],
  );

  return { handleChange };
}

export { EMPTY_WHITEBOARD_SCENE };
