"use client";

import { useState } from "react";
import {
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_TRIGGER_TYPES,
  type AutomationActionConfig,
  type AutomationActionType,
  type AutomationRecord,
  type AutomationTriggerConfig,
  type AutomationTriggerType,
  type CreateAutomationInput,
} from "@/lib/kanban/automation-types";
import { createAutomation, updateAutomation } from "@/lib/kanban/automation-actions";
import { KANBAN_LABELS, KANBAN_PRIORITIES, LABEL_META, PRIORITY_META } from "@/lib/kanban/labels";
import type { KanbanLabel, KanbanPriority } from "@/lib/kanban/labels";
import type { ColumnRecord } from "@/lib/kanban/types";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";

const fieldLabelClass =
  "font-head text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

type AutomationRuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: number;
  columns: ColumnRecord[];
  editing?: AutomationRecord | null;
  onSaved: (automation: AutomationRecord) => void;
};

function AutomationRuleForm({
  boardId,
  columns,
  editing,
  onOpenChange,
  onSaved,
}: Omit<AutomationRuleDialogProps, "open">) {
  const [name, setName] = useState(editing?.name ?? "");
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>(
    editing?.triggerType ?? "task_moved_to_column",
  );
  const [triggerColumnId, setTriggerColumnId] = useState(
    String(
      (editing?.triggerConfig as { columnId?: number })?.columnId ??
        columns[0]?.id ??
        "",
    ),
  );
  const [triggerLabel, setTriggerLabel] = useState<KanbanLabel>(
    (editing?.triggerConfig as { label?: KanbanLabel })?.label ?? "bug",
  );
  const [riskThreshold, setRiskThreshold] = useState(
    String((editing?.triggerConfig as { threshold?: number })?.threshold ?? 2),
  );
  const [actionType, setActionType] = useState<AutomationActionType>(
    editing?.actionType ?? "set_priority",
  );
  const [actionColumnId, setActionColumnId] = useState(
    String(
      (editing?.actionConfig as { columnId?: number })?.columnId ??
        columns[0]?.id ??
        "",
    ),
  );
  const [actionPriority, setActionPriority] = useState<KanbanPriority>(
    (editing?.actionConfig as { priority?: KanbanPriority })?.priority ??
      "high",
  );
  const [actionLabel, setActionLabel] = useState<KanbanLabel>(
    (editing?.actionConfig as { label?: KanbanLabel })?.label ?? "bug",
  );
  const [offsetDays, setOffsetDays] = useState(
    String((editing?.actionConfig as { days?: number })?.days ?? 3),
  );
  const [calendarEnabled, setCalendarEnabled] = useState(
    (editing?.actionConfig as { enabled?: boolean })?.enabled ?? true,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildTriggerConfig(): AutomationTriggerConfig {
    switch (triggerType) {
      case "task_moved_to_column":
      case "task_created_in_column":
        return { columnId: Number(triggerColumnId) };
      case "label_added":
        return { label: triggerLabel };
      case "due_date_passed":
        return {};
      case "risk_pulse_flagged":
        return { threshold: Number(riskThreshold) || 1 };
      default: {
        const _exhaustive: never = triggerType;
        return _exhaustive;
      }
    }
  }

  function buildActionConfig(): AutomationActionConfig {
    switch (actionType) {
      case "move_to_column":
        return { columnId: Number(actionColumnId) };
      case "set_priority":
        return { priority: actionPriority };
      case "add_label":
      case "remove_label":
        return { label: actionLabel };
      case "offset_due_date":
        return { days: Number(offsetDays) || 0 };
      case "toggle_calendar_sync":
        return { enabled: calendarEnabled };
      default: {
        const _exhaustive: never = actionType;
        return _exhaustive;
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CreateAutomationInput = {
      boardId,
      name: name.trim() || undefined,
      triggerType,
      triggerConfig: buildTriggerConfig(),
      actionType,
      actionConfig: buildActionConfig(),
    };

    try {
      if (editing) {
        const saved = await updateAutomation(editing.id, payload);
        onSaved(saved);
      } else {
        const saved = await createAutomation(payload);
        onSaved(saved);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setSaving(false);
    }
  }

  const selectClass =
    "w-full rounded border-2 border-border px-3 py-2 font-sans text-sm shadow-sm";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div className="space-y-2">
        <label htmlFor="rule-name" className={fieldLabelClass}>
          Rule name (optional)
        </label>
        <Input
          id="rule-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Flag overdue bugs"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="trigger-type" className={fieldLabelClass}>
          When
        </label>
        <select
          id="trigger-type"
          value={triggerType}
          onChange={(e) =>
            setTriggerType(e.target.value as AutomationTriggerType)
          }
          className={selectClass}
        >
          {AUTOMATION_TRIGGER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {(triggerType === "task_moved_to_column" ||
        triggerType === "task_created_in_column") && (
        <div className="space-y-2">
          <label htmlFor="trigger-column" className={fieldLabelClass}>
            Column
          </label>
          <select
            id="trigger-column"
            value={triggerColumnId}
            onChange={(e) => setTriggerColumnId(e.target.value)}
            className={selectClass}
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {triggerType === "label_added" && (
        <div className="space-y-2">
          <label htmlFor="trigger-label" className={fieldLabelClass}>
            Label
          </label>
          <select
            id="trigger-label"
            value={triggerLabel}
            onChange={(e) => setTriggerLabel(e.target.value as KanbanLabel)}
            className={selectClass}
          >
            {KANBAN_LABELS.map((label) => (
              <option key={label} value={label}>
                {LABEL_META[label].label}
              </option>
            ))}
          </select>
        </div>
      )}

      {triggerType === "risk_pulse_flagged" && (
        <div className="space-y-2">
          <label htmlFor="risk-threshold" className={fieldLabelClass}>
            At-risk + blocked votes threshold
          </label>
          <Input
            id="risk-threshold"
            type="number"
            min={1}
            value={riskThreshold}
            onChange={(e) => setRiskThreshold(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="action-type" className={fieldLabelClass}>
          Then
        </label>
        <select
          id="action-type"
          value={actionType}
          onChange={(e) => setActionType(e.target.value as AutomationActionType)}
          className={selectClass}
        >
          {AUTOMATION_ACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {actionType === "move_to_column" && (
        <div className="space-y-2">
          <label htmlFor="action-column" className={fieldLabelClass}>
            Target column
          </label>
          <select
            id="action-column"
            value={actionColumnId}
            onChange={(e) => setActionColumnId(e.target.value)}
            className={selectClass}
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {actionType === "set_priority" && (
        <div className="space-y-2">
          <label htmlFor="action-priority" className={fieldLabelClass}>
            Priority
          </label>
          <select
            id="action-priority"
            value={actionPriority}
            onChange={(e) =>
              setActionPriority(e.target.value as KanbanPriority)
            }
            className={selectClass}
          >
            {KANBAN_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
        </div>
      )}

      {(actionType === "add_label" || actionType === "remove_label") && (
        <div className="space-y-2">
          <label htmlFor="action-label" className={fieldLabelClass}>
            Label
          </label>
          <select
            id="action-label"
            value={actionLabel}
            onChange={(e) => setActionLabel(e.target.value as KanbanLabel)}
            className={selectClass}
          >
            {KANBAN_LABELS.map((label) => (
              <option key={label} value={label}>
                {LABEL_META[label].label}
              </option>
            ))}
          </select>
        </div>
      )}

      {actionType === "offset_due_date" && (
        <div className="space-y-2">
          <label htmlFor="offset-days" className={fieldLabelClass}>
            Days to offset
          </label>
          <Input
            id="offset-days"
            type="number"
            value={offsetDays}
            onChange={(e) => setOffsetDays(e.target.value)}
          />
        </div>
      )}

      {actionType === "toggle_calendar_sync" && (
        <label className="flex items-center gap-2 font-sans text-sm">
          <input
            type="checkbox"
            checked={calendarEnabled}
            onChange={(e) => setCalendarEnabled(e.target.checked)}
            className="size-4 border-2 border-border"
          />
          Enable calendar sync
        </label>
      )}

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
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save rule" : "Add rule"}
        </Button>
      </div>
    </form>
  );
}

export function AutomationRuleDialog({
  open,
  onOpenChange,
  boardId,
  columns,
  editing,
  onSaved,
}: AutomationRuleDialogProps) {
  const formKey = editing ? `edit-${editing.id}` : "new";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content size="lg" className="max-w-lg">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">
            {editing ? "Edit automation" : "New automation"}
          </h2>
        </Dialog.Header>
        {open ? (
          <AutomationRuleForm
            key={formKey}
            boardId={boardId}
            columns={columns}
            editing={editing}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        ) : null}
      </Dialog.Content>
    </Dialog>
  );
}
