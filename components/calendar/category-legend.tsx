import { CATEGORY_META, CALENDAR_CATEGORIES } from "@/lib/calendar/categories";
import { cn } from "@/lib/utils";

export function CategoryLegend() {
  return (
    <div className="flex flex-wrap gap-2 border-t-2 border-border bg-background px-3 py-2">
      {CALENDAR_CATEGORIES.map((id) => {
        const meta = CATEGORY_META[id];
        return (
          <div
            key={id}
            className={cn(
              "flex items-center gap-1.5 rounded border-2 border-border px-2 py-0.5 text-[10px] font-sans shadow-xs",
              meta.bgClass,
              meta.textClass,
            )}
          >
            <span
              className={cn("size-2 rounded-full border border-border", meta.borderClass)}
            />
            {meta.label}
          </div>
        );
      })}
    </div>
  );
}
