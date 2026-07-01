"use server";

import { auth } from "@clerk/nextjs/server";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  kanbanBoardCollaborators,
  kanbanBoards,
  kanbanColumns,
  kanbanTasks,
} from "@/db";
import {
  requireBoardAccess,
  requireBoardOwnership,
} from "@/lib/kanban/access";
import type { BoardRole } from "@/lib/kanban/room";
import {
  createCalendarItem,
  deleteCalendarItem,
  updateCalendarItem,
} from "@/lib/calendar/actions";
import {
  DEFAULT_BOARD_COLUMNS,
  isKanbanColor,
  type KanbanColor,
} from "@/lib/kanban/colors";
import {
  filterValidLabels,
  isKanbanPriority,
} from "@/lib/kanban/labels";
import type {
  BoardData,
  BoardRecord,
  ColumnRecord,
  CreateBoardInput,
  CreateColumnInput,
  CreateTaskInput,
  TaskMutationOptions,
  TaskRecord,
  UpdateBoardInput,
  UpdateColumnInput,
  UpdateTaskInput,
} from "@/lib/kanban/types";

const MAX_COLUMNS_PER_BOARD = 5;

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

async function resolveActorId(options?: TaskMutationOptions): Promise<string> {
  if (options?.actingAsOwnerId) return options.actingAsOwnerId;
  return requireUserId();
}

