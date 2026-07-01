"use client";

import { UserProfile } from "@clerk/nextjs";
import { clerkAppearance } from "@/components/dashboard/clerk-appearance";
import { Text } from "@/components/retroui/Text";

export function SettingsProfile() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Text as="h1" className="mb-6">
        Settings
      </Text>
      <p className="mb-6 font-sans text-sm text-muted-foreground">
        Manage your account, security, connected accounts, and sessions.
      </p>
      <UserProfile
        routing="path"
        path="/settings"
        appearance={clerkAppearance}
      />
    </div>
  );
}
