"use client";

import { useState } from "react";
import { createBoard, updateBoard } from "@/lib/kanban/actions";
import { COLOR_META, type KanbanColor } from "@/lib/kanban/colors";
import type { BoardData, BoardRecord } from "@/lib/kanban/types";
import { ColorSwatchPicker } from "@/components/kanban/color-swatch-picker";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";

const fieldLabelClass =
  "font-head text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

type BoardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: BoardRecord | null;
  onSaved: (result: BoardData | BoardRecord) => void;
};

type BoardDialogFormProps = {
  editing?: BoardRecord | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (result: BoardData | BoardRecord) => void;
};

function BoardDialogForm({
  editing,
  onOpenChange,
  onSaved,
}: BoardDialogFormProps) {
  const isEdit = Boolean(editing);
  const [name, setName] = useState(editing?.name ?? "");
  const [color, setColor] = useState<KanbanColor>(editing?.color ?? "blue");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit && editing) {
        const saved = await updateBoard(editing.id, { name, color });
        onSaved(saved);
      } else {
        const data = await createBoard({ name, color });
        onSaved(data);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save board");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div className="space-y-2">
        <label htmlFor="board-name" className={fieldLabelClass}>
          Board name
        </label>
        <Input
          id="board-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Website Redesign"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <span className={fieldLabelClass}>Color</span>
        <ColorSwatchPicker value={color} onChange={setColor} />
        <p className="font-sans text-xs text-muted-foreground">
          Selected: {COLOR_META[color].label}
        </p>
      </div>

      {error ? (
        <p className="font-sans text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Saving…" : isEdit ? "Save" : "Create board"}
        </Button>
      </div>
    </form>
  );
}

export function BoardDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: BoardDialogProps) {
  const isEdit = Boolean(editing);
  const formKey = editing ? `edit-${editing.id}` : "new";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content size="md" className="max-w-md">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">
            {isEdit ? "Edit board" : "New board"}
          </h2>
        </Dialog.Header>

        {open ? (
          <BoardDialogForm
            key={formKey}
            editing={editing}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        ) : null}
      </Dialog.Content>
    </Dialog>
  );
}
