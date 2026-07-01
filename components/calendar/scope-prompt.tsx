"use client";

import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import type { EditScope } from "@/lib/calendar/types";

type ScopePromptProps = {
  open: boolean;
  action: "edit" | "delete";
  onChoose: (scope: EditScope) => void;
  onCancel: () => void;
};

export function ScopePrompt({ open, action, onChoose, onCancel }: ScopePromptProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <Dialog.Content className="max-w-sm">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">
            {action === "delete" ? "Delete recurring event" : "Edit recurring event"}
          </h2>
        </Dialog.Header>
        <div className="flex flex-col gap-2 p-4">
          <p className="font-sans text-sm text-muted-foreground">
            This is part of a recurring series. What would you like to change?
          </p>
          <Button type="button" size="sm" onClick={() => onChoose("occurrence")}>
            This event only
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onChoose("series")}>
            All events in series
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
