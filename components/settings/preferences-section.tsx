"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import {
  SettingsRow,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";
import { Switch } from "@/components/retroui/Switch";
import { ACCENT_COLORS } from "@/lib/settings/defaults";
import { useUserSettingsState } from "@/lib/settings/use-user-settings";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  const { settings, loading, saveDebounced, save } = useUserSettingsState();

  useEffect(() => {
    if (!settings?.accentColor) return;
    document.documentElement.dataset.accent = settings.accentColor;
  }, [settings?.accentColor]);

  if (loading || !settings) {
    return (
      <SettingsSectionCard title="Preferences">
        <div className="h-24 animate-pulse rounded bg-muted/40" />
      </SettingsSectionCard>
    );
  }

  return (
    <SettingsSectionCard
      title="Preferences"
      description="Theme, defaults, and workspace behavior."
    >
      <SettingsRow label="Theme" description="Light, dark, or follow system.">
        <div className="flex flex-wrap gap-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                "rounded border-2 px-3 py-1.5 font-head text-xs uppercase tracking-wide shadow-sm",
                theme === option.value
                  ? "border-border bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted/30",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </SettingsRow>

      <SettingsRow label="Accent color" description="Primary accent across the app.">
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              onClick={() => {
                document.documentElement.dataset.accent = color;
                void save({ accentColor: color });
              }}
              className={cn(
                "size-8 rounded-full border-2 border-border shadow-sm",
                color === settings.accentColor && "ring-2 ring-foreground ring-offset-1",
              )}
              data-accent-swatch={color}
            />
          ))}
        </div>
      </SettingsRow>

      <SettingsRow label="Default calendar view">
        <select
          className="h-9 min-w-[10rem] rounded border-2 border-border bg-background px-2 text-sm shadow-sm"
          value={settings.defaultCalendarView}
          onChange={(e) =>
            saveDebounced({
              defaultCalendarView: e.target.value as typeof settings.defaultCalendarView,
            })
          }
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Default task priority">
        <select
          className="h-9 min-w-[10rem] rounded border-2 border-border bg-background px-2 text-sm shadow-sm"
          value={settings.defaultTaskPriority}
          onChange={(e) => saveDebounced({ defaultTaskPriority: e.target.value })}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Date format">
        <select
          className="h-9 min-w-[10rem] rounded border-2 border-border bg-background px-2 text-sm shadow-sm"
          value={settings.dateFormat}
          onChange={(e) => saveDebounced({ dateFormat: e.target.value })}
        >
          <option value="MMM d, yyyy">Jan 2, 2026</option>
          <option value="dd/MM/yyyy">02/01/2026</option>
          <option value="yyyy-MM-dd">2026-01-02</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Time format">
        <select
          className="h-9 min-w-[10rem] rounded border-2 border-border bg-background px-2 text-sm shadow-sm"
          value={settings.timeFormat}
          onChange={(e) =>
            saveDebounced({ timeFormat: e.target.value as typeof settings.timeFormat })
          }
        >
          <option value="12h">12-hour</option>
          <option value="24h">24-hour</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Week starts on">
        <select
          className="h-9 min-w-[10rem] rounded border-2 border-border bg-background px-2 text-sm shadow-sm"
          value={settings.weekStartsOn}
          onChange={(e) => saveDebounced({ weekStartsOn: Number(e.target.value) })}
        >
          <option value={0}>Sunday</option>
          <option value={1}>Monday</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Auto-save" description="Automatically save edits across features.">
        <Switch
          checked={settings.autoSave}
          onCheckedChange={(checked) => saveDebounced({ autoSave: checked })}
        />
      </SettingsRow>

      <SettingsRow label="Compact mode" description="Tighter spacing in lists and sidebars.">
        <Switch
          checked={settings.compactMode}
          onCheckedChange={(checked) => saveDebounced({ compactMode: checked })}
        />
      </SettingsRow>

      <SettingsRow label="Show completed tasks" description="Keep done tasks visible on boards.">
        <Switch
          checked={settings.showCompletedTasks}
          onCheckedChange={(checked) => saveDebounced({ showCompletedTasks: checked })}
        />
      </SettingsRow>
    </SettingsSectionCard>
  );
}
