"use client";

import { updateNotifications } from "@/lib/settings/actions";
import {
  SettingsRow,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";
import { Switch } from "@/components/retroui/Switch";
import { useUserSettingsState } from "@/lib/settings/use-user-settings";
import type { NotificationSettings } from "@/lib/settings/types";

const TOGGLES: {
  key: keyof Omit<NotificationSettings, "dueDateAlertOffset">;
  label: string;
  description: string;
}[] = [
  { key: "email", label: "Email notifications", description: "Product updates and alerts." },
  { key: "taskReminders", label: "Task reminders", description: "Due dates and follow-ups." },
  { key: "comments", label: "Comment notifications", description: "Collaboration activity." },
  { key: "marketing", label: "Marketing emails", description: "Tips, news, and offers." },
  { key: "systemUpdates", label: "System updates", description: "Maintenance and releases." },
  { key: "push", label: "Push notifications", description: "Browser push when supported." },
];

export function NotificationsSection() {
  const { settings, loading, setSettings } = useUserSettingsState();

  if (loading || !settings) {
    return (
      <SettingsSectionCard title="Notifications">
        <div className="h-24 animate-pulse rounded bg-muted/40" />
      </SettingsSectionCard>
    );
  }

  async function toggle(
    key: keyof Omit<NotificationSettings, "dueDateAlertOffset">,
    checked: boolean,
  ) {
    if (!settings) return;
    const next = { ...settings.notifications, [key]: checked };
    setSettings({ ...settings, notifications: next });
    const updated = await updateNotifications({ [key]: checked });
    setSettings(updated);
  }

  return (
    <SettingsSectionCard
      title="Notifications"
      description="Choose how Kaizenyard keeps you in the loop."
    >
      {TOGGLES.map((item) => (
        <SettingsRow key={item.key} label={item.label} description={item.description}>
          <Switch
            checked={settings.notifications[item.key]}
            onCheckedChange={(checked) => void toggle(item.key, checked)}
          />
        </SettingsRow>
      ))}

      <SettingsRow label="Due date alerts" description="How early to remind you.">
        <select
          className="h-9 min-w-[12rem] rounded border-2 border-border bg-background px-2 text-sm shadow-sm"
          value={settings.notifications.dueDateAlertOffset}
          onChange={async (e) => {
            if (!settings) return;
            const next = { ...settings.notifications, dueDateAlertOffset: e.target.value };
            setSettings({ ...settings, notifications: next });
            const updated = await updateNotifications({ dueDateAlertOffset: e.target.value });
            setSettings(updated);
          }}
        >
          <option value="1h">1 hour before</option>
          <option value="1d">1 day before</option>
          <option value="2d">2 days before</option>
          <option value="1w">1 week before</option>
        </select>
      </SettingsRow>
    </SettingsSectionCard>
  );
}
