"use client";

import { UserProfile } from "@clerk/nextjs";
import { clerkAppearance } from "@/components/dashboard/clerk-appearance";
import { Card } from "@/components/retroui/Card";
import { Text } from "@/components/retroui/Text";

export function SettingsAccountProfile() {
  return (
    <Card className="border-2 border-border p-4 shadow-md sm:p-6">
      <Text as="h2" className="mb-2 text-lg">
        Account & Security
      </Text>
      <p className="mb-6 font-sans text-sm text-muted-foreground">
        Manage password, two-factor authentication, connected accounts, and active sessions.
      </p>
      <UserProfile
        routing="path"
        path="/settings/account"
        appearance={clerkAppearance}
      />
    </Card>
  );
}
