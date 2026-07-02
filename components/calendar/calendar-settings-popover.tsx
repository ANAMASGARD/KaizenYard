"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Popover } from "@/components/retroui/Popover";
import { getCalendarSettings, updateCalendarSettings } from "@/lib/calendar/actions";
import type { CalendarSettingsRecord } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarSettingsPopoverProps = {
  onSettingsChange?: (settings: CalendarSettingsRecord) => void;
};

export function CalendarSettingsPopover({
  onSettingsChange,
}: CalendarSettingsPopoverProps) {
  const [settings, setSettings] = useState<CalendarSettingsRecord | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void getCalendarSettings().then(setSettings);
  }, []);

  async function save(patch: Partial<CalendarSettingsRecord>) {
    if (!settings) return;
    setPending(true);
    try {
      const next = await updateCalendarSettings(patch);
      setSettings(next);
      onSettingsChange?.(next);
    } finally {
      setPending(false);
    }
  }

  function toggleNoMeetingDay(day: number) {
    if (!settings) return;
    const current = settings.noMeetingWeekdays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    void save({ noMeetingWeekdays: next });
  }

  if (!settings) return null;

  return (
    <Popover>
      <Popover.Trigger
        render={
          <Button type="button" variant="outline" size="icon" aria-label="Calendar settings">
            <Settings className="size-4" />
          </Button>
        }
      />
      <Popover.Content align="end" className="w-72 space-y-4 p-4">
        <p className="font-head text-sm font-semibold">Calendar settings</p>

        <div className="space-y-1.5">
          <label className="font-head text-xs uppercase tracking-wide">
            Weekly focus goal (hours)
          </label>
          <Input
            type="number"
            min={0}
            max={40}
            value={settings.weeklyFocusGoalHours}
            disabled={pending}
            onChange={(e) =>
              void save({ weeklyFocusGoalHours: Number(e.target.value) })
            }
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-head text-xs uppercase tracking-wide">
            Avg hourly rate ($)
          </label>
          <Input
            type="number"
            min={0}
            step={5}
            value={settings.avgHourlyRateCents / 100}
            disabled={pending}
            onChange={(e) =>
              void save({
                avgHourlyRateCents: Math.round(Number(e.target.value) * 100),
              })
            }
          />
        </div>

        <div className="space-y-1.5">
          <p className="font-head text-xs uppercase tracking-wide">No-meeting days</p>
          <div className="flex flex-wrap gap-1">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={label}
                type="button"
                disabled={pending}
                onClick={() => toggleNoMeetingDay(day)}
                className={cn(
                  "rounded border-2 border-border px-2 py-0.5 font-sans text-[10px]",
                  settings.noMeetingWeekdays.includes(day)
                    ? "bg-primary shadow-sm"
                    : "bg-background",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <a
          href="/settings/calendar"
          className="block font-sans text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Open full calendar settings →
        </a>
      </Popover.Content>
    </Popover>
  );
}
