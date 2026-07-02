"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/retroui/Button";
import {
  SettingsRow,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";
import { Switch } from "@/components/retroui/Switch";
import { useUserSettingsState } from "@/lib/settings/use-user-settings";
import { cn } from "@/lib/utils";

export function PrivacySection() {
  const { settings, loading, saveDebounced } = useUserSettingsState();

  if (loading || !settings) {
    return (
      <SettingsSectionCard title="Privacy & Security">
        <div className="h-24 animate-pulse rounded bg-muted/40" />
      </SettingsSectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <SettingsSectionCard
        title="Privacy & Security"
        description="Account security and how your data is used."
      >
        <SettingsRow
          label="Control data usage for AI"
          description="When disabled, AI features cannot send content to models."
        >
          <Switch
            checked={settings.allowAiDataUsage}
            onCheckedChange={(checked) => saveDebounced({ allowAiDataUsage: checked })}
          />
        </SettingsRow>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/settings/account/security"
            className={cn(buttonVariants())}
          >
            Password & 2FA
          </Link>
          <Link
            href="/settings/account/security"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Active sessions
          </Link>
        </div>

        <div className="rounded border-2 border-border bg-muted/20 p-4 font-sans text-sm text-muted-foreground">
          <p>
            Kaizenyard stores your productivity data in Postgres. Secure Vaults use
            client-side commitments and Stellar testnet verification — passphrases are never
            sent to our servers.
          </p>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
