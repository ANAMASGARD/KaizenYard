"use server";

import { auth } from "@clerk/nextjs/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, kanbanAutomations, kanbanColumns, kanbanTasks } from "@/db";
import {
  isAutomationActionType,
  isAutomationTriggerType,
  type AutomationActionConfig,
  type AutomationEvent,
  type AutomationRecord,
  type AutomationTriggerConfig,
  type CreateAutomationInput,
  type UpdateAutomationInput,
} from "@/lib/kanban/automation-types";
import { isKanbanLabel } from "@/lib/kanban/labels";
import { moveTask, updateTask } from "@/lib/kanban/actions";
import type { TaskRecord } from "@/lib/kanban/types";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function toAutomationRecord(
  row: typeof kanbanAutomations.$inferSelect,
): AutomationRecord {
  return {
    id: row.id,
    boardId: row.boardId,
    clerkId: row.clerkId,
    name: row.name,
    triggerType: row.triggerType as AutomationRecord["triggerType"],
    triggerConfig: row.triggerConfig as AutomationTriggerConfig,
    actionType: row.actionType as AutomationRecord["actionType"],
    actionConfig: row.actionConfig as AutomationActionConfig,
    isEnabled: row.isEnabled,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getBoardIdForTask(taskId: number): Promise<number | null> {
  const [row] = await db
    .select({ boardId: kanbanColumns.boardId })
    .from(kanbanTasks)
    .innerJoin(kanbanColumns, eq(kanbanTasks.columnId, kanbanColumns.id))
    .where(eq(kanbanTasks.id, taskId));

  return row?.boardId ?? null;
}

function matchesTrigger(
  automation: AutomationRecord,
  event: AutomationEvent,
): boolean {
  if (automation.triggerType !== event.type) return false;

  switch (event.type) {
    case "task_moved_to_column":
    case "task_created_in_column": {
      const config = automation.triggerConfig as { columnId?: number };
      return config.columnId === event.columnId;
    }
    case "label_added": {
      const config = automation.triggerConfig as { label?: string };
      return config.label === event.label;
    }
    case "due_date_passed":
      return true;
    case "risk_pulse_flagged": {
      const config = automation.triggerConfig as { threshold?: number };
      const threshold = config.threshold ?? 1;
      return event.riskCount >= threshold;
    }
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

async function applyAutomationAction(
  task: TaskRecord,
  automation: AutomationRecord,
): Promise<void> {
  const ownerOptions = { skipAutomation: true, actingAsOwnerId: task.clerkId };
  const action = automation.actionType;
  const config = automation.actionConfig;

  switch (action) {
    case "move_to_column": {
      const { columnId } = config as { columnId: number };
      if (task.columnId === columnId) return;
      await moveTask(task.id, columnId, task.sortOrder, ownerOptions);
      break;
    }
    case "set_priority": {
      const { priority } = config as { priority: TaskRecord["priority"] };
      await updateTask(task.id, { priority }, ownerOptions);
      break;
    }
    case "add_label": {
      const { label } = config as { label: string };
      if (!isKanbanLabel(label) || task.labels.includes(label)) return;
      await updateTask(
        task.id,
        { labels: [...task.labels, label] },
        ownerOptions,
      );
      break;
    }
    case "remove_label": {
      const { label } = config as { label: string };
      if (!isKanbanLabel(label)) return;
      await updateTask(
        task.id,
        { labels: task.labels.filter((l) => l !== label) },
        ownerOptions,
      );
      break;
    }
    case "offset_due_date": {
      const { days } = config as { days: number };
      const base = task.dueDate ? new Date(task.dueDate) : new Date();
      base.setDate(base.getDate() + days);
      await updateTask(task.id, { dueDate: base.toISOString() }, ownerOptions);
      break;
    }
    case "toggle_calendar_sync": {
      const { enabled } = config as { enabled: boolean };
      if (task.syncCalendar === enabled) return;
      await updateTask(task.id, { syncCalendar: enabled }, ownerOptions);
      break;
    }
    default: {
      const _exhaustive: never = action;
      void _exhaustive;
    }
  }
}

export async function runAutomationsForTask(
  taskId: number,
  event: AutomationEvent,
  options?: { fromAutomation?: boolean },
): Promise<void> {
  if (options?.fromAutomation) return;

  const boardId = await getBoardIdForTask(taskId);
  if (!boardId) return;

  const [taskRow] = await db
    .select()
    .from(kanbanTasks)
    .where(eq(kanbanTasks.id, taskId));

  if (!taskRow) return;

  const ownerId = taskRow.clerkId;

  const automations = await db
    .select()
    .from(kanbanAutomations)
    .where(
      and(
        eq(kanbanAutomations.boardId, boardId),
        eq(kanbanAutomations.clerkId, ownerId),
        eq(kanbanAutomations.isEnabled, true),
      ),
    )
    .orderBy(asc(kanbanAutomations.sortOrder), asc(kanbanAutomations.id));

  let task: TaskRecord = {
    id: taskRow.id,
    columnId: taskRow.columnId,
    clerkId: taskRow.clerkId,
    title: taskRow.title,
    description: taskRow.description,
    dueDate: taskRow.dueDate ? taskRow.dueDate.toISOString() : null,
    priority: taskRow.priority as TaskRecord["priority"],
    labels: taskRow.labels.filter(isKanbanLabel),
    syncCalendar: taskRow.syncCalendar,
    linkNotes: taskRow.linkNotes,
    calendarItemId: taskRow.calendarItemId,
    sortOrder: taskRow.sortOrder,
    createdAt: taskRow.createdAt.toISOString(),
    updatedAt: taskRow.updatedAt.toISOString(),
  };

  for (const row of automations) {
    const automation = toAutomationRecord(row);
    if (!matchesTrigger(automation, event)) continue;

    await applyAutomationAction(task, automation);

    const [refreshed] = await db
      .select()
      .from(kanbanTasks)
      .where(eq(kanbanTasks.id, taskId));

    if (refreshed) {
      task = {
        id: refreshed.id,
        columnId: refreshed.columnId,
        clerkId: refreshed.clerkId,
        title: refreshed.title,
        description: refreshed.description,
        dueDate: refreshed.dueDate ? refreshed.dueDate.toISOString() : null,
        priority: refreshed.priority as TaskRecord["priority"],
        labels: refreshed.labels.filter(isKanbanLabel),
        syncCalendar: refreshed.syncCalendar,
        linkNotes: refreshed.linkNotes,
        calendarItemId: refreshed.calendarItemId,
        sortOrder: refreshed.sortOrder,
        createdAt: refreshed.createdAt.toISOString(),
        updatedAt: refreshed.updatedAt.toISOString(),
      };
    }
  }
}

export async function listAutomations(boardId: number): Promise<AutomationRecord[]> {
  const userId = await requireUserId();

  const rows = await db
    .select()
    .from(kanbanAutomations)
    .where(
      and(
        eq(kanbanAutomations.boardId, boardId),
        eq(kanbanAutomations.clerkId, userId),
      ),
    )
    .orderBy(asc(kanbanAutomations.sortOrder), asc(kanbanAutomations.id));

  return rows.map(toAutomationRecord);
}

export async function createAutomation(
  input: CreateAutomationInput,
): Promise<AutomationRecord> {
  const userId = await requireUserId();

  if (!isAutomationTriggerType(input.triggerType)) {
    throw new Error("Invalid trigger type");
  }
  if (!isAutomationActionType(input.actionType)) {
    throw new Error("Invalid action type");
  }

  const existing = await db
    .select({ sortOrder: kanbanAutomations.sortOrder })
    .from(kanbanAutomations)
    .where(eq(kanbanAutomations.boardId, input.boardId))
    .orderBy(asc(kanbanAutomations.sortOrder));

  const nextSort =
    existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;

  const [row] = await db
    .insert(kanbanAutomations)
    .values({
      boardId: input.boardId,
      clerkId: userId,
      name: input.name?.trim() || null,
      triggerType: input.triggerType,
      triggerConfig: input.triggerConfig,
      actionType: input.actionType,
      actionConfig: input.actionConfig,
      sortOrder: nextSort,
    })
    .returning();

  return toAutomationRecord(row);
}

export async function updateAutomation(
  automationId: number,
  input: UpdateAutomationInput,
): Promise<AutomationRecord> {
  const userId = await requireUserId();

  if (input.triggerType && !isAutomationTriggerType(input.triggerType)) {
    throw new Error("Invalid trigger type");
  }
  if (input.actionType && !isAutomationActionType(input.actionType)) {
    throw new Error("Invalid action type");
  }

  const [row] = await db
    .update(kanbanAutomations)
    .set({
      ...(input.name !== undefined ? { name: input.name?.trim() || null } : {}),
      ...(input.triggerType !== undefined ? { triggerType: input.triggerType } : {}),
      ...(input.triggerConfig !== undefined
        ? { triggerConfig: input.triggerConfig }
        : {}),
      ...(input.actionType !== undefined ? { actionType: input.actionType } : {}),
      ...(input.actionConfig !== undefined
        ? { actionConfig: input.actionConfig }
        : {}),
      ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(kanbanAutomations.id, automationId),
        eq(kanbanAutomations.clerkId, userId),
      ),
    )
    .returning();

  if (!row) {
    throw new Error("Automation not found");
  }

  return toAutomationRecord(row);
}

export async function deleteAutomation(automationId: number): Promise<void> {
  const userId = await requireUserId();

  await db
    .delete(kanbanAutomations)
    .where(
      and(
        eq(kanbanAutomations.id, automationId),
        eq(kanbanAutomations.clerkId, userId),
      ),
    );
}

export async function deleteAutomationsReferencingColumn(
  boardId: number,
  columnId: number,
): Promise<void> {
  const userId = await requireUserId();

  const rows = await db
    .select()
    .from(kanbanAutomations)
    .where(
      and(
        eq(kanbanAutomations.boardId, boardId),
        eq(kanbanAutomations.clerkId, userId),
      ),
    );

  for (const row of rows) {
    const trigger = row.triggerConfig as { columnId?: number };
    const action = row.actionConfig as { columnId?: number };
    if (trigger.columnId === columnId || action.columnId === columnId) {
      await db
        .delete(kanbanAutomations)
        .where(eq(kanbanAutomations.id, row.id));
    }
  }
}

export async function evaluateDueDateAutomationsForBoard(
  boardId: number,
  tasks: TaskRecord[],
): Promise<void> {
  const now = Date.now();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    if (new Date(task.dueDate).getTime() >= now) continue;
    await runAutomationsForTask(task.id, { type: "due_date_passed" });
  }
}
