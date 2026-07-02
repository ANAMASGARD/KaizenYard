"use client";

import { Bot } from "lucide-react";
import type { PrivacyMode } from "@/lib/assistant/types";
import { privacyModeLabel } from "@/lib/assistant/modes";
import { AssistantSuggestions } from "@/components/assistant/assistant-suggestions";

type AssistantEmptyStateProps = {
  mode: PrivacyMode;
  onSuggestion: (prompt: string) => void;
};

export function AssistantEmptyState({ mode, onSuggestion }: AssistantEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="flex size-16 items-center justify-center border-2 border-border bg-primary shadow-md">
        <Bot className="size-8 text-primary-foreground" aria-hidden />
      </div>
      <div className="max-w-lg text-center">
        <h2 className="font-head text-2xl">Kaizen Witness</h2>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          {mode === "standard"
            ? "Your productivity command center — calendar, kanban, notes, and more."
            : `${privacyModeLabel(mode)} mode — privacy-first AI with tool calling and Web3 attestations.`}
        </p>
      </div>
      <div className="w-full max-w-3xl">
        <p className="mb-3 font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Try asking
        </p>
        <AssistantSuggestions mode={mode} onSelect={onSuggestion} />
      </div>
    </div>
  );
}
