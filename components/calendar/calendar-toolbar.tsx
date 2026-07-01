"use client";

import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import type { CalendarView } from "@/lib/calendar/types";
import {
  addMonths,
  addWeeks,
  formatMonthYear,
  formatWeekRange,
} from "@/lib/calendar/date-utils";
import { CalendarSettingsPopover } from "@/components/calendar/calendar-settings-popover";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type CalendarToolbarProps = {
  view: CalendarView;
  cursorDate: Date;
  onViewChange: (view: CalendarView) => void;
  onCursorDateChange: (date: Date) => void;
  onToday: () => void;
  onNewTask: () => void;
  onSettingsChange?: () => void;
};

export function CalendarToolbar({
  view,
  cursorDate,
  onViewChange,
  onCursorDateChange,
  onToday,
  onNewTask,
  onSettingsChange,
}: CalendarToolbarProps) {
  const title =
    view === "month" ? formatMonthYear(cursorDate) : formatWeekRange(cursorDate);

  function goPrev() {
    onCursorDateChange(
      view === "month" ? addMonths(cursorDate, -1) : addWeeks(cursorDate, -1),
    );
  }

  function goNext() {
    onCursorDateChange(
      view === "month" ? addMonths(cursorDate, 1) : addWeeks(cursorDate, 1),
    );
  }

  return (
    <div className="border-b-2 border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
        <div>
          <h1 className="font-head text-base font-semibold sm:text-lg">{title}</h1>
          <p className="font-sans text-xs text-muted-foreground">
            Drop drafts or scheduled items onto any date
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded border-2 border-border shadow-sm">
            {(["month", "week"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onViewChange(v)}
                className={cn(
                  "px-3 py-1.5 font-head text-xs uppercase tracking-wide transition-colors",
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-accent",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button type="button" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={goPrev}
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={goNext}
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </Button>
          <a href="/calendar/export" download>
            <Button type="button" variant="outline" size="sm">
              <Download className="size-4" />
              <span className="ms-1 hidden sm:inline">Export .ics</span>
            </Button>
          </a>
          <CalendarSettingsPopover onSettingsChange={onSettingsChange} />
          <Button type="button" size="sm" onClick={onNewTask}>
            <Plus className="size-4" />
            <span className="ms-1">New task</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
