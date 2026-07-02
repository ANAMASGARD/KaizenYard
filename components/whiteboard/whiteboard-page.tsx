"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { Menu, PanelLeft, PenTool } from "lucide-react";
import {
  duplicateWhiteboard,
  getWhiteboard,
  softDeleteWhiteboard,
  togglePinWhiteboard,
} from "@/lib/whiteboard/actions";
import { whiteboardRecordToListItem } from "@/lib/whiteboard/mappers";
import { safeUpdateScene } from "@/lib/whiteboard/excalidraw-mount";
import { whiteboardPageRoomId } from "@/lib/whiteboard/room";
import { useDesktopSidebarOpen } from "@/lib/whiteboard/use-desktop-sidebar-open";
import { useWhiteboardList } from "@/lib/whiteboard/use-whiteboard-list";
import type { ExcalidrawElementLike } from "@/lib/whiteboard/scene";
import type { WhiteboardRecord } from "@/lib/whiteboard/types";
import "@/lib/liveblocks/config";
import { AiDiagramDialog } from "@/components/whiteboard/ai-diagram-dialog";
import { KaizenLoadingScreen } from "@/components/loading/kaizen-loading";
import { CollaborationPanel } from "@/components/whiteboard/collaboration-panel";
import { WhiteboardCanvas } from "@/components/whiteboard/whiteboard-canvas";
import { WhiteboardSidebar } from "@/components/whiteboard/whiteboard-sidebar";
import { Button } from "@/components/retroui/Button";
import { Drawer } from "@/components/retroui/Drawer";
import { cn } from "@/lib/utils";

