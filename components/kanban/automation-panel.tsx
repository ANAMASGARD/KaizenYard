"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  deleteAutomation,
  listAutomations,
  updateAutomation,
} from "@/lib/kanban/automation-actions";
import type { AutomationRecord } from "@/lib/kanban/automation-types";
import { describeAutomation } from "@/lib/kanban/automation-labels";
import type { ColumnRecord } from "@/lib/kanban/types";
import { AutomationRuleDialog } from "@/components/kanban/automation-rule-dialog";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Switch } from "@/components/retroui/Switch";
import { cn } from "@/lib/utils";

type AutomationPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: number;
  columns: ColumnRecord[];
};

type AutomationListContentProps = {
  boardId: number;
  columns: ColumnRecord[];
  onEdit: (automation: AutomationRecord) => void;
};

function AutomationListContent({
  boardId,
  columns,
  onEdit,
}: AutomationListContentProps) {
  const [automations, setAutomations] = useState<AutomationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listAutomations(boardId)
      .then(setAutomations)
      .finally(() => setLoading(false));
  }, [boardId]);

  function upsertAutomation(saved: AutomationRecord) {
    setAutomations((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  }

  async function handleToggle(automation: AutomationRecord, enabled: boolean) {
    try {
      const saved = await updateAutomation(automation.id, { isEnabled: enabled });
      upsertAutomation(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update rule");
    }
  }

  async function handleDelete(automationId: number) {
    if (!confirm("Delete this automation rule?")) return;
    try {
      await deleteAutomation(automationId);
      setAutomations((prev) => prev.filter((a) => a.id !== automationId));
      toast.success("Rule deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete rule");
    }
  }

  if (loading) {
    return <p className="font-sans text-sm text-muted-foreground">Loading…</p>;
  }

  if (automations.length === 0) {
    return (
      <p className="rounded border-2 border-dashed border-border p-4 font-sans text-sm text-muted-foreground">
        No rules yet. Try: when moved to Done → toggle calendar sync off.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {automations.map((automation) => (
        <li
          key={automation.id}
          className={cn(
            "flex items-start gap-3 rounded border-2 border-border p-3 shadow-sm",
            !automation.isEnabled && "opacity-60",
          )}
        >
          <Switch
            checked={automation.isEnabled}
            onCheckedChange={(checked) => void handleToggle(automation, checked)}
          />
          <div className="min-w-0 flex-1">
            <p className="font-sans text-sm">
              {describeAutomation(automation, columns)}
            </p>
            {automation.name ? (
              <p className="font-sans text-xs text-muted-foreground">
                {automation.name}
              </p>
            ) : null}
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(automation)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-red-600 dark:text-red-400"
                onClick={() => void handleDelete(automation.id)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AutomationPanel({
  open,
  onOpenChange,
  boardId,
  columns,
}: AutomationPanelProps) {
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AutomationRecord | null>(null);
  const [listKey, setListKey] = useState(0);
  function handleSaved() {
    setListKey((k) => k + 1);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <Dialog.Content size="lg" className="max-w-xl">
          <Dialog.Header asChild>
            <h2 className="flex items-center gap-2 font-head text-lg">
              <Zap className="size-5 text-amber-600" />
              Board automations
            </h2>
          </Dialog.Header>

          <div className="space-y-4 p-4">
            <p className="font-sans text-sm text-muted-foreground">
              Butler-style rules for this board — including reactions to anonymous
              risk check-ins.
            </p>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setRuleDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add rule
            </Button>

            {open ? (
              <AutomationListContent
                key={`${boardId}-${listKey}`}
                boardId={boardId}
                columns={columns}
                onEdit={(automation) => {
                  setEditing(automation);
                  setRuleDialogOpen(true);
                }}
              />
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog>

      <AutomationRuleDialog
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        boardId={boardId}
        columns={columns}
        editing={editing}
        onSaved={handleSaved}
      />
    </>
  );
}
