import type { KanbanColor } from "@/lib/kanban/colors";
import type { KanbanLabel, KanbanPriority } from "@/lib/kanban/labels";
import type { BoardRole } from "@/lib/kanban/room";

export type BoardRecord = {
  id: number;
  clerkId: string;
  name: string;
  color: KanbanColor;
  sortOrder: number;
  role: BoardRole;
  createdAt: string;
  updatedAt: string;
};

export type ColumnRecord = {
  id: number;
  boardId: number;
  clerkId: string;
  name: string;
  color: KanbanColor;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskRecord = {
  id: number;
  columnId: number;
  clerkId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: KanbanPriority;
  labels: KanbanLabel[];
  syncCalendar: boolean;
  linkNotes: boolean;
  calendarItemId: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BoardData = {
  board: BoardRecord;
  columns: ColumnRecord[];
  tasks: TaskRecord[];
  pulseRiskByTaskId: Record<number, { atRisk: number; blocked: number }>;
  role: BoardRole;
};

export type TaskMutationOptions = {
  skipAutomation?: boolean;
  actingAsOwnerId?: string;
};

export type CreateBoardInput = {
  name: string;
  color: KanbanColor;
};

export type UpdateBoardInput = {
  name?: string;
  color?: KanbanColor;
};

export type CreateColumnInput = {
  boardId: number;
  name: string;
  color: KanbanColor;
};

export type UpdateColumnInput = {
  name?: string;
  color?: KanbanColor;
};

export type CreateTaskInput = {
  columnId: number;
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: KanbanPriority;
  labels?: KanbanLabel[];
  syncCalendar?: boolean;
  linkNotes?: boolean;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: KanbanPriority;
  labels?: KanbanLabel[];
  syncCalendar?: boolean;
  linkNotes?: boolean;
  columnId?: number;
};

export type TaskDialogDefaults = {
  columnId?: number;
  task?: TaskRecord;
};

export const TASK_DRAG_PREFIX = "task-";
export const COLUMN_DROP_PREFIX = "column-";

export function taskDragId(taskId: number): string {
  return `${TASK_DRAG_PREFIX}${taskId}`;
}

export function parseTaskDragId(id: string): number | null {
  if (!id.startsWith(TASK_DRAG_PREFIX)) return null;
  const n = Number(id.slice(TASK_DRAG_PREFIX.length));
  return Number.isFinite(n) ? n : null;
}

export function columnDropId(columnId: number): string {
  return `${COLUMN_DROP_PREFIX}${columnId}`;
}

export function parseColumnDropId(id: string): number | null {
  if (!id.startsWith(COLUMN_DROP_PREFIX)) return null;
  const n = Number(id.slice(COLUMN_DROP_PREFIX.length));
  return Number.isFinite(n) ? n : null;
}
