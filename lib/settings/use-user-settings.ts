"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUserSettings, updateUserSettings } from "@/lib/settings/actions";
import type { UserSettingsRecord } from "@/lib/settings/types";
import { toast } from "sonner";

export function useUserSettingsState() {
  const [settings, setSettings] = useState<UserSettingsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void getUserSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (patch: Partial<UserSettingsRecord>) => {
    setSaving(true);
    try {
      const next = await updateUserSettings(patch);
      setSettings(next);
      return next;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveDebounced = useCallback(
    (patch: Partial<UserSettingsRecord>, delayMs = 400) => {
      setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        void save(patch);
      }, delayMs);
    },
    [save],
  );

  return { settings, loading, saving, save, saveDebounced, setSettings };
}
