import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { KanbanColor } from "@/lib/kanban/colors";
import { KANBAN_COLORS } from "@/lib/kanban/colors";

export const STICKY_WIDTH = 200;
export const STICKY_HEIGHT = 160;

const STICKY_FILLS: Record<KanbanColor, string> = {
  yellow: "#fef08a",
  green: "#bbf7d0",
  blue: "#bfdbfe",
  purple: "#e9d5ff",
  pink: "#fbcfe8",
  orange: "#fed7aa",
  cyan: "#a5f3fc",
  emerald: "#a7f3d0",
};

export function createStickyNoteSkeleton(options: {
  x: number;
  y: number;
  color?: KanbanColor;
  text?: string;
}): ExcalidrawElementSkeleton {
  const color = options.color ?? "yellow";
  const fill = STICKY_FILLS[color] ?? STICKY_FILLS.yellow;

  return {
    type: "rectangle",
    x: options.x,
    y: options.y,
    width: STICKY_WIDTH,
    height: STICKY_HEIGHT,
    backgroundColor: fill,
    strokeColor: "#1e1e1e",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    roundness: { type: 3 },
    label: {
      text: options.text ?? "Sticky note",
      fontSize: 20,
      textAlign: "left",
      verticalAlign: "top",
    },
  };
}

export function stickyCenterFromAppState(
  appState: ReturnType<ExcalidrawImperativeAPI["getAppState"]>,
): { x: number; y: number } {
  const zoom = appState.zoom.value;
  return {
    x:
      -appState.scrollX +
      appState.width / zoom / 2 -
      STICKY_WIDTH / 2,
    y:
      -appState.scrollY +
      appState.height / zoom / 2 -
      STICKY_HEIGHT / 2,
  };
}

export function createStickyNoteElements(options: {
  x: number;
  y: number;
  color?: KanbanColor;
  text?: string;
}) {
  const skeleton = createStickyNoteSkeleton(options);
  return convertToExcalidrawElements([skeleton], { regenerateIds: true });
}

export function stickyNoteColors(): KanbanColor[] {
  return [...KANBAN_COLORS];
}
