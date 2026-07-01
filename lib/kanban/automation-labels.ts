import type { AutomationActionType, AutomationTriggerType } from "@/lib/kanban/automation-types";
import type { KanbanLabel, KanbanPriority } from "@/lib/kanban/labels";
import { LABEL_META, PRIORITY_META } from "@/lib/kanban/labels";
import type { AutomationRecord } from "@/lib/kanban/automation-types";
import type { ColumnRecord } from "@/lib/kanban/types";

const TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  task_moved_to_column: "Task moved to column",
  task_created_in_column: "Task created in column",
  label_added: "Label added",
  due_date_passed: "Due date passed",
  risk_pulse_flagged: "Anonymous risk votes reach threshold",
};

const ACTION_LABELS: Record<AutomationActionType, string> = {
  move_to_column: "Move to column",
  set_priority: "Set priority",
  add_label: "Add label",
  remove_label: "Remove label",
  offset_due_date: "Offset due date",
  toggle_calendar_sync: "Toggle calendar sync",
};

export function describeAutomation(
  automation: AutomationRecord,
  columns: ColumnRecord[],
): string {
  const trigger = TRIGGER_LABELS[automation.triggerType];
  const action = ACTION_LABELS[automation.actionType];

  let triggerDetail = "";
  switch (automation.triggerType) {
    case "task_moved_to_column":
    case "task_created_in_column": {
      const col = columns.find(
        (c) => c.id === (automation.triggerConfig as { columnId: number }).columnId,
      );
      triggerDetail = col ? ` (${col.name})` : "";
      break;
    }
    case "label_added":
      triggerDetail = ` (${LABEL_META[(automation.triggerConfig as { label: KanbanLabel }).label].label})`;
      break;
    case "risk_pulse_flagged":
      triggerDetail = ` (≥${(automation.triggerConfig as { threshold: number }).threshold ?? 1})`;
      break;
    default:
      break;
  }

  let actionDetail = "";
  switch (automation.actionType) {
    case "move_to_column": {
      const col = columns.find(
        (c) => c.id === (automation.actionConfig as { columnId: number }).columnId,
      );
      actionDetail = col ? ` → ${col.name}` : "";
      break;
    }
    case "set_priority":
      actionDetail = ` → ${PRIORITY_META[(automation.actionConfig as { priority: KanbanPriority }).priority].label}`;
      break;
    case "add_label":
    case "remove_label":
      actionDetail = ` → ${LABEL_META[(automation.actionConfig as { label: KanbanLabel }).label].label}`;
      break;
    case "offset_due_date":
      actionDetail = ` → ${(automation.actionConfig as { days: number }).days} days`;
      break;
    case "toggle_calendar_sync":
      actionDetail = ` → ${(automation.actionConfig as { enabled: boolean }).enabled ? "on" : "off"}`;
      break;
    default: {
      const _exhaustive: never = automation.actionType;
      void _exhaustive;
    }
  }

  return `When ${trigger.toLowerCase()}${triggerDetail} → ${action.toLowerCase()}${actionDetail}`;
}
