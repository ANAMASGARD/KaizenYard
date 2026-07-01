"use client";

import { useDroppable } from "@dnd-kit/core";
import { CalendarEventChip } from "@/components/calendar/calendar-event-chip";
import { DayOverflowPopover } from "@/components/calendar/day-overflow-popover";
import {
  MONTH_OVERFLOW_LIMIT,
  WEEKDAY_LABELS,
  daysInMonthGrid,
  formatDayKey,
  isToday,
} from "@/lib/calendar/date-utils";
import type { CalendarItemRecord } from "@/lib/calendar/types";
import { monthDayDropId } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

type MonthViewProps = {
  cursorDate: Date;
  items: CalendarItemRecord[];
  isClient: boolean;
  onDayClick: (dayKey: string) => void;
  onEditItem: (item: CalendarItemRecord) => void;
};

function MonthDayCell({
  day,
  cursorDate,
  dayItems,
  isClient,
  onDayClick,
  onEditItem,
}: {
  day: Date;
  cursorDate: Date;
  dayItems: CalendarItemRecord[];
  isClient: boolean;
  onDayClick: (dayKey: string) => void;
  onEditItem: (item: CalendarItemRecord) => void;
}) {
  const dayKey = formatDayKey(day);
  const inMonth = day.getMonth() === cursorDate.getMonth();
  const { setNodeRef, isOver } = useDroppable({
    id: monthDayDropId(dayKey),
    data: { type: "month-day", dayKey },
  });

  const visible = dayItems.slice(0, MONTH_OVERFLOW_LIMIT);
  const hidden = dayItems.slice(MONTH_OVERFLOW_LIMIT);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-24 flex-col border-2 border-border/15 bg-background p-1 transition-colors",
        isOver && "bg-primary/20",
        !inMonth && "bg-muted/40 text-muted-foreground",
        isClient && isToday(day) && "ring-2 ring-inset ring-primary",
      )}
    >
      <button
        type="button"
        onClick={() => onDayClick(dayKey)}
        className={cn(
          "mb-1 self-start rounded px-1 font-head text-xs font-semibold hover:bg-accent",
          isClient && isToday(day) && "bg-primary text-primary-foreground",
        )}
      >
        {day.getDate()}
      </button>
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        {visible.map((item) => (
          <CalendarEventChip
            key={item.id}
            item={item}
            compact
            onClick={() => onEditItem(item)}
          />
        ))}
        {hidden.length > 0 && (
          <DayOverflowPopover
            dayKey={dayKey}
            items={dayItems}
            hiddenCount={hidden.length}
            onEditItem={onEditItem}
          />
        )}
      </div>
    </div>
  );
}

export function MonthView({
  cursorDate,
  items,
  isClient,
  onDayClick,
  onEditItem,
}: MonthViewProps) {
  const days = daysInMonthGrid(cursorDate);

  const itemsByDay = items.reduce<Record<string, CalendarItemRecord[]>>(
    (acc, item) => {
      if (!item.scheduledAt) return acc;
      const key = formatDayKey(new Date(item.scheduledAt));
      acc[key] = acc[key] ? [...acc[key], item] : [item];
      return acc;
    },
    {},
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-2 border-border bg-background shadow-md">
      <div className="grid grid-cols-7 border-b-2 border-border bg-muted/30">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-r border-border/10 px-2 py-2 text-center font-head text-[10px] uppercase tracking-wider last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 overflow-y-auto">
        {days.map((day) => {
          const dayKey = formatDayKey(day);
          return (
            <MonthDayCell
              key={dayKey}
              day={day}
              cursorDate={cursorDate}
              dayItems={itemsByDay[dayKey] ?? []}
              isClient={isClient}
              onDayClick={onDayClick}
              onEditItem={onEditItem}
            />
          );
        })}
      </div>
    </div>
  );
}
