"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Avatar } from "@/components/retroui/Avatar";
import { buttonVariants } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { cn } from "@/lib/utils";
import {
  SettingsRow,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";
import { useUserSettingsState } from "@/lib/settings/use-user-settings";
import { maskEmail } from "@/lib/mask-email";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
];

const LOCALES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
];

export function ProfileSection() {
  const { user, isLoaded } = useUser();
  const { settings, loading, saveDebounced } = useUserSettingsState();

  if (!isLoaded || loading || !settings) {
    return (
      <SettingsSectionCard title="Profile" description="Loading profile…">
        <div className="h-24 animate-pulse rounded bg-muted/40" />
      </SettingsSectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <SettingsSectionCard
        title="Profile"
        description="Your identity and regional preferences."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-16 border-2 border-border shadow-sm">
            {user?.imageUrl ? (
              <Avatar.Image src={user.imageUrl} alt={user.fullName ?? "User"} />
            ) : null}
            <Avatar.Fallback className="font-head text-lg">
              {(user?.firstName?.[0] ?? user?.username?.[0] ?? "K").toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-head text-lg">{user?.fullName ?? "Kaizenyard user"}</p>
            <p className="font-sans text-sm text-muted-foreground">
              {maskEmail(user?.primaryEmailAddress?.emailAddress ?? "")}
            </p>
          </div>
        </div>

        <SettingsRow label="Timezone" description="Used for calendar and reminders.">
          <select
            className="h-9 min-w-[12rem] rounded border-2 border-border bg-background px-2 font-sans text-sm shadow-sm"
            value={settings.timezone}
            onChange={(e) => saveDebounced({ timezone: e.target.value })}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </SettingsRow>

        <SettingsRow label="Language" description="Default UI and AI output language.">
          <select
            className="h-9 min-w-[12rem] rounded border-2 border-border bg-background px-2 font-sans text-sm shadow-sm"
            value={settings.locale}
            onChange={(e) => {
              saveDebounced({
                locale: e.target.value,
                aiOutputLanguage: e.target.value,
              });
            }}
          >
            {LOCALES.map((locale) => (
              <option key={locale.value} value={locale.value}>
                {locale.label}
              </option>
            ))}
          </select>
        </SettingsRow>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Account actions"
        description="Password, 2FA, and session management via Clerk."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/settings/account" className={cn(buttonVariants())}>
            Manage account
          </Link>
          <Link
            href="/settings/account/security"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Active sessions
          </Link>
        </div>
        <div className="rounded border-2 border-dashed border-border bg-muted/20 p-4">
          <p className="font-sans text-sm text-muted-foreground">
            Display name and email are managed in your account security settings.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Input value={user?.fullName ?? ""} readOnly aria-label="Display name" />
            <Input
              value={user?.primaryEmailAddress?.emailAddress ?? ""}
              readOnly
              aria-label="Email"
            />
          </div>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
