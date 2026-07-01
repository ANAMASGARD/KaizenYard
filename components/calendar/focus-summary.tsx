import type { CalendarItemRecord, CalendarSettingsRecord } from "@/lib/calendar/types";
import {
  computeFragmentationScore,
  computeWeeklyScheduledHours,
} from "@/lib/calendar/focus-utils";
import { getWeekViewRange } from "@/lib/calendar/date-utils";
import { cn } from "@/lib/utils";

type FocusSummaryProps = {
  items: CalendarItemRecord[];
  cursorDate: Date;
  settings: CalendarSettingsRecord | null;
};

export function FocusSummary({ items, cursorDate, settings }: FocusSummaryProps) {
  if (!settings) return null;

  const { start, end } = getWeekViewRange(cursorDate);
  const scheduledHours = computeWeeklyScheduledHours(items, start, end);
  const focusRemaining = Math.max(0, settings.weeklyFocusGoalHours - scheduledHours);
  const fragmentation = computeFragmentationScore(items, start, end, settings);
  const progress = Math.min(
    100,
    (scheduledHours / Math.max(settings.weeklyFocusGoalHours, 1)) * 100,
  );

  return (
    <div className="flex flex-wrap items-center gap-3 border-b-2 border-border bg-muted/20 px-3 py-2 font-sans text-xs">
      <div className="flex min-w-[8rem] flex-col gap-1">
        <span className="font-head text-[10px] uppercase tracking-wide">
          Focus time left
        </span>
        <div className="h-2 overflow-hidden rounded border border-border bg-background">
          <div
            className={cn(
              "h-full transition-all",
              progress > 80 ? "bg-destructive" : "bg-primary",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-muted-foreground">
          {focusRemaining.toFixed(1)}h of {settings.weeklyFocusGoalHours}h goal
        </span>
      </div>
      <div>
        <span className="font-head text-[10px] uppercase tracking-wide">
          Fragmentation
        </span>
        <p className="font-semibold">
          {fragmentation} tight gap{fragmentation === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
