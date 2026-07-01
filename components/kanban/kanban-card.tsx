"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical, MessageSquare, NotebookPen, ShieldAlert } from "lucide-react";
import { COLOR_META } from "@/lib/kanban/colors";
import { LABEL_META, PRIORITY_META } from "@/lib/kanban/labels";
import type { ColumnRecord, TaskRecord } from "@/lib/kanban/types";
import { taskDragId } from "@/lib/kanban/types";
import { useTaskCommentCount } from "@/components/kanban/task-thread-counts-context";
import { cn } from "@/lib/utils";

type KanbanCardProps = {
  task: TaskRecord;
  column: ColumnRecord;
  onEdit: (task: TaskRecord) => void;
  showDragHandle?: boolean;
  readOnly?: boolean;
  overlay?: boolean;
  pulseRisk?: { atRisk: number; blocked: number };
};

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function KanbanCard({
  task,
  column,
  onEdit,
  showDragHandle = true,
  readOnly = false,
  overlay = false,
  pulseRisk,
}: KanbanCardProps) {
  const columnMeta = COLOR_META[column.color];
  const priorityMeta = PRIORITY_META[task.priority];
  const commentCount = useTaskCommentCount(task.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: taskDragId(task.id),
    data: { type: "task", task, columnId: column.id },
    disabled: readOnly || overlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      className={cn(
        "rounded border-2 border-border border-l-4 bg-background p-2 shadow-sm",
        columnMeta.borderClass,
        isDragging && !overlay && "opacity-50",
        overlay && "shadow-md rotate-1",
      )}
    >
      <div className="flex items-start gap-1.5">
        {showDragHandle && !readOnly ? (
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
            aria-label="Drag task"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="font-head text-sm leading-snug">{task.title}</p>

          {pulseRisk && (pulseRisk.atRisk > 0 || pulseRisk.blocked > 0) ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded border border-amber-600 bg-amber-100 px-1.5 py-0.5 font-sans text-[10px] text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <ShieldAlert className="size-3" aria-hidden />
              {pulseRisk.atRisk + pulseRisk.blocked} risk signal
              {pulseRisk.atRisk + pulseRisk.blocked === 1 ? "" : "s"}
            </span>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wide",
                priorityMeta.badgeClass,
              )}
            >
              <span
                className={cn("size-1.5 rounded-full", priorityMeta.dotClass)}
                aria-hidden
              />
              {priorityMeta.label}
            </span>

            {task.dueDate ? (
              <span className="font-sans text-[10px] text-muted-foreground">
                {formatDueDate(task.dueDate)}
              </span>
            ) : null}

            {commentCount > 0 ? (
              <span className="inline-flex items-center gap-0.5 font-sans text-[10px] text-muted-foreground">
                <MessageSquare className="size-3" aria-hidden />
                {commentCount}
              </span>
            ) : null}
          </div>

          {task.labels.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.labels.map((label) => (
                <span
                  key={label}
                  className={cn(
                    "rounded border border-border px-1.5 py-0.5 font-sans text-[10px]",
                    LABEL_META[label].chipClass,
                  )}
                >
                  {LABEL_META[label].label}
                </span>
              ))}
            </div>
          ) : null}

          {(task.syncCalendar || task.linkNotes) && (
            <div className="mt-2 flex items-center gap-2">
              {task.syncCalendar ? (
                <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" aria-label="Synced with calendar" />
              ) : null}
              {task.linkNotes ? (
                <NotebookPen className="size-3.5 text-violet-600 dark:text-violet-400" aria-label="Linked with notes" />
              ) : null}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
