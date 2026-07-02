"use client";

import { useDraggable } from "@dnd-kit/core";
import { Bell, CheckSquare, GripVertical, MapPin } from "lucide-react";
import { CATEGORY_META, isCalendarCategory } from "@/lib/calendar/categories";
import { fallbackCategoryMeta } from "@/lib/settings/category-resolver";
import { formatTime } from "@/lib/calendar/date-utils";
import type { CalendarItemRecord } from "@/lib/calendar/types";
import { eventDragId } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

type CalendarEventChipProps = {
  item: CalendarItemRecord;
  compact?: boolean;
  showDragHandle?: boolean;
  onClick?: () => void;
};

export function CalendarEventChip({
  item,
  compact = false,
  showDragHandle = true,
  onClick,
}: CalendarEventChipProps) {
  const meta = isCalendarCategory(item.category)
    ? CATEGORY_META[item.category]
    : fallbackCategoryMeta(item.category);
  const Icon = item.itemType === "reminder" ? Bell : CheckSquare;
  const scheduled = item.scheduledAt ? new Date(item.scheduledAt) : null;
  const displayTitle = item.isPrivate ? "Busy" : item.title;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: eventDragId(item.occurrenceKey),
      data: { type: "event", item },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 rounded border-2 border-border border-l-4 px-1.5 py-1 text-left shadow-sm transition-opacity",
        meta.bgClass,
        meta.borderClass,
        meta.textClass,
        isDragging && "z-50 opacity-60",
        compact ? "text-[10px]" : "text-xs",
      )}
    >
      {showDragHandle && (
        <button
          type="button"
          className="shrink-0 cursor-grab active:cursor-grabbing"
          aria-label={`Drag ${displayTitle}`}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-3" />
        </button>
      )}
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-1 text-left"
        onClick={onClick}
      >
        <Icon className="size-3 shrink-0" />
        <span className="truncate font-medium">{displayTitle}</span>
        {scheduled && (
          <span className="shrink-0 font-sans text-[10px] opacity-80">
            {formatTime(scheduled)}
          </span>
        )}
        {item.location && !item.isPrivate && (
          <MapPin className="size-2.5 shrink-0 opacity-70" aria-hidden />
        )}
      </button>
    </div>
  );
}
