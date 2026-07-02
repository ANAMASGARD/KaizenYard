"use client";

import {
  Copy,
  PanelLeftClose,
  Palette,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  duplicateWhiteboard,
  setWhiteboardColor,
  softDeleteWhiteboard,
  togglePinWhiteboard,
  updateWhiteboard,
} from "@/lib/whiteboard/actions";
import { whiteboardRecordToListItem } from "@/lib/whiteboard/mappers";
import { getWhiteboardCapabilities } from "@/lib/whiteboard/permissions";
import type { KanbanColor } from "@/lib/kanban/colors";
import type { WhiteboardListItem } from "@/lib/whiteboard/types";
import { Button } from "@/components/retroui/Button";
import { ContextMenu } from "@/components/retroui/ContextMenu";
import { Input } from "@/components/retroui/Input";
import { Popover } from "@/components/retroui/Popover";
import { ColorSwatchPicker } from "@/components/notes/color-swatch-picker";
import { WhiteboardListItemRow } from "@/components/whiteboard/whiteboard-list-item";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type BoardFilter = "all" | "mine" | "shared";

type WhiteboardSidebarProps = {
  whiteboards: WhiteboardListItem[];
  activeWhiteboardId: number | null;
  query: string;
  onQueryChange: (query: string) => void;
  onPatchWhiteboard: (
    whiteboardId: number,
    patch: Partial<WhiteboardListItem>,
  ) => void;
  onSelectWhiteboard: (whiteboardId: number) => void;
  onWhiteboardCreated: (whiteboard: WhiteboardListItem) => void;
  onWhiteboardDeleted: (whiteboardId: number) => void;
  onCreateWhiteboard: () => Promise<WhiteboardListItem>;
  onCollapse?: () => void;
  className?: string;
};