function toBoardRecord(
  row: typeof kanbanBoards.$inferSelect,
  role: BoardRole,
): BoardRecord {
  return {
    id: row.id,
    clerkId: row.clerkId,
    name: row.name,
    color: row.color as KanbanColor,
    sortOrder: row.sortOrder,
    role,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toColumnRecord(row: typeof kanbanColumns.$inferSelect): ColumnRecord {
  return {
    id: row.id,
    boardId: row.boardId,
    clerkId: row.clerkId,
    name: row.name,
    color: row.color as KanbanColor,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toTaskRecord(row: typeof kanbanTasks.$inferSelect): TaskRecord {
  return {
    id: row.id,
    columnId: row.columnId,
    clerkId: row.clerkId,
    title: row.title,
    description: row.description,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    priority: row.priority as TaskRecord["priority"],
    labels: filterValidLabels(row.labels ?? []),
    syncCalendar: row.syncCalendar,
    linkNotes: row.linkNotes,
    calendarItemId: row.calendarItemId,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function requireColumnBoardAccess(
  columnId: number,
  clerkId: string,
  minRole: "editor" | "viewer",
) {
  const [column] = await db
    .select()
    .from(kanbanColumns)
    .where(eq(kanbanColumns.id, columnId))
    .limit(1);

  if (!column) {
    throw new Error("Column not found");
  }

  await requireBoardAccess(column.boardId, clerkId, minRole);
  return column;
}

async function requireTaskBoardAccess(
  taskId: number,
  clerkId: string,
  minRole: "editor" | "viewer",
) {
  const [task] = await db
    .select()
    .from(kanbanTasks)
    .where(eq(kanbanTasks.id, taskId))
    .limit(1);

  if (!task) {
    throw new Error("Task not found");
  }

  await requireColumnBoardAccess(task.columnId, clerkId, minRole);
  return task;
}

function dueDateToCalendarScheduledAt(dueDateIso: string): string {
  const date = new Date(dueDateIso);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

async function syncTaskCalendar(
  task: Pick<
    TaskRecord,
    | "id"
    | "title"
    | "description"
    | "dueDate"
    | "syncCalendar"
    | "calendarItemId"
  >,
): Promise<number | null> {
  if (!task.syncCalendar || !task.dueDate) {
    if (task.calendarItemId) {
      await deleteCalendarItem(String(task.calendarItemId));
    }
    return null;
  }

  const scheduledAt = dueDateToCalendarScheduledAt(task.dueDate);

  if (task.calendarItemId) {
    await updateCalendarItem(task.calendarItemId, {
      title: task.title,
      description: task.description,
      scheduledAt,
    });
    return task.calendarItemId;
  }

  const created = await createCalendarItem({
    title: task.title,
    itemType: "task",
    category: "tasks",
    description: task.description ?? undefined,
    scheduledAt,
    durationMin: 60,
  });
  return created.id;
}

async function deleteTaskCalendarItem(calendarItemId: number | null) {
  if (!calendarItemId) return;
  try {
    await deleteCalendarItem(String(calendarItemId));
  } catch {
    // Calendar item may already be gone
  }
}

export async function listBoards(): Promise<BoardRecord[]> {
  const userId = await requireUserId();

  const ownedRows = await db
    .select()
    .from(kanbanBoards)
    .where(eq(kanbanBoards.clerkId, userId));

  const sharedRows = await db
    .select({
      board: kanbanBoards,
      role: kanbanBoardCollaborators.role,
    })
    .from(kanbanBoardCollaborators)
    .innerJoin(kanbanBoards, eq(kanbanBoardCollaborators.boardId, kanbanBoards.id))
    .where(
      and(
        eq(kanbanBoardCollaborators.clerkId, userId),
        sql`${kanbanBoardCollaborators.acceptedAt} IS NOT NULL`,
      ),
    );

  const byId = new Map<number, BoardRecord>();

  for (const row of ownedRows) {
    byId.set(row.id, toBoardRecord(row, "owner"));
  }

  for (const { board, role } of sharedRows) {
    if (byId.has(board.id)) continue;
    const sharedRole = role === "viewer" ? "viewer" : "editor";
    byId.set(board.id, toBoardRecord(board, sharedRole));
  }

  return [...byId.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
  );
}

export async function createBoard(input: CreateBoardInput): Promise<BoardData> {
  const userId = await requireUserId();

  if (!input.name.trim()) {
    throw new Error("Board name is required");
  }
  if (!isKanbanColor(input.color)) {
    throw new Error("Invalid board color");
  }

  const existing = await db
    .select({ sortOrder: kanbanBoards.sortOrder })
    .from(kanbanBoards)
    .where(eq(kanbanBoards.clerkId, userId))
    .orderBy(asc(kanbanBoards.sortOrder));

  const nextSort =
    existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;

  const [board] = await db
    .insert(kanbanBoards)
    .values({
      clerkId: userId,
      name: input.name.trim(),
      color: input.color,
      sortOrder: nextSort,
    })
    .returning();

  const columnRows = await db
    .insert(kanbanColumns)
    .values(
      DEFAULT_BOARD_COLUMNS.map((col) => ({
        boardId: board.id,
        clerkId: userId,
        name: col.name,
        color: col.color,
        sortOrder: col.sortOrder,
      })),
    )
    .returning();

  return {
    board: toBoardRecord(board, "owner"),
    columns: columnRows.map(toColumnRecord),
    tasks: [],
    pulseRiskByTaskId: {},
    role: "owner",
  };
}

export async function updateBoard(
  boardId: number,
  input: UpdateBoardInput,
): Promise<BoardRecord> {
  const userId = await requireUserId();
  await requireBoardOwnership(boardId, userId);

  if (input.color && !isKanbanColor(input.color)) {
    throw new Error("Invalid board color");
  }

  const [row] = await db
    .update(kanbanBoards)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(kanbanBoards.id, boardId))
    .returning();

  if (!row) {
    throw new Error("Board not found");
  }

  return toBoardRecord(row, "owner");
}

export async function deleteBoard(boardId: number): Promise<void> {
  const userId = await requireUserId();
  await requireBoardOwnership(boardId, userId);

  const columns = await db
    .select({ id: kanbanColumns.id })
    .from(kanbanColumns)
    .where(eq(kanbanColumns.boardId, boardId));

  const columnIds = columns.map((c) => c.id);
  if (columnIds.length > 0) {
    const tasks = await db
      .select({ calendarItemId: kanbanTasks.calendarItemId })
      .from(kanbanTasks)
      .where(inArray(kanbanTasks.columnId, columnIds));

    for (const task of tasks) {
      await deleteTaskCalendarItem(task.calendarItemId);
    }
  }

  await db.delete(kanbanBoards).where(eq(kanbanBoards.id, boardId));
}

export async function listBoardData(boardId: number): Promise<BoardData> {
  const userId = await requireUserId();
  const role = await requireBoardAccess(boardId, userId, "viewer");

  const [board] = await db
    .select()
    .from(kanbanBoards)
    .where(eq(kanbanBoards.id, boardId))
    .limit(1);

  if (!board) {
    throw new Error("Board not found");
  }

  const columns = await db
    .select()
    .from(kanbanColumns)
    .where(eq(kanbanColumns.boardId, boardId))
    .orderBy(asc(kanbanColumns.sortOrder), asc(kanbanColumns.id));

  const columnIds = columns.map((c) => c.id);
  const tasks =
    columnIds.length > 0
      ? await db
          .select()
          .from(kanbanTasks)
          .where(inArray(kanbanTasks.columnId, columnIds))
          .orderBy(asc(kanbanTasks.sortOrder), asc(kanbanTasks.id))
      : [];

  const taskRecords = tasks.map(toTaskRecord);

  const { getBoardPulseRiskSummaries } = await import(
    "@/lib/kanban/pulse-actions"
  );
  const { evaluateDueDateAutomationsForBoard } = await import(
    "@/lib/kanban/automation-actions"
  );

  const pulseRiskByTaskId = await getBoardPulseRiskSummaries(
    taskRecords.map((t) => t.id),
  );

  await evaluateDueDateAutomationsForBoard(boardId, taskRecords);

  return {
    board: toBoardRecord(board, role),
    columns: columns.map(toColumnRecord),
    tasks: taskRecords,
    pulseRiskByTaskId,
    role,
  };
}

export async function createColumn(
  input: CreateColumnInput,
): Promise<ColumnRecord> {
  const userId = await requireUserId();
  const [board] = await db
    .select()
    .from(kanbanBoards)
    .where(eq(kanbanBoards.id, input.boardId))
    .limit(1);

  if (!board) {
    throw new Error("Board not found");
  }

  await requireBoardAccess(input.boardId, userId, "editor");

  if (!input.name.trim()) {
    throw new Error("Column name is required");
  }
  if (!isKanbanColor(input.color)) {
    throw new Error("Invalid column color");
  }

  const existing = await db
    .select({ id: kanbanColumns.id, sortOrder: kanbanColumns.sortOrder })
    .from(kanbanColumns)
    .where(eq(kanbanColumns.boardId, input.boardId))
    .orderBy(asc(kanbanColumns.sortOrder));

  if (existing.length >= MAX_COLUMNS_PER_BOARD) {
    throw new Error("Maximum of 5 columns per board");
  }

  const nextSort =
    existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;

  const [row] = await db
    .insert(kanbanColumns)
    .values({
      boardId: input.boardId,
      clerkId: board.clerkId,
      name: input.name.trim(),
      color: input.color,
      sortOrder: nextSort,
    })
    .returning();

  return toColumnRecord(row);
}

export async function updateColumn(
  columnId: number,
  input: UpdateColumnInput,
): Promise<ColumnRecord> {
  const userId = await requireUserId();
  await requireColumnBoardAccess(columnId, userId, "editor");

  if (input.color && !isKanbanColor(input.color)) {
    throw new Error("Invalid column color");
  }

  const [row] = await db
    .update(kanbanColumns)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(kanbanColumns.id, columnId))
    .returning();

  if (!row) {
    throw new Error("Column not found");
  }

  return toColumnRecord(row);
}

export async function reorderColumns(
  boardId: number,
  columnIds: number[],
): Promise<ColumnRecord[]> {
  const userId = await requireUserId();
  await requireBoardAccess(boardId, userId, "editor");

  const columns = await db
    .select()
    .from(kanbanColumns)
    .where(eq(kanbanColumns.boardId, boardId))
    .orderBy(asc(kanbanColumns.sortOrder));

  const ownedIds = new Set(columns.map((c) => c.id));
  if (
    columnIds.length !== columns.length ||
    !columnIds.every((id) => ownedIds.has(id))
  ) {
    throw new Error("Invalid column order");
  }

  await Promise.all(
    columnIds.map((id, index) =>
      db
        .update(kanbanColumns)
        .set({ sortOrder: index, updatedAt: sql`now()` })
        .where(eq(kanbanColumns.id, id)),
    ),
  );

  const updated = await db
    .select()
    .from(kanbanColumns)
    .where(eq(kanbanColumns.boardId, boardId))
    .orderBy(asc(kanbanColumns.sortOrder), asc(kanbanColumns.id));

  return updated.map(toColumnRecord);
}

export async function deleteColumn(columnId: number): Promise<void> {
  const userId = await requireUserId();
  const column = await requireColumnBoardAccess(columnId, userId, "editor");

  const allColumns = await db
    .select()
    .from(kanbanColumns)
    .where(eq(kanbanColumns.boardId, column.boardId))
    .orderBy(asc(kanbanColumns.sortOrder), asc(kanbanColumns.id));

  if (allColumns.length <= 1) {
    throw new Error("Cannot delete the last column");
  }

  const targetColumn = allColumns.find((c) => c.id !== columnId);
  if (!targetColumn) {
    throw new Error("No target column for tasks");
  }

  const tasks = await db
    .select()
    .from(kanbanTasks)
    .where(eq(kanbanTasks.columnId, columnId))
    .orderBy(asc(kanbanTasks.sortOrder));

  const targetTasks = await db
    .select({ sortOrder: kanbanTasks.sortOrder })
    .from(kanbanTasks)
    .where(eq(kanbanTasks.columnId, targetColumn.id))
    .orderBy(asc(kanbanTasks.sortOrder));

  let nextSort =
    targetTasks.length > 0
      ? targetTasks[targetTasks.length - 1].sortOrder + 1
      : 0;

  for (const task of tasks) {
    await db
      .update(kanbanTasks)
      .set({
        columnId: targetColumn.id,
        sortOrder: nextSort,
        updatedAt: sql`now()`,
      })
      .where(eq(kanbanTasks.id, task.id));
    nextSort += 1;
  }

  const { deleteAutomationsReferencingColumn } = await import(
    "@/lib/kanban/automation-actions"
  );
  await deleteAutomationsReferencingColumn(column.boardId, columnId);

  await db.delete(kanbanColumns).where(eq(kanbanColumns.id, columnId));
}

export async function createTask(input: CreateTaskInput): Promise<TaskRecord> {
  const userId = await requireUserId();
  const column = await requireColumnBoardAccess(input.columnId, userId, "editor");

  if (!input.title.trim()) {
    throw new Error("Title is required");
  }
  if (input.priority && !isKanbanPriority(input.priority)) {
    throw new Error("Invalid priority");
  }

  const labels = filterValidLabels(input.labels ?? []);

  const existing = await db
    .select({ sortOrder: kanbanTasks.sortOrder })
    .from(kanbanTasks)
    .where(eq(kanbanTasks.columnId, input.columnId))
    .orderBy(asc(kanbanTasks.sortOrder));

  const nextSort =
    existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;

  const [row] = await db
    .insert(kanbanTasks)
    .values({
      columnId: input.columnId,
      clerkId: column.clerkId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority ?? "medium",
      labels,
      syncCalendar: input.syncCalendar ?? false,
      linkNotes: input.linkNotes ?? false,
      sortOrder: nextSort,
    })
    .returning();

  let calendarItemId: number | null = null;
  if (row.syncCalendar && row.dueDate) {
    calendarItemId = await syncTaskCalendar({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.dueDate.toISOString(),
      syncCalendar: row.syncCalendar,
      calendarItemId: null,
    });
  }

  if (calendarItemId !== null) {
    const [updated] = await db
      .update(kanbanTasks)
      .set({ calendarItemId, updatedAt: sql`now()` })
      .where(eq(kanbanTasks.id, row.id))
      .returning();
    const record = toTaskRecord(updated);
    const { runAutomationsForTask } = await import(
      "@/lib/kanban/automation-actions"
    );
    await runAutomationsForTask(record.id, {
      type: "task_created_in_column",
      columnId: record.columnId,
    });
    return record;
  }

  const record = toTaskRecord(row);
  const { runAutomationsForTask } = await import(
    "@/lib/kanban/automation-actions"
  );
  await runAutomationsForTask(record.id, {
    type: "task_created_in_column",
    columnId: record.columnId,
  });
  return record;
}

export async function updateTask(
  taskId: number,
  input: UpdateTaskInput,
  options?: TaskMutationOptions,
): Promise<TaskRecord> {
  const userId = await resolveActorId(options);

  const existing = options?.actingAsOwnerId
    ? (
        await db
          .select()
          .from(kanbanTasks)
          .where(eq(kanbanTasks.id, taskId))
          .limit(1)
      )[0]
    : await requireTaskBoardAccess(taskId, userId, "editor");

  if (!existing) {
    throw new Error("Task not found");
  }

  if (input.columnId !== undefined) {
    if (options?.actingAsOwnerId) {
      const [targetColumn] = await db
        .select()
        .from(kanbanColumns)
        .where(eq(kanbanColumns.id, input.columnId))
        .limit(1);
      if (!targetColumn) {
        throw new Error("Column not found");
      }
    } else {
      await requireColumnBoardAccess(input.columnId, userId, "editor");
    }
  }
  if (input.priority && !isKanbanPriority(input.priority)) {
    throw new Error("Invalid priority");
  }

  const labels =
    input.labels !== undefined ? filterValidLabels(input.labels) : undefined;

  const previousLabels = filterValidLabels(existing.labels ?? []);
  const addedLabels =
    labels !== undefined
      ? labels.filter((label) => !previousLabels.includes(label))
      : [];

  const [row] = await db
    .update(kanbanTasks)
    .set({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.dueDate !== undefined
        ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
        : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(labels !== undefined ? { labels } : {}),
      ...(input.syncCalendar !== undefined
        ? { syncCalendar: input.syncCalendar }
        : {}),
      ...(input.linkNotes !== undefined ? { linkNotes: input.linkNotes } : {}),
      ...(input.columnId !== undefined ? { columnId: input.columnId } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(kanbanTasks.id, taskId))
    .returning();

  if (!row) {
    throw new Error("Task not found");
  }

  const taskForSync = toTaskRecord(row);
  const calendarItemId = await syncTaskCalendar(taskForSync);

  if (calendarItemId !== taskForSync.calendarItemId) {
    const [synced] = await db
      .update(kanbanTasks)
      .set({ calendarItemId, updatedAt: sql`now()` })
      .where(eq(kanbanTasks.id, taskId))
      .returning();
    const result = toTaskRecord(synced);
    if (!options?.skipAutomation) {
      const { runAutomationsForTask } = await import(
        "@/lib/kanban/automation-actions"
      );
      for (const label of addedLabels) {
        await runAutomationsForTask(taskId, { type: "label_added", label });
      }
    }
    return result;
  }

  if (!options?.skipAutomation) {
    const { runAutomationsForTask } = await import(
      "@/lib/kanban/automation-actions"
    );
    for (const label of addedLabels) {
      await runAutomationsForTask(taskId, { type: "label_added", label });
    }
  }

  return taskForSync;
}

export async function deleteTask(taskId: number): Promise<void> {
  const userId = await requireUserId();
  const existing = await requireTaskBoardAccess(taskId, userId, "editor");

  await deleteTaskCalendarItem(existing.calendarItemId);

  await db.delete(kanbanTasks).where(eq(kanbanTasks.id, taskId));
}

export async function moveTask(
  taskId: number,
  columnId: number,
  sortOrder: number,
  options?: TaskMutationOptions,
): Promise<TaskRecord> {
  const userId = await resolveActorId(options);

  if (options?.actingAsOwnerId) {
    const [targetColumn] = await db
      .select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.id, columnId))
      .limit(1);
    if (!targetColumn) {
      throw new Error("Column not found");
    }
  } else {
    await requireColumnBoardAccess(columnId, userId, "editor");
  }

  const existing = options?.actingAsOwnerId
    ? (
        await db
          .select()
          .from(kanbanTasks)
          .where(eq(kanbanTasks.id, taskId))
          .limit(1)
      )[0]
    : await requireTaskBoardAccess(taskId, userId, "editor");

  if (!existing) {
    throw new Error("Task not found");
  }

  const [row] = await db
    .update(kanbanTasks)
    .set({
      columnId,
      sortOrder,
      updatedAt: sql`now()`,
    })
    .where(eq(kanbanTasks.id, taskId))
    .returning();

  const record = toTaskRecord(row);

  if (!options?.skipAutomation && existing.columnId !== columnId) {
    const { runAutomationsForTask } = await import(
      "@/lib/kanban/automation-actions"
    );
    await runAutomationsForTask(taskId, {
      type: "task_moved_to_column",
      columnId,
    });
  }

  return record;
}

export async function reorderTasks(
  columnId: number,
  taskIds: number[],
): Promise<TaskRecord[]> {
  const userId = await requireUserId();
  await requireColumnBoardAccess(columnId, userId, "editor");

  const tasks = await db
    .select()
    .from(kanbanTasks)
    .where(eq(kanbanTasks.columnId, columnId))
    .orderBy(asc(kanbanTasks.sortOrder));

  const ownedIds = new Set(tasks.map((t) => t.id));
  if (
    taskIds.length !== tasks.length ||
    !taskIds.every((id) => ownedIds.has(id))
  ) {
    throw new Error("Invalid task order");
  }

  await Promise.all(
    taskIds.map((id, index) =>
      db
        .update(kanbanTasks)
        .set({ sortOrder: index, updatedAt: sql`now()` })
        .where(eq(kanbanTasks.id, id)),
    ),
  );

  const updated = await db
    .select()
    .from(kanbanTasks)
    .where(eq(kanbanTasks.columnId, columnId))
    .orderBy(asc(kanbanTasks.sortOrder), asc(kanbanTasks.id));

  return updated.map(toTaskRecord);
}

export async function moveTaskWithReorder(
  taskId: number,
  targetColumnId: number,
  orderedTaskIds: number[],
  options?: TaskMutationOptions,
): Promise<TaskRecord[]> {
  const userId = await resolveActorId(options);

  if (options?.actingAsOwnerId) {
    const [targetColumn] = await db
      .select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.id, targetColumnId))
      .limit(1);
    if (!targetColumn) {
      throw new Error("Column not found");
    }
  } else {
    await requireColumnBoardAccess(targetColumnId, userId, "editor");
  }

  const existing = options?.actingAsOwnerId
    ? (
        await db
          .select()
          .from(kanbanTasks)
          .where(eq(kanbanTasks.id, taskId))
          .limit(1)
      )[0]
    : await requireTaskBoardAccess(taskId, userId, "editor");

  if (!existing) {
    throw new Error("Task not found");
  }

  const sourceColumnId = existing.columnId;

  await Promise.all(
    orderedTaskIds.map((id, index) =>
      db
        .update(kanbanTasks)
        .set({
          columnId: targetColumnId,
          sortOrder: index,
          updatedAt: sql`now()`,
        })
        .where(eq(kanbanTasks.id, id)),
    ),
  );

  if (sourceColumnId !== targetColumnId) {
    const sourceTasks = await db
      .select()
      .from(kanbanTasks)
      .where(eq(kanbanTasks.columnId, sourceColumnId))
      .orderBy(asc(kanbanTasks.sortOrder), asc(kanbanTasks.id));

    await Promise.all(
      sourceTasks.map((task, index) =>
        db
          .update(kanbanTasks)
          .set({ sortOrder: index, updatedAt: sql`now()` })
          .where(eq(kanbanTasks.id, task.id)),
      ),
    );
  }

  const targetTasks = await db
    .select()
    .from(kanbanTasks)
    .where(eq(kanbanTasks.columnId, targetColumnId))
    .orderBy(asc(kanbanTasks.sortOrder), asc(kanbanTasks.id));

  if (!options?.skipAutomation && sourceColumnId !== targetColumnId) {
    const { runAutomationsForTask } = await import(
      "@/lib/kanban/automation-actions"
    );
    await runAutomationsForTask(taskId, {
      type: "task_moved_to_column",
      columnId: targetColumnId,
    });
  }

  return targetTasks.map(toTaskRecord);
}
