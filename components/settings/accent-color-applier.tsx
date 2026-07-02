"use client";

import { useEffect } from "react";
import { getUserSettings } from "@/lib/settings/actions";

export function AccentColorApplier() {
  useEffect(() => {
    void getUserSettings().then((settings) => {
      document.documentElement.dataset.accent = settings.accentColor;
    });
  }, []);

  return null;
}
