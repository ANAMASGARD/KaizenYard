"use client";

import { Popover } from "@/components/retroui/Popover";
import { CalendarEventChip } from "@/components/calendar/calendar-event-chip";
import type { CalendarItemRecord } from "@/lib/calendar/types";
import { parseDayKey } from "@/lib/calendar/date-utils";

type DayOverflowPopoverProps = {
  dayKey: string;
  items: CalendarItemRecord[];
  hiddenCount: number;
  onEditItem: (item: CalendarItemRecord) => void;
};

export function DayOverflowPopover({
  dayKey,
  items,
  hiddenCount,
  onEditItem,
}: DayOverflowPopoverProps) {
  const date = parseDayKey(dayKey);

  return (
    <Popover>
      <Popover.Trigger
        render={
          <button
            type="button"
            className="w-full rounded border border-border/20 bg-muted px-1 py-0.5 text-left font-sans text-[10px] hover:bg-accent"
          >
            +{hiddenCount} more
          </button>
        }
      />
      <Popover.Content align="start" className="w-64 space-y-2 p-3">
        <p className="font-head text-sm font-semibold">
          {date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </p>
        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {items.map((item) => (
            <CalendarEventChip
              key={item.id}
              item={item}
              compact
              showDragHandle={false}
              onClick={() => onEditItem(item)}
            />
          ))}
        </div>
      </Popover.Content>
    </Popover>
  );
}
