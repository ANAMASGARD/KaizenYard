"use client";

import {
  CALENDAR_CATEGORIES,
  CATEGORY_META,
  type CalendarCategory,
} from "@/lib/calendar/categories";
import { cn } from "@/lib/utils";

type CategorySwatchPickerProps = {
  value: CalendarCategory;
  onChange: (category: CalendarCategory) => void;
};

export function CategorySwatchPicker({
  value,
  onChange,
}: CategorySwatchPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
      {CALENDAR_CATEGORIES.map((id) => {
        const meta = CATEGORY_META[id];
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(id)}
            className={cn(
              "flex items-center gap-1.5 rounded border-2 border-border px-2 py-1 font-sans text-xs shadow-sm transition-transform",
              meta.bgClass,
              meta.textClass,
              selected && "ring-2 ring-black ring-offset-1 shadow-md",
              !selected && "opacity-80 hover:opacity-100",
            )}
          >
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full border border-border",
                meta.borderClass.replace("border-", "bg-"),
              )}
              aria-hidden
            />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
