"use client";

import { KANBAN_COLORS, COLOR_META, type KanbanColor } from "@/lib/kanban/colors";
import { cn } from "@/lib/utils";

type ColorSwatchPickerProps = {
  value: KanbanColor;
  onChange: (color: KanbanColor) => void;
  compact?: boolean;
};

export function ColorSwatchPicker({
  value,
  onChange,
  compact = false,
}: ColorSwatchPickerProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}
      role="radiogroup"
      aria-label="Color"
    >
      {KANBAN_COLORS.map((id) => {
        const meta = COLOR_META[id];
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={meta.label}
            title={meta.label}
            onClick={() => onChange(id)}
            className={cn(
              "rounded-full border-2 border-border shadow-sm transition-transform",
              compact ? "size-6" : "size-8",
              meta.dotClass,
              selected && "ring-2 ring-foreground ring-offset-1 shadow-md scale-110",
              !selected && "opacity-80 hover:opacity-100 hover:scale-105",
            )}
          />
        );
      })}
    </div>
  );
}
