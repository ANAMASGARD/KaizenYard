"use client";

import { useUserCategories } from "@/lib/settings/use-user-categories";
import { fallbackCategoryMeta } from "@/lib/settings/category-resolver";
import type { CategoryModule } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

type CategorySwatchPickerProps = {
  value: string;
  onChange: (category: string) => void;
  module?: CategoryModule;
};

export function CategorySwatchPicker({
  value,
  onChange,
  module = "calendar",
}: CategorySwatchPickerProps) {
  const { categories, metaByKey, loading } = useUserCategories(module);

  if (loading) {
    return <div className="h-8 w-full animate-pulse rounded bg-muted/40" />;
  }

  const options =
    categories.length > 0
      ? categories.map((category) => ({
          key: category.key,
          meta: metaByKey[category.key] ?? fallbackCategoryMeta(category.key),
        }))
      : [];

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
      {options.map(({ key, meta }) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            className={cn(
              "flex items-center gap-1.5 rounded border-2 border-border px-2 py-1 font-sans text-xs shadow-sm transition-transform",
              meta.bgClass,
              meta.textClass,
              selected && "ring-2 ring-foreground ring-offset-1 shadow-md",
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