function WhiteboardPageContent() {
  const {
    whiteboards,
    loading,
    query,
    setQuery,
    addWhiteboard,
    patchWhiteboard,
    removeWhiteboard,
    createWhiteboardItem,
  } = useWhiteboardList();

  const { open: desktopSidebarOpen, setOpen: setDesktopSidebarOpen } =
    useDesktopSidebarOpen();

  const [activeWhiteboardId, setActiveWhiteboardId] = useState<number | null>(
    null,
  );
  const [activeWhiteboard, setActiveWhiteboard] =
    useState<WhiteboardRecord | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const pendingAiElementsRef = useRef<ExcalidrawElementLike[] | null>(null);

  const loadActiveWhiteboard = useCallback(async (whiteboardId: number) => {
    const whiteboard = await getWhiteboard(whiteboardId);
    setActiveWhiteboard(whiteboard);
    return whiteboard;
  }, []);

  useEffect(() => {
    if (loading || activeWhiteboardId !== null || whiteboards.length === 0) {
      return;
    }
    const firstId = whiteboards[0].id;
    // Auto-select first board on initial load (mirrors notes-page pattern).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional bootstrap selection
    setActiveWhiteboardId(firstId);
    void loadActiveWhiteboard(firstId);
  }, [activeWhiteboardId, loadActiveWhiteboard, loading, whiteboards]);

  async function selectWhiteboard(whiteboardId: number) {
    setActiveWhiteboardId(whiteboardId);
    setMobileSidebarOpen(false);
    await loadActiveWhiteboard(whiteboardId);
  }

  function handleWhiteboardDeleted(whiteboardId: number) {
    const remaining = whiteboards.filter((w) => w.id !== whiteboardId);
    removeWhiteboard(whiteboardId);

    if (activeWhiteboardId !== whiteboardId) return;

    const fallback = remaining[0]?.id ?? null;
    setActiveWhiteboardId(fallback);
    if (fallback) {
      void loadActiveWhiteboard(fallback);
    } else {
      setActiveWhiteboard(null);
    }
  }

  function handleTitleUpdated(
    whiteboardId: number,
    title: string,
    updatedAt: string,
  ) {
    patchWhiteboard(whiteboardId, { title, updatedAt });
    setActiveWhiteboard((prev) =>
      prev && prev.id === whiteboardId ? { ...prev, title, updatedAt } : prev,
    );
  }

  function handlePinnedUpdated(whiteboardId: number, pinned: boolean) {
    patchWhiteboard(whiteboardId, { pinned });
    setActiveWhiteboard((prev) =>
      prev && prev.id === whiteboardId ? { ...prev, pinned } : prev,
    );
  }

  async function handleDuplicate() {
    if (!activeWhiteboardId) return;
    try {
      const dup = await duplicateWhiteboard(activeWhiteboardId);
      addWhiteboard(whiteboardRecordToListItem(dup));
      await selectWhiteboard(dup.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to duplicate whiteboard");
    }
  }

  async function handleDelete() {
    if (!activeWhiteboard) return;
    if (!confirm(`Delete "${activeWhiteboard.title}"?`)) return;
    try {
      await softDeleteWhiteboard(activeWhiteboard.id);
      handleWhiteboardDeleted(activeWhiteboard.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete whiteboard");
    }
  }

  async function handleTogglePin() {
    if (!activeWhiteboardId) return;
    try {
      const saved = await togglePinWhiteboard(activeWhiteboardId);
      handlePinnedUpdated(activeWhiteboardId, saved.pinned);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to pin whiteboard");
    }
  }

  async function handleEmptyCreate() {
    try {
      const item = await createWhiteboardItem();
      await selectWhiteboard(item.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create whiteboard");
    }
  }

  function applyAiElements(elements: ExcalidrawElementLike[]) {
    const api = excalidrawApiRef.current;
    if (!api) {
      pendingAiElementsRef.current = elements;
      return;
    }
    const existing = api.getSceneElements();
    safeUpdateScene(
      api,
      {
        elements: [...existing, ...elements] as Parameters<
          ExcalidrawImperativeAPI["updateScene"]
        >[0]["elements"],
      },
      () => Boolean(excalidrawApiRef.current),
    );
  }

  function handleApiReady(api: ExcalidrawImperativeAPI) {
    excalidrawApiRef.current = api;
    if (pendingAiElementsRef.current) {
      applyAiElements(pendingAiElementsRef.current);
      pendingAiElementsRef.current = null;
    }
  }

  async function handleExportPng() {
    const api = excalidrawApiRef.current;
    if (!api) return;

    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: api.getAppState(),
        files: api.getFiles(),
        mimeType: "image/png",
        quality: 0.92,
        exportPadding: 20,
      });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${activeWhiteboard?.title ?? "whiteboard"}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export PNG");
    }
  }

  if (loading) {
    return <KaizenLoadingScreen label="Loading whiteboards" />;
  }

  return (
    <div className="-m-4 flex h-[calc(100%+2rem)] min-h-0 flex-col gap-2 overflow-hidden sm:-m-6 sm:h-[calc(100%+3rem)] lg:-m-8 lg:h-[calc(100%+4rem)]">
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="size-4" />
          Whiteboards
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 gap-2">
        {desktopSidebarOpen ? (
          <WhiteboardSidebar
            whiteboards={whiteboards}
            activeWhiteboardId={activeWhiteboardId}
            query={query}
            onQueryChange={setQuery}
            onPatchWhiteboard={patchWhiteboard}
            onSelectWhiteboard={(id) => void selectWhiteboard(id)}
            onWhiteboardCreated={addWhiteboard}
            onWhiteboardDeleted={handleWhiteboardDeleted}
            onCreateWhiteboard={() => createWhiteboardItem()}
            onCollapse={() => setDesktopSidebarOpen(false)}
            className="hidden lg:flex"
          />
        ) : (
          <div className="hidden shrink-0 lg:flex">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-full w-9 rounded border-2 border-border p-0 shadow-none"
              onClick={() => setDesktopSidebarOpen(true)}
              aria-label="Show whiteboard list"
              title="Show whiteboards"
            >
              <PanelLeft className="size-4" />
            </Button>
          </div>
        )}

        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded border-2 border-border bg-background shadow-md",
          )}
        >
          {activeWhiteboard && activeWhiteboardId ? (
            <RoomProvider id={whiteboardPageRoomId(activeWhiteboardId)}>
              <ClientSideSuspense
                fallback={
                  <KaizenLoadingScreen
                    label="Connecting"
                    fullHeight={false}
                    className="min-h-[12rem] flex-1"
                  />
                }
              >
                <WhiteboardCanvas
                  whiteboard={activeWhiteboard}
                  desktopSidebarOpen={desktopSidebarOpen}
                  onExpandSidebar={() => setDesktopSidebarOpen(true)}
                  onTitleUpdated={(title, updatedAt) =>
                    handleTitleUpdated(activeWhiteboard.id, title, updatedAt)
                  }
                  onPinnedUpdated={(pinned) =>
                    handlePinnedUpdated(activeWhiteboard.id, pinned)
                  }
                  onTogglePin={() => void handleTogglePin()}
                  onDuplicate={() => void handleDuplicate()}
                  onDelete={() => void handleDelete()}
                  onShare={() => setCollaborationOpen(true)}
                  onAiDiagram={() => setAiDialogOpen(true)}
                  onExportPng={() => void handleExportPng()}
                  onApiReady={handleApiReady}
                />
              </ClientSideSuspense>
            </RoomProvider>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <PenTool className="size-12 text-muted-foreground" />
              <div>
                <p className="font-head text-lg">No whiteboard selected</p>
                <p className="mt-1 font-sans text-sm text-muted-foreground">
                  Create a whiteboard to sketch, collaborate, and generate
                  diagrams.
                </p>
              </div>
              <Button type="button" onClick={() => void handleEmptyCreate()}>
                New Whiteboard
              </Button>
            </div>
          )}
        </section>
      </div>

      <Drawer open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <Drawer.Content className="inset-y-0 left-0 right-auto mt-0 h-full max-h-screen w-[min(18rem,85vw)] max-w-none rounded-none border-r-2 border-t-0 p-0">
          <WhiteboardSidebar
            whiteboards={whiteboards}
            activeWhiteboardId={activeWhiteboardId}
            query={query}
            onQueryChange={setQuery}
            onPatchWhiteboard={patchWhiteboard}
            onSelectWhiteboard={(id) => void selectWhiteboard(id)}
            onWhiteboardCreated={addWhiteboard}
            onWhiteboardDeleted={handleWhiteboardDeleted}
            onCreateWhiteboard={() => createWhiteboardItem()}
            className="h-full w-full rounded-none border-0 shadow-none"
          />
        </Drawer.Content>
      </Drawer>

      {activeWhiteboard ? (
        <>
          <CollaborationPanel
            whiteboardId={activeWhiteboard.id}
            isOwner={activeWhiteboard.role === "owner"}
            open={collaborationOpen}
            onOpenChange={setCollaborationOpen}
          />
          <AiDiagramDialog
            whiteboardId={activeWhiteboard.id}
            open={aiDialogOpen}
            onOpenChange={setAiDialogOpen}
            onElementsGenerated={applyAiElements}
          />
        </>
      ) : null}
    </div>
  );
}

export function WhiteboardPage() {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <WhiteboardPageContent />
    </LiveblocksProvider>
  );
}
