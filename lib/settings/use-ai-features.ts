"use client";

import { useEffect, useState } from "react";
import { getUserSettings } from "@/lib/settings/actions";
import type { AiFeatures, UserSettingsRecord } from "@/lib/settings/types";

export function useAiFeatures() {
  const [settings, setSettings] = useState<UserSettingsRecord | null>(null);

  useEffect(() => {
    void getUserSettings().then(setSettings);
  }, []);

  function isFeatureEnabled(feature: keyof AiFeatures): boolean {
    if (!settings) return true;
    return settings.allowAiDataUsage && settings.aiFeatures[feature];
  }

  return {
    settings,
    isFeatureEnabled,
    aiDisabled: settings ? !settings.allowAiDataUsage : false,
  };
}
