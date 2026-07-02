"use client";

import type { PrivacyMode } from "@/lib/assistant/types";
import { privacyModeLabel } from "@/lib/assistant/modes";
import { cn } from "@/lib/utils";

const MODES: PrivacyMode[] = ["standard", "blind", "witness", "vault", "delegate"];

type PrivacyModeRailProps = {
  mode: PrivacyMode;
  onChange: (mode: PrivacyMode) => void;
  className?: string;
};

export function PrivacyModeRail({ mode, onChange, className }: PrivacyModeRailProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="tablist" aria-label="Privacy mode">
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          onClick={() => onChange(m)}
          className={cn(
            "border-2 border-border px-3 py-1.5 font-head text-[10px] uppercase tracking-wider shadow-sm transition hover:-translate-y-0.5",
            mode === m
              ? "bg-primary text-primary-foreground"
              : "bg-background text-foreground hover:bg-muted",
          )}
        >
          {privacyModeLabel(m)}
        </button>
      ))}
    </div>
  );
}
