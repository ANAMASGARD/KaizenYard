"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { COLOR_META } from "@/lib/kanban/colors";
import type { ColumnRecord, TaskRecord } from "@/lib/kanban/types";
import { columnDropId, taskDragId } from "@/lib/kanban/types";
import { ColumnOptionsMenu } from "@/components/kanban/column-options-menu";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
  column: ColumnRecord;
  tasks: TaskRecord[];
  pulseRiskByTaskId: Record<number, { atRisk: number; blocked: number }>;
  readOnly?: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onAddTask: (columnId: number) => void;
  onEditTask: (task: TaskRecord) => void;
  onRename: (name: string) => void;
  onChangeColor: (color: ColumnRecord["color"]) => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDelete: () => void;
};

export function KanbanColumn({
  column,
  tasks,
  pulseRiskByTaskId,
  readOnly = false,
  canMoveLeft,
  canMoveRight,
  onAddTask,
  onEditTask,
  onRename,
  onChangeColor,
  onMoveLeft,
  onMoveRight,
  onDelete,
}: KanbanColumnProps) {
  const meta = COLOR_META[column.color];
  const taskIds = tasks.map((t) => taskDragId(t.id));

  const { setNodeRef, isOver } = useDroppable({
    id: columnDropId(column.id),
    data: { type: "column", columnId: column.id },
  });

  return (
    <div
      className={cn(
        "flex w-[16rem] shrink-0 flex-col rounded border-2 border-border bg-muted/20 shadow-sm",
        isOver && "ring-2 ring-primary ring-offset-1",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b-2 border-border px-3 py-2",
          meta.bgClass,
        )}
      >
        <div className="min-w-0 flex-1">
          <h3 className={cn("truncate font-head text-sm", meta.textClass)}>
            {column.name}{" "}
            <span className="font-sans text-xs opacity-80">({tasks.length})</span>
          </h3>
        </div>
        {!readOnly ? (
          <ColumnOptionsMenu
            column={column}
            taskCount={tasks.length}
            canMoveLeft={canMoveLeft}
            canMoveRight={canMoveRight}
            onRename={onRename}
            onChangeColor={onChangeColor}
            onMoveLeft={onMoveLeft}
            onMoveRight={onMoveRight}
            onDelete={onDelete}
          />
        ) : null}
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-[8rem] flex-1 flex-col gap-2 overflow-y-auto p-2"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              column={column}
              onEdit={onEditTask}
              readOnly={readOnly}
              pulseRisk={pulseRiskByTaskId[task.id]}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 ? (
          <p className="py-6 text-center font-sans text-xs text-muted-foreground">
            Drop tasks here
          </p>
        ) : null}
      </div>

      {!readOnly ? (
        <div className="border-t-2 border-border p-2">
          <Button
            type="button"
            variant="outline"
            className="w-full text-sm"
            onClick={() => onAddTask(column.id)}
          >
            <Plus className="size-4" />
            Add task
          </Button>
        </div>
      ) : null}
    </div>
  );
}
