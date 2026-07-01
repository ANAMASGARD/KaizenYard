"use client";

import { useDroppable } from "@dnd-kit/core";
import { CalendarEventChip } from "@/components/calendar/calendar-event-chip";
import {
  SLOT_MINUTES,
  WEEKDAY_LABELS,
  WEEK_END_HOUR,
  WEEK_START_HOUR,
  combineDayAndMinutes,
  formatDayKey,
  formatTime,
  isToday,
  minutesFromMidnight,
  slotIndexToMinutes,
  weekDays,
  weekSlotCount,
} from "@/lib/calendar/date-utils";
import type { CalendarItemRecord } from "@/lib/calendar/types";
import { weekSlotDropId } from "@/lib/calendar/types";
import { useNowMs } from "@/lib/use-now-ms";
import { cn } from "@/lib/utils";

type WeekViewProps = {
  cursorDate: Date;
  items: CalendarItemRecord[];
  isClient: boolean;
  onSlotClick: (dayKey: string, slotMinutes: number) => void;
  onEditItem: (item: CalendarItemRecord) => void;
};

const SLOT_HEIGHT = 28;
const TOTAL_SLOTS = weekSlotCount();

function WeekSlotCell({
  day,
  slotIndex,
  onSlotClick,
}: {
  day: Date;
  slotIndex: number;
  onSlotClick: (dayKey: string, slotMinutes: number) => void;
}) {
  const dayKey = formatDayKey(day);
  const slotMinutes = slotIndexToMinutes(slotIndex);
  const { setNodeRef, isOver } = useDroppable({
    id: weekSlotDropId(dayKey, slotIndex),
    data: { type: "week-slot", dayKey, slotIndex, slotMinutes },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSlotClick(dayKey, slotMinutes)}
      className={cn(
        "block w-full border-b border-border/10 hover:bg-accent/30",
        isOver && "bg-primary/25",
      )}
      style={{ height: SLOT_HEIGHT }}
      aria-label={`Add event ${formatTime(combineDayAndMinutes(day, slotMinutes))}`}
    />
  );
}

function WeekEventBlock({
  item,
  day,
  onEdit,
}: {
  item: CalendarItemRecord;
  day: Date;
  onEdit: () => void;
}) {
  if (!item.scheduledAt) return null;

  const start = new Date(item.scheduledAt);
  if (formatDayKey(start) !== formatDayKey(day)) return null;

  const startMin = minutesFromMidnight(start);
  const gridStart = WEEK_START_HOUR * 60;
  const gridEnd = WEEK_END_HOUR * 60;
  if (startMin < gridStart || startMin >= gridEnd) return null;

  const bufferTop =
    ((startMin - item.bufferBeforeMin - gridStart) / SLOT_MINUTES) * SLOT_HEIGHT;
  const top =
    ((startMin - gridStart) / SLOT_MINUTES) * SLOT_HEIGHT;
  const height = Math.max(
    (item.durationMin / SLOT_MINUTES) * SLOT_HEIGHT,
    SLOT_HEIGHT,
  );
  const bufferAfterHeight =
    (item.bufferAfterMin / SLOT_MINUTES) * SLOT_HEIGHT;

  return (
    <>
      {item.bufferBeforeMin > 0 && (
        <div
          className="pointer-events-none absolute inset-x-1 z-[5] rounded border border-dashed border-border/30 bg-muted/40"
          style={{
            top: Math.max(0, bufferTop),
            height: (item.bufferBeforeMin / SLOT_MINUTES) * SLOT_HEIGHT,
          }}
        />
      )}
      <div
        className="pointer-events-none absolute inset-x-1 z-10"
        style={{ top, height }}
      >
        <div className="pointer-events-auto h-full">
          <CalendarEventChip item={item} compact onClick={onEdit} />
        </div>
      </div>
      {item.bufferAfterMin > 0 && (
        <div
          className="pointer-events-none absolute inset-x-1 z-[5] rounded border border-dashed border-border/30 bg-muted/40"
          style={{ top: top + height, height: bufferAfterHeight }}
        />
      )}
    </>
  );
}

export function WeekView({
  cursorDate,
  items,
  isClient,
  onSlotClick,
  onEditItem,
}: WeekViewProps) {
  const days = weekDays(cursorDate);
  const nowMs = useNowMs();
  const now = nowMs > 0 ? new Date(nowMs) : null;

  const scheduled = items.filter((i) => i.scheduledAt);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-2 border-border bg-background shadow-md">
      <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b-2 border-border bg-muted/30">
        <div />
        {days.map((day) => (
          <div
            key={formatDayKey(day)}
            className={cn(
              "border-l border-border/10 px-2 py-2 text-center",
              isClient && isToday(day) && "bg-primary/30",
            )}
          >
            <p className="font-head text-[10px] uppercase">
              {WEEKDAY_LABELS[day.getDay()]}
            </p>
            <p className="font-head text-sm font-semibold">{day.getDate()}</p>
          </div>
        ))}
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="border-r border-border/10">
            {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
              const min = slotIndexToMinutes(i);
              const showLabel = min % 60 === 0;
              return (
                <div
                  key={i}
                  className="border-b border-border/10 pr-1 text-right font-sans text-[10px] text-muted-foreground"
                  style={{ height: SLOT_HEIGHT }}
                >
                  {showLabel
                    ? formatTime(
                        combineDayAndMinutes(new Date(), min),
                      ).replace(":00", "")
                    : ""}
                </div>
              );
            })}
          </div>

          {days.map((day) => (
            <div
              key={formatDayKey(day)}
              className="relative border-l border-border/10"
            >
              {Array.from({ length: TOTAL_SLOTS }, (_, slotIndex) => (
                <WeekSlotCell
                  key={slotIndex}
                  day={day}
                  slotIndex={slotIndex}
                  onSlotClick={onSlotClick}
                />
              ))}
              {scheduled.map((item) => (
                <WeekEventBlock
                  key={item.id}
                  item={item}
                  day={day}
                  onEdit={() => onEditItem(item)}
                />
              ))}
              {isClient &&
                now &&
                isToday(day) &&
                (() => {
                  const min = minutesFromMidnight(now);
                  const gridStart = WEEK_START_HOUR * 60;
                  const gridEnd = WEEK_END_HOUR * 60;
                  if (min < gridStart || min > gridEnd) return null;
                  const top = ((min - gridStart) / SLOT_MINUTES) * SLOT_HEIGHT;
                  return (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-red-500"
                      style={{ top }}
                      suppressHydrationWarning
                    />
                  );
                })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
