"use client";

import { useState, type ChangeEvent } from "react";
import { createTask, deleteTask, updateTask } from "@/lib/kanban/actions";
import {
  KANBAN_PRIORITIES,
  PRIORITY_META,
  type KanbanPriority,
} from "@/lib/kanban/labels";
import { useUserCategories } from "@/lib/settings/use-user-categories";
import { fallbackCategoryMeta } from "@/lib/settings/category-resolver";
import type { BoardRole } from "@/lib/kanban/room";
import type { TaskDialogDefaults, TaskRecord } from "@/lib/kanban/types";
import { TaskComments } from "@/components/kanban/task-comments";
import { TaskPulsePanel } from "@/components/kanban/task-pulse-panel";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Switch } from "@/components/retroui/Switch";
import { Textarea } from "@/components/retroui/Textarea";
import { cn } from "@/lib/utils";

const fieldLabelClass =
  "font-head text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

function todayDateInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoFromDateInput(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  return date.toISOString();
}

function dateInputFromIso(iso: string | null): string {
  if (!iso) return todayDateInputValue();
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type TaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults: TaskDialogDefaults | null;
  boardRole: BoardRole;
  onSaved: (task: TaskRecord) => void;
  onDeleted?: (taskId: number) => void;
};

type TaskDialogFormProps = {
  defaults: TaskDialogDefaults | null;
  boardRole: BoardRole;
  onOpenChange: (open: boolean) => void;
  onSaved: (task: TaskRecord) => void;
  onDeleted?: (taskId: number) => void;
};

function TaskDialogForm({
  defaults,
  boardRole,
  onOpenChange,
  onSaved,
  onDeleted,
}: TaskDialogFormProps) {
  const editing = defaults?.task;
  const readOnly = boardRole === "viewer";
  const { categories, metaByKey } = useUserCategories("kanban");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [dueDate, setDueDate] = useState(
    dateInputFromIso(editing?.dueDate ?? null),
  );
  const [priority, setPriority] = useState<KanbanPriority>(
    editing?.priority ?? "medium",
  );
  const [labels, setLabels] = useState<string[]>(editing?.labels ?? []);
  const [syncCalendar, setSyncCalendar] = useState(editing?.syncCalendar ?? false);
  const [linkNotes, setLinkNotes] = useState(editing?.linkNotes ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleLabel(label: string) {
    setLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || readOnly) return;

    setSaving(true);
    setError(null);

    const payload = {
      title,
      description: description.trim() || null,
      dueDate: isoFromDateInput(dueDate),
      priority,
      labels,
      syncCalendar,
      linkNotes,
    };

    try {
      if (editing) {
        const saved = await updateTask(editing.id, payload);
        onSaved(saved);
      } else if (defaults?.columnId) {
        const saved = await createTask({
          columnId: defaults.columnId,
          ...payload,
          description: description.trim() || undefined,
        });
        onSaved(saved);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing || !onDeleted || readOnly) return;
    if (!confirm(`Delete "${editing.title}"?`)) return;
    setSaving(true);
    try {
      await deleteTask(editing.id);
      onDeleted(editing.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div className="space-y-2">
        <label htmlFor="task-title" className={fieldLabelClass}>
          Title
        </label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Research user needs"
          required
          autoFocus
          readOnly={readOnly}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="task-description" className={fieldLabelClass}>
          Description
        </label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          placeholder="Optional details…"
          rows={3}
          readOnly={readOnly}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="task-due" className={fieldLabelClass}>
            Due date
          </label>
          <Input
            id="task-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            readOnly={readOnly}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="task-priority" className={fieldLabelClass}>
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as KanbanPriority)}
            className="w-full rounded border-2 border-border px-3 py-2 font-sans text-sm shadow-sm"
            disabled={readOnly}
          >
            {KANBAN_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <span className={fieldLabelClass}>Labels</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const label = category.key;
            const selected = labels.includes(label);
            const meta = metaByKey[label] ?? fallbackCategoryMeta(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleLabel(label)}
                disabled={readOnly}
                className={cn(
                  "rounded border-2 border-border px-2 py-1 font-sans text-xs shadow-sm transition-transform",
                  meta.bgClass,
                  meta.textClass,
                  selected && "ring-2 ring-foreground ring-offset-1 shadow-md",
                  !selected && "opacity-70 hover:opacity-100",
                )}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 rounded border-2 border-border bg-muted/20 p-3">
        <label className="flex items-center justify-between gap-3">
          <span className="font-sans text-sm">Sync with Calendar</span>
          <Switch
            checked={syncCalendar}
            onCheckedChange={setSyncCalendar}
            disabled={readOnly}
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="font-sans text-sm">Link with Notes</span>
          <Switch
            checked={linkNotes}
            onCheckedChange={setLinkNotes}
            disabled={readOnly}
          />
        </label>
      </div>

      {editing ? <TaskPulsePanel taskId={editing.id} /> : null}
      {editing ? (
        <TaskComments taskId={editing.id} boardRole={boardRole} />
      ) : null}

      {error ? (
        <p className="font-sans text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {editing && onDeleted && !readOnly ? (
          <Button
            type="button"
            variant="outline"
            className="text-red-600 dark:text-red-400"
            onClick={() => void handleDelete()}
            disabled={saving}
          >
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly ? (
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  defaults,
  boardRole,
  onSaved,
  onDeleted,
}: TaskDialogProps) {
  const editing = defaults?.task;
  const readOnly = boardRole === "viewer";
  const formKey = editing
    ? `edit-${editing.id}`
    : `create-${defaults?.columnId ?? ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content size="lg" className="max-w-lg">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">
            {editing
              ? readOnly
                ? "View task"
                : "Task details"
              : "New task"}
          </h2>
        </Dialog.Header>

        {open ? (
          <TaskDialogForm
            key={formKey}
            defaults={defaults}
            boardRole={boardRole}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        ) : null}
      </Dialog.Content>
    </Dialog>
  );
}
