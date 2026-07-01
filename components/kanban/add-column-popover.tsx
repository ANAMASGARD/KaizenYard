"use client";

import { useState } from "react";
import { createColumn } from "@/lib/kanban/actions";
import type { KanbanColor } from "@/lib/kanban/colors";
import type { ColumnRecord } from "@/lib/kanban/types";
import { ColorSwatchPicker } from "@/components/kanban/color-swatch-picker";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Popover } from "@/components/retroui/Popover";

type AddColumnPopoverProps = {
  boardId: number;
  disabled?: boolean;
  onCreated: (column: ColumnRecord) => void;
};

export function AddColumnPopover({
  boardId,
  disabled,
  onCreated,
}: AddColumnPopoverProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<KanbanColor>("purple");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setColor("purple");
    setError(null);
  }

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const column = await createColumn({ boardId, name, color });
      onCreated(column);
      setOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add column");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        setOpen(next);
      }}
    >
      <Popover.Trigger
        render={
          <Button type="button" variant="outline" disabled={disabled}>
            + Add column
          </Button>
        }
      />
      <Popover.Content className="w-72">
        <p className="mb-3 font-head text-sm">Add column</p>
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Review"
            autoFocus
          />
          <ColorSwatchPicker value={color} onChange={setColor} compact />
          {error ? (
            <p className="font-sans text-xs text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <Button
            type="button"
            className="w-full"
            disabled={saving || !name.trim()}
            onClick={() => void handleAdd()}
          >
            {saving ? "Adding…" : "Add"}
          </Button>
        </div>
      </Popover.Content>
    </Popover>
  );
}
