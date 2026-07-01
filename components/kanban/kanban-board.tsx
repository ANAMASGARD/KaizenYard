"use client";

import type { KanbanColor } from "@/lib/kanban/colors";
import type { ColumnRecord, TaskRecord } from "@/lib/kanban/types";
import { AddColumnPopover } from "@/components/kanban/add-column-popover";
import { KanbanColumn } from "@/components/kanban/kanban-column";

type KanbanBoardProps = {
  boardId: number;
  columns: ColumnRecord[];
  tasks: TaskRecord[];
  pulseRiskByTaskId: Record<number, { atRisk: number; blocked: number }>;
  onAddTask: (columnId: number) => void;
  onEditTask: (task: TaskRecord) => void;
  onColumnCreated: (column: ColumnRecord) => void;
  onRenameColumn: (columnId: number, name: string) => void;
  onChangeColumnColor: (columnId: number, color: KanbanColor) => void;
  onMoveColumnLeft: (columnId: number) => void;
  onMoveColumnRight: (columnId: number) => void;
  onDeleteColumn: (columnId: number) => void;
};

export function KanbanBoard({
  boardId,
  columns,
  tasks,
  pulseRiskByTaskId,
  onAddTask,
  onEditTask,
  onColumnCreated,
  onRenameColumn,
  onChangeColumnColor,
  onMoveColumnLeft,
  onMoveColumnRight,
  onDeleteColumn,
}: KanbanBoardProps) {
  const sortedColumns = [...columns].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Board columns
        </p>
        <AddColumnPopover
          boardId={boardId}
          disabled={columns.length >= 5}
          onCreated={onColumnCreated}
        />
      </div>

      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
        {sortedColumns.map((column, index) => {
          const columnTasks = tasks
            .filter((t) => t.columnId === column.id)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

          return (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              pulseRiskByTaskId={pulseRiskByTaskId}
              canMoveLeft={index > 0}
              canMoveRight={index < sortedColumns.length - 1}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
              onRename={(name) => onRenameColumn(column.id, name)}
              onChangeColor={(color) => onChangeColumnColor(column.id, color)}
              onMoveLeft={() => onMoveColumnLeft(column.id)}
              onMoveRight={() => onMoveColumnRight(column.id)}
              onDelete={() => onDeleteColumn(column.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
