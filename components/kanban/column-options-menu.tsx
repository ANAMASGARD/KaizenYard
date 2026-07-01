"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  Palette,
  Pencil,
  Trash2,
} from "lucide-react";
import { COLOR_META, type KanbanColor } from "@/lib/kanban/colors";
import type { ColumnRecord } from "@/lib/kanban/types";
import { ColorSwatchPicker } from "@/components/kanban/color-swatch-picker";
import { Button } from "@/components/retroui/Button";
import { ContextMenu } from "@/components/retroui/ContextMenu";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";

type ColumnOptionsMenuProps = {
  column: ColumnRecord;
  taskCount: number;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onRename: (name: string) => void;
  onChangeColor: (color: KanbanColor) => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDelete: () => void;
};

export function ColumnOptionsMenu({
  column,
  taskCount,
  canMoveLeft,
  canMoveRight,
  onRename,
  onChangeColor,
  onMoveLeft,
  onMoveRight,
  onDelete,
}: ColumnOptionsMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(column.name);
  const [colorValue, setColorValue] = useState<KanbanColor>(column.color);

  const meta = COLOR_META[column.color];

  function submitRename() {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    onRename(trimmed);
    setRenameOpen(false);
  }

  function submitColor() {
    onChangeColor(colorValue);
    setColorOpen(false);
  }

  return (
    <>
      <ContextMenu>
        <ContextMenu.Trigger
          render={
            <button
              type="button"
              className="rounded border-2 border-transparent p-1 text-muted-foreground hover:border-border hover:bg-muted/50"
              aria-label={`Options for ${column.name}`}
            >
              <MoreHorizontal className="size-4" />
            </button>
          }
        />
        <ContextMenu.Content>
          <ContextMenu.Item
            onClick={() => {
              setRenameValue(column.name);
              setRenameOpen(true);
            }}
          >
            <Pencil className="size-4" />
            Rename
          </ContextMenu.Item>
          <ContextMenu.Item
            onClick={() => {
              setColorValue(column.color);
              setColorOpen(true);
            }}
          >
            <Palette className="size-4" />
            Change color
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item disabled={!canMoveLeft} onClick={onMoveLeft}>
            <ArrowLeft className="size-4" />
            Move left
          </ContextMenu.Item>
          <ContextMenu.Item disabled={!canMoveRight} onClick={onMoveRight}>
            <ArrowRight className="size-4" />
            Move right
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item
            className="text-red-600 dark:text-red-400"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
            Delete column
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>

      <span className="sr-only" aria-live="polite">
        {column.name} column, {taskCount} tasks, {meta.label} color
      </span>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <Dialog.Content size="md" className="max-w-sm">
          <Dialog.Header asChild>
            <h2 className="font-head text-lg">Rename column</h2>
          </Dialog.Header>
          <div className="space-y-4 p-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitRename}>Save</Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>

      <Dialog open={colorOpen} onOpenChange={setColorOpen}>
        <Dialog.Content size="md" className="max-w-sm">
          <Dialog.Header asChild>
            <h2 className="font-head text-lg">Change color</h2>
          </Dialog.Header>
          <div className="space-y-4 p-4">
            <ColorSwatchPicker value={colorValue} onChange={setColorValue} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setColorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitColor}>Save</Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
}
