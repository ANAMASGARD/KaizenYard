"use client";

import { useEffect, useState } from "react";
import { ColorSwatchPicker } from "@/components/kanban/color-swatch-picker";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { CATEGORY_ICON_OPTIONS, getCategoryIcon } from "@/lib/settings/category-icons";
import type { CategoryModule, UserCategoryRecord } from "@/lib/settings/types";
import type { KanbanColor } from "@/lib/kanban/colors";
import { cn } from "@/lib/utils";

type CategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: CategoryModule;
  initial?: UserCategoryRecord | null;
  onSubmit: (values: { name: string; color: string; icon: string }) => Promise<void>;
};

export function CategoryDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<KanbanColor>("blue");
  const [icon, setIcon] = useState("tag");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setColor((initial?.color as KanbanColor) ?? "blue");
    setIcon(initial?.icon ?? "tag");
  }, [open, initial]);

  async function handleSubmit() {
    if (!name.trim()) return;
    setPending(true);
    try {
      await onSubmit({ name: name.trim(), color, icon });
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-md">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">
            {initial ? "Edit category" : "New category"}
          </h2>
        </Dialog.Header>
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-1 block font-head text-[10px] uppercase tracking-[0.2em]">
              Name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-2 block font-head text-[10px] uppercase tracking-[0.2em]">
              Color
            </label>
            <ColorSwatchPicker value={color} onChange={setColor} />
          </div>
          <div>
            <label className="mb-2 block font-head text-[10px] uppercase tracking-[0.2em]">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICON_OPTIONS.map((iconName) => {
                const Icon = getCategoryIcon(iconName);
                const selected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded border-2 border-border shadow-sm",
                      selected ? "bg-primary text-primary-foreground" : "bg-background",
                    )}
                    aria-label={iconName}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <Dialog.Footer className="gap-2 p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending || !name.trim()} onClick={() => void handleSubmit()}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
