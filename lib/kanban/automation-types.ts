import type { KanbanLabel, KanbanPriority } from "@/lib/kanban/labels";

export const AUTOMATION_TRIGGER_TYPES = [
  "task_moved_to_column",
  "task_created_in_column",
  "label_added",
  "due_date_passed",
  "risk_pulse_flagged",
] as const;

export type AutomationTriggerType = (typeof AUTOMATION_TRIGGER_TYPES)[number];

export const AUTOMATION_ACTION_TYPES = [
  "move_to_column",
  "set_priority",
  "add_label",
  "remove_label",
  "offset_due_date",
  "toggle_calendar_sync",
] as const;

export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPES)[number];

export type TaskMovedToColumnTriggerConfig = { columnId: number };
export type TaskCreatedInColumnTriggerConfig = { columnId: number };
export type LabelAddedTriggerConfig = { label: KanbanLabel };
export type DueDatePassedTriggerConfig = Record<string, never>;
export type RiskPulseFlaggedTriggerConfig = { threshold: number };

export type MoveToColumnActionConfig = { columnId: number };
export type SetPriorityActionConfig = { priority: KanbanPriority };
export type LabelActionConfig = { label: KanbanLabel };
export type OffsetDueDateActionConfig = { days: number };
export type ToggleCalendarSyncActionConfig = { enabled: boolean };

export type AutomationTriggerConfig =
  | TaskMovedToColumnTriggerConfig
  | TaskCreatedInColumnTriggerConfig
  | LabelAddedTriggerConfig
  | DueDatePassedTriggerConfig
  | RiskPulseFlaggedTriggerConfig;

export type AutomationActionConfig =
  | MoveToColumnActionConfig
  | SetPriorityActionConfig
  | LabelActionConfig
  | OffsetDueDateActionConfig
  | ToggleCalendarSyncActionConfig;

export type AutomationRecord = {
  id: number;
  boardId: number;
  clerkId: string;
  name: string | null;
  triggerType: AutomationTriggerType;
  triggerConfig: AutomationTriggerConfig;
  actionType: AutomationActionType;
  actionConfig: AutomationActionConfig;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateAutomationInput = {
  boardId: number;
  name?: string;
  triggerType: AutomationTriggerType;
  triggerConfig: AutomationTriggerConfig;
  actionType: AutomationActionType;
  actionConfig: AutomationActionConfig;
};

export type UpdateAutomationInput = {
  name?: string | null;
  triggerType?: AutomationTriggerType;
  triggerConfig?: AutomationTriggerConfig;
  actionType?: AutomationActionType;
  actionConfig?: AutomationActionConfig;
  isEnabled?: boolean;
};

export type AutomationEvent =
  | { type: "task_moved_to_column"; columnId: number }
  | { type: "task_created_in_column"; columnId: number }
  | { type: "label_added"; label: KanbanLabel }
  | { type: "due_date_passed" }
  | { type: "risk_pulse_flagged"; riskCount: number };

export function isAutomationTriggerType(
  value: string,
): value is AutomationTriggerType {
  return AUTOMATION_TRIGGER_TYPES.includes(value as AutomationTriggerType);
}

export function isAutomationActionType(
  value: string,
): value is AutomationActionType {
  return AUTOMATION_ACTION_TYPES.includes(value as AutomationActionType);
}
