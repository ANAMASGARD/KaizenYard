"use client";

import { useTheme } from "next-themes";
import { Toaster } from "@/components/retroui/Sonner";

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