export function WhiteboardSidebar({
  whiteboards,
  activeWhiteboardId,
  query,
  onQueryChange,
  onPatchWhiteboard,
  onSelectWhiteboard,
  onWhiteboardCreated,
  onWhiteboardDeleted,
  onCreateWhiteboard,
  onCollapse,
  className,
}: WhiteboardSidebarProps) {
  const [colorBoardId, setColorBoardId] = useState<number | null>(null);
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");

  const filteredWhiteboards = useMemo(() => {
    return whiteboards.filter((board) => {
      if (boardFilter === "mine" && board.role !== "owner") return false;
      if (boardFilter === "shared" && board.role === "owner") return false;
      return true;
    });
  }, [boardFilter, whiteboards]);

  async function handleNewWhiteboard() {
    try {
      const item = await onCreateWhiteboard();
      onSelectWhiteboard(item.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create whiteboard");
    }
  }

  async function handleRename(whiteboard: WhiteboardListItem) {
    const title = prompt("Rename whiteboard", whiteboard.title);
    if (!title?.trim()) return;
    try {
      const saved = await updateWhiteboard(whiteboard.id, {
        title: title.trim(),
      });
      onPatchWhiteboard(whiteboard.id, {
        title: saved.title,
        updatedAt: saved.updatedAt,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rename whiteboard");
    }
  }

  async function handleDuplicate(whiteboardId: number) {
    try {
      const dup = await duplicateWhiteboard(whiteboardId);
      const item = whiteboardRecordToListItem(dup);
      onWhiteboardCreated(item);
      onSelectWhiteboard(dup.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to duplicate whiteboard");
    }
  }

  async function handleTogglePin(whiteboardId: number) {
    try {
      const saved = await togglePinWhiteboard(whiteboardId);
      onPatchWhiteboard(whiteboardId, {
        pinned: saved.pinned,
        updatedAt: saved.updatedAt,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to pin whiteboard");
    }
  }

  async function handleColorChange(whiteboardId: number, color: KanbanColor) {
    try {
      const saved = await setWhiteboardColor(whiteboardId, color);
      onPatchWhiteboard(whiteboardId, {
        color: saved.color,
        updatedAt: saved.updatedAt,
      });
      setColorBoardId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update color");
    }
  }

  async function handleDelete(whiteboard: WhiteboardListItem) {
    if (!confirm(`Delete "${whiteboard.title}"?`)) return;
    try {
      await softDeleteWhiteboard(whiteboard.id);
      onWhiteboardDeleted(whiteboard.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete whiteboard");
    }
  }

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col gap-3 rounded border-2 border-border bg-background p-3 shadow-md lg:w-72",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Your Whiteboards
        </p>
        {onCollapse ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-7 shrink-0 p-0 shadow-none"
            onClick={onCollapse}
            aria-label="Collapse whiteboard list"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="size-3.5" />
          </Button>
        ) : null}
      </div>
      <Button
        type="button"
        className="w-full justify-center gap-2"
        onClick={() => void handleNewWhiteboard()}
      >
        <Plus className="size-4" />
        New Whiteboard
      </Button>

      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search whiteboards…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <select
          value={boardFilter}
          onChange={(e) => setBoardFilter(e.target.value as BoardFilter)}
          className="h-8 w-full rounded border-2 border-border bg-background px-2 font-sans text-xs shadow-sm"
          aria-label="Filter whiteboards"
        >
          <option value="all">All boards</option>
          <option value="mine">My boards</option>
          <option value="shared">Shared with me</option>
        </select>
      </div>

      <p className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Recent
      </p>

      <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {filteredWhiteboards.length === 0 ? (
          <p className="px-2 py-4 font-sans text-xs text-muted-foreground">
            No whiteboards match this filter.
          </p>
        ) : (
          filteredWhiteboards.map((whiteboard) => {
            const { canEdit, canTrash } = getWhiteboardCapabilities(
              whiteboard.role,
            );

            return (
              <ContextMenu key={whiteboard.id}>
                <ContextMenu.Trigger
                  render={
                    <div>
                      <WhiteboardListItemRow
                        whiteboard={whiteboard}
                        active={whiteboard.id === activeWhiteboardId}
                        onSelect={() => onSelectWhiteboard(whiteboard.id)}
                      />
                    </div>
                  }
                />
                <ContextMenu.Content>
                  {canEdit ? (
                    <>
                      <ContextMenu.Item
                        onClick={() => void handleRename(whiteboard)}
                      >
                        Rename
                      </ContextMenu.Item>
                      <ContextMenu.Item
                        onClick={() => void handleDuplicate(whiteboard.id)}
                      >
                        <Copy className="size-3.5" />
                        Duplicate
                      </ContextMenu.Item>
                      <ContextMenu.Item
                        onClick={() => void handleTogglePin(whiteboard.id)}
                      >
                        <Pin className="size-3.5" />
                        {whiteboard.pinned ? "Unpin" : "Pin"}
                      </ContextMenu.Item>
                      <ContextMenu.Item
                        onClick={() => setColorBoardId(whiteboard.id)}
                      >
                        <Palette className="size-3.5" />
                        Change color
                      </ContextMenu.Item>
                    </>
                  ) : null}
                  {canTrash ? (
                    <ContextMenu.Item
                      onClick={() => void handleDelete(whiteboard)}
                      className="text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </ContextMenu.Item>
                  ) : null}
                </ContextMenu.Content>
              </ContextMenu>
            );
          })
        )}
      </nav>

      {colorBoardId !== null ? (
        <Popover
          open
          onOpenChange={(open) => {
            if (!open) setColorBoardId(null);
          }}
        >
          <Popover.Trigger render={<span className="sr-only">Color</span>} />
          <Popover.Content className="p-3">
            <ColorSwatchPicker
              value={
                whiteboards.find((w) => w.id === colorBoardId)?.color ?? "yellow"
              }
              onChange={(color) => void handleColorChange(colorBoardId, color)}
              compact
            />
          </Popover.Content>
        </Popover>
      ) : null}
    </aside>
  );
}
