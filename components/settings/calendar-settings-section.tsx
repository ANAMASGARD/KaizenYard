"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import {
  SettingsRow,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";
import { getCalendarSettings, updateCalendarSettings } from "@/lib/calendar/actions";
import type { CalendarSettingsRecord } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarSettingsSection() {
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

  if (!settings) {
    return (
      <SettingsSectionCard title="Calendar">
        <div className="h-24 animate-pulse rounded bg-muted/40" />
      </SettingsSectionCard>
    );
  }

  return (
    <SettingsSectionCard
      title="Calendar"
      description="Focus goals, work hours, and meeting cost defaults."
    >
      <SettingsRow label="Weekly focus goal (hours)">
        <Input
          type="number"
          min={1}
          max={80}
          className="w-28"
          value={settings.weeklyFocusGoalHours}
          disabled={pending}
          onChange={(e) => void save({ weeklyFocusGoalHours: Number(e.target.value) })}
        />
      </SettingsRow>

      <SettingsRow label="Average hourly rate ($)">
        <Input
          type="number"
          min={0}
          step={1}
          className="w-28"
          value={Math.round(settings.avgHourlyRateCents / 100)}
          disabled={pending}
          onChange={(e) =>
            void save({ avgHourlyRateCents: Math.round(Number(e.target.value) * 100) })
          }
        />
      </SettingsRow>

      <SettingsRow label="Work day start (minutes from midnight)">
        <Input
          type="number"
          min={0}
          max={1440}
          className="w-32"
          value={settings.workDayStartMin}
          disabled={pending}
          onChange={(e) => void save({ workDayStartMin: Number(e.target.value) })}
        />
      </SettingsRow>

      <SettingsRow label="Work day end (minutes from midnight)">
        <Input
          type="number"
          min={0}
          max={1440}
          className="w-32"
          value={settings.workDayEndMin}
          disabled={pending}
          onChange={(e) => void save({ workDayEndMin: Number(e.target.value) })}
        />
      </SettingsRow>

      <SettingsRow label="No-meeting days" description="Block focus time on these weekdays.">
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((label, day) => {
            const active = settings.noMeetingWeekdays.includes(day);
            return (
              <button
                key={label}
                type="button"
                disabled={pending}
                onClick={() => toggleNoMeetingDay(day)}
                className={cn(
                  "rounded border-2 px-2.5 py-1 font-head text-[10px] uppercase tracking-wide shadow-sm",
                  active
                    ? "border-border bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted/30",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </SettingsRow>

      <p className="font-sans text-sm text-muted-foreground">
        Quick access from the calendar toolbar is still available.{" "}
        <Link
          href="/calendar"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "ms-1 inline-flex",
          )}
        >
          Open calendar
        </Link>
      </p>
    </SettingsSectionCard>
  );
}
