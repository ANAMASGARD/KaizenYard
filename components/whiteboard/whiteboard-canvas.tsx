"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import {
  useRoom,
  useSelf,
  useUpdateMyPresence,
  useOthers,
} from "@liveblocks/react/suspense";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import * as Y from "yjs";
import { Minimize2, PanelLeft } from "lucide-react";
import { useExcalidrawYjs } from "@/lib/whiteboard/use-excalidraw-yjs";
import { useWhiteboardAutosave } from "@/lib/whiteboard/use-whiteboard-autosave";
import {
  createStickyNoteElements,
  stickyCenterFromAppState,
} from "@/lib/whiteboard/sticky-note";
import { getWhiteboardCapabilities } from "@/lib/whiteboard/permissions";
import { useFullscreen } from "@/lib/whiteboard/use-fullscreen";
import type { WhiteboardRecord } from "@/lib/whiteboard/types";
import type { SaveStatus } from "@/lib/whiteboard/use-whiteboard-autosave";
import { ExcalidrawClient } from "@/components/whiteboard/excalidraw-client";
import { WhiteboardCanvasFooter } from "@/components/whiteboard/whiteboard-canvas-footer";
import { WhiteboardHeader } from "@/components/whiteboard/whiteboard-header";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";
import {
  isExcalidrawReady,
  safeUpdateScene,
  whenExcalidrawReady,
} from "@/lib/whiteboard/excalidraw-mount";
import "./whiteboard-excalidraw.css";

type FullscreenMode = "none" | "edit" | "preview";

type WhiteboardCanvasProps = {
  whiteboard: WhiteboardRecord;
  desktopSidebarOpen: boolean;
  onExpandSidebar: () => void;
  onTitleUpdated: (title: string, updatedAt: string) => void;
  onPinnedUpdated: (pinned: boolean) => void;
  onTogglePin: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onShare: () => void;
  onAiDiagram: () => void;
  onExportPng: () => void;
  onApiReady: (api: ExcalidrawImperativeAPI) => void;
};

function formatZoomLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function WhiteboardCanvasInner({
  whiteboard,
  desktopSidebarOpen,
  onExpandSidebar,
  onTitleUpdated,
  onTogglePin,
  onDuplicate,
  onDelete,
  onShare,
  onAiDiagram,
  onExportPng,
  onApiReady,
  yDoc,
  provider,
}: WhiteboardCanvasProps & {
  yDoc: Y.Doc;
  provider: LiveblocksYjsProvider;
}) {
  const [excalidrawApi, setExcalidrawApi] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [excalidrawInteractive, setExcalidrawInteractive] = useState(false);
  const [zoomLabel, setZoomLabel] = useState("100%");
  const [lastEdited, setLastEdited] = useState(whiteboard.updatedAt);
  const [fullscreenMode, setFullscreenMode] = useState<FullscreenMode>("none");
  const updatePresence = useUpdateMyPresence();
  const others = useOthers();
  const self = useSelf();
  const apiReadyRef = useRef(onApiReady);
  const mountedRef = useRef(true);
  const {
    ref: fullscreenRef,
    isFullscreen,
    toggle: toggleFullscreen,
    exit: exitFullscreen,
  } = useFullscreen<HTMLDivElement>();

  const isPreviewMode = fullscreenMode === "preview";
  const isEditFullscreen = fullscreenMode === "edit";
  const hideChrome = isFullscreen;

  useEffect(() => {
    mountedRef.current = true;
    queueMicrotask(() => {
      if (!mountedRef.current) return;
      setExcalidrawInteractive(false);
      setFullscreenMode("none");
      setLastEdited(whiteboard.updatedAt);
    });
    return () => {
      mountedRef.current = false;
    };
  }, [whiteboard.id, whiteboard.updatedAt]);

  useEffect(() => {
    apiReadyRef.current = onApiReady;
  }, [onApiReady]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isFullscreen) {
        void exitFullscreen();
        setFullscreenMode("none");
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [exitFullscreen, isFullscreen]);

  useEffect(() => {
    if (isFullscreen || fullscreenMode === "none") return;
    queueMicrotask(() => setFullscreenMode("none"));
  }, [fullscreenMode, isFullscreen]);

  const { canEdit } = getWhiteboardCapabilities(whiteboard.role);
  const readOnly = !canEdit;

  const { status, schedule } = useWhiteboardAutosave({
    whiteboardId: whiteboard.id,
    onSaved: (result) => {
      setLastEdited(result.updatedAt);
      onTitleUpdated(result.title ?? whiteboard.title, result.updatedAt);
    },
  });

  const handleScenePersist = useCallback(
    (scene: NonNullable<Parameters<typeof schedule>[0]["content"]>) => {
      schedule({ content: scene });
    },
    [schedule],
  );

  const { handleChange } = useExcalidrawYjs({
    yDoc,
    provider,
    initialScene: whiteboard.content,
    excalidrawApi,
    readOnly,
    canApplyToCanvas: excalidrawInteractive,
    onSceneChange: handleScenePersist,
  });

  useEffect(() => {
    if (!excalidrawApi || !excalidrawInteractive) return;

    const collaborators = new Map<
      string,
      {
        username?: string;
        pointer?: { x: number; y: number };
        color?: string;
      }
    >();

    for (const other of others) {
      const cursor = other.presence?.cursor;
      if (!cursor) continue;
      collaborators.set(String(other.connectionId), {
        username: other.info?.name ?? "Collaborator",
        pointer: cursor,
        color: other.info?.color,
      });
    }

    return safeUpdateScene(
      excalidrawApi,
      {
        collaborators: collaborators as Parameters<
          ExcalidrawImperativeAPI["updateScene"]
        >[0]["collaborators"],
      },
      () => mountedRef.current && excalidrawInteractive,
    );
  }, [excalidrawApi, excalidrawInteractive, others, self?.connectionId]);

  function handleTitleChange(title: string) {
    schedule({ title });
    onTitleUpdated(title, new Date().toISOString());
  }

  function handleAddStickyNote() {
    if (!excalidrawApi || !excalidrawInteractive || readOnly) return;
    if (!isExcalidrawReady(excalidrawApi)) return;

    const appState = excalidrawApi.getAppState();
    const center = stickyCenterFromAppState(appState);
    const sticky = createStickyNoteElements({
      ...center,
      color: whiteboard.color,
    });
    const existing = excalidrawApi.getSceneElements();

    whenExcalidrawReady(
      excalidrawApi,
      () => {
        if (!mountedRef.current || !excalidrawApi) return;
        excalidrawApi.updateScene({
          elements: [...existing, ...sticky] as Parameters<
            ExcalidrawImperativeAPI["updateScene"]
          >[0]["elements"],
          appState: {
            selectedElementIds: Object.fromEntries(
              sticky.map((element) => [element.id, true]),
            ),
          } as Parameters<ExcalidrawImperativeAPI["updateScene"]>[0]["appState"],
        });
        excalidrawApi.scrollToContent(sticky, {
          fitToContent: true,
          animate: true,
        });
      },
      () => mountedRef.current,
    );
  }

  function handleApiReady(api: ExcalidrawImperativeAPI) {
    setExcalidrawApi(api);
    apiReadyRef.current(api);
  }

  async function enterFullscreen(mode: "edit" | "preview") {
    setFullscreenMode(mode);
    await toggleFullscreen();
  }

  async function exitFullscreenMode() {
    setFullscreenMode("none");
    await exitFullscreen();
  }

  async function handleToggleEditFullscreen() {
    if (isFullscreen && isEditFullscreen) {
      await exitFullscreenMode();
      return;
    }
    if (isFullscreen) {
      await exitFullscreen();
    }
    await enterFullscreen("edit");
  }

  async function handleTogglePreview() {
    if (isFullscreen && isPreviewMode) {
      await exitFullscreenMode();
      return;
    }
    if (isFullscreen) {
      await exitFullscreen();
    }
    await enterFullscreen("preview");
  }

  const handleExcalidrawChange = useCallback(
    (...args: Parameters<typeof handleChange>) => {
      const appState = args[1];
      if (appState?.zoom?.value) {
        setZoomLabel(formatZoomLabel(appState.zoom.value));
      }
      handleChange(...args);
    },
    [handleChange],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {!hideChrome ? (
        <div className="relative shrink-0 border-b-2 border-border px-2 py-2 sm:px-3">
          {!desktopSidebarOpen ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute left-2 top-2 z-10 h-8 w-8 p-0 shadow-sm hover:translate-y-0 active:translate-y-0 active:translate-x-0 lg:left-3"
              onClick={onExpandSidebar}
              aria-label="Show whiteboard list"
              title="Show whiteboards"
            >
              <PanelLeft className="size-3.5" />
            </Button>
          ) : null}
          <div className={cn(!desktopSidebarOpen && "pl-10 lg:pl-11")}>
            <WhiteboardHeader
              title={whiteboard.title}
              pinned={whiteboard.pinned}
              whiteboardRole={whiteboard.role}
              saveStatus={status as SaveStatus}
              lastEdited={lastEdited}
              onTitleChange={handleTitleChange}
              onTogglePin={onTogglePin}
              onShare={onShare}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onAiDiagram={onAiDiagram}
              onExportPng={onExportPng}
              onAddSticky={canEdit ? handleAddStickyNote : undefined}
            />
          </div>
        </div>
      ) : null}

      <div
        ref={fullscreenRef}
        className={cn(
          "kaizenyard-excalidraw--fullscreen relative flex min-h-0 flex-1 flex-col overflow-hidden border-border bg-background",
          !isFullscreen && "border-t-0",
          isFullscreen && "fixed inset-0 z-[200] border-0",
          isPreviewMode && "kaizenyard-excalidraw--preview",
        )}
      >
        {isEditFullscreen ? (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b-2 border-border bg-background px-3 py-1.5">
            <p className="truncate font-head text-sm">{whiteboard.title}</p>
            <div className="flex items-center gap-2">
              {canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStickyNote}
                >
                  Sticky
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void exitFullscreenMode()}
              >
                <Minimize2 className="size-4" />
                Exit
              </Button>
            </div>
          </div>
        ) : null}

        {isPreviewMode ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute right-3 top-3 z-[210] shadow-sm"
            onClick={() => void exitFullscreenMode()}
          >
            <Minimize2 className="size-4" />
            Exit preview
          </Button>
        ) : null}

        <div
          className={cn(
            "min-h-0 flex-1",
            readOnly && "opacity-95",
          )}
        >
          <ExcalidrawClient
            initialScene={whiteboard.content}
            viewModeEnabled={readOnly}
            zenModeEnabled={isPreviewMode}
            onChange={handleExcalidrawChange}
            onApiReady={handleApiReady}
            onInteractive={() => setExcalidrawInteractive(true)}
            onPointerUpdate={({ pointer, button }) => {
              if (button === "up") {
                updatePresence({ cursor: null });
              } else {
                updatePresence({ cursor: { x: pointer.x, y: pointer.y } });
              }
            }}
          />
        </div>

        {!isPreviewMode ? (
          <WhiteboardCanvasFooter
            excalidrawApi={excalidrawInteractive ? excalidrawApi : null}
            zoomLabel={zoomLabel}
            isFullscreen={isEditFullscreen}
            isPreviewMode={isPreviewMode}
            onToggleFullscreen={() => void handleToggleEditFullscreen()}
            onTogglePreview={() => void handleTogglePreview()}
            onExportPng={onExportPng}
          />
        ) : null}
      </div>
    </div>
  );
}

function WhiteboardCanvasSession(props: WhiteboardCanvasProps) {
  const room = useRoom();
  const yDoc = useMemo(() => new Y.Doc(), []);
  const provider = useMemo(
    () => new LiveblocksYjsProvider(room, yDoc),
    [room, yDoc],
  );

  useEffect(() => {
    return () => {
      provider.destroy();
      yDoc.destroy();
    };
  }, [provider, yDoc]);

  return <WhiteboardCanvasInner {...props} yDoc={yDoc} provider={provider} />;
}

export function WhiteboardCanvas(props: WhiteboardCanvasProps) {
  return <WhiteboardCanvasSession key={props.whiteboard.id} {...props} />;
}
