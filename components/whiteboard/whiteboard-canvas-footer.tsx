"use client";

import {
  Download,
  HelpCircle,
  Maximize2,
  Minimize2,
  Presentation,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { safeUpdateScene } from "@/lib/whiteboard/excalidraw-mount";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type WhiteboardCanvasFooterProps = {
  excalidrawApi: ExcalidrawImperativeAPI | null;
  zoomLabel: string;
  isFullscreen: boolean;
  isPreviewMode: boolean;
  onToggleFullscreen: () => void;
  onTogglePreview: () => void;
  onExportPng: () => void;
  className?: string;
};

export function WhiteboardCanvasFooter({
  excalidrawApi,
  zoomLabel,
  isFullscreen,
  isPreviewMode,
  onToggleFullscreen,
  onTogglePreview,
  onExportPng,
  className,
}: WhiteboardCanvasFooterProps) {
  function adjustZoom(direction: "in" | "out") {
    if (!excalidrawApi) return;
    const current = excalidrawApi.getAppState().zoom.value;
    const next = direction === "in" ? current * 1.15 : current / 1.15;
    const clamped = Math.min(8, Math.max(0.1, next));
    safeUpdateScene(excalidrawApi, {
      appState: {
        zoom: { value: clamped as typeof current },
      } as Parameters<ExcalidrawImperativeAPI["updateScene"]>[0]["appState"],
    });
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-end gap-2 border-t-2 border-border bg-background px-2 py-1.5 sm:justify-between sm:px-3",
        className,
      )}
    >
      <p className="hidden font-sans text-[10px] text-muted-foreground sm:block">
        Undo / redo in canvas toolbar
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-0.5 rounded border-2 border-border bg-muted/30 p-0.5 shadow-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-7 border-0 p-0 shadow-none"
            onClick={() => adjustZoom("out")}
            aria-label="Zoom out"
            disabled={!excalidrawApi}
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <span className="min-w-[2.75rem] text-center font-head text-xs tabular-nums">
            {zoomLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-7 border-0 p-0 shadow-none"
            onClick={() => adjustZoom("in")}
            aria-label="Zoom in"
            disabled={!excalidrawApi}
          >
            <ZoomIn className="size-3.5" />
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExportPng}
          title="Export PNG"
          className="h-8 px-2"
        >
          <Download className="size-3.5" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTogglePreview}
          title={isPreviewMode ? "Exit preview" : "Preview (zen fullscreen)"}
          className="h-8 px-2"
        >
          <Presentation className="size-3.5" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit full screen" : "Full screen edit"}
          className="h-8 px-2"
        >
          {isFullscreen ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </Button>

        <a
          href="https://docs.excalidraw.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Excalidraw help"
          className="inline-flex h-8 w-8 items-center justify-center rounded border-2 border-border bg-background shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <HelpCircle className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
