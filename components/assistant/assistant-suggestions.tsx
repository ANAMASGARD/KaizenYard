"use client";

import type { PrivacyMode } from "@/lib/assistant/types";
import { Card } from "@/components/retroui/Card";

const SUGGESTIONS: Record<PrivacyMode, Array<{ label: string; prompt: string }>> = {
  standard: [
    { label: "Create task tomorrow", prompt: "Create a task for tomorrow on my default board" },
    { label: "Calendar this week", prompt: "What's on my calendar this week?" },
    { label: "Summarize notes", prompt: "List my notes and summarize the most recent one" },
    { label: "New kanban board", prompt: "Create a kanban board called Sprint Planning" },
    { label: "Plan my week", prompt: "Help me plan my week based on my calendar and tasks" },
    { label: "Habit tracker app", prompt: "Generate a habit tracker template app" },
  ],
  blind: [
    { label: "Private week plan", prompt: "Plan my week without exposing my contacts to AI" },
    { label: "Masked calendar", prompt: "What meetings do I have this week?" },
    { label: "Task overview", prompt: "Give me a productivity overview" },
    { label: "Anonymous summary", prompt: "Summarize my recent notes in blind mode" },
    { label: "Board status", prompt: "List my boards and open task counts" },
    { label: "Settings check", prompt: "What are my current AI and calendar settings?" },
  ],
  witness: [
    { label: "Anonymous retro", prompt: "Help me explain why this sprint failed — anonymously" },
    { label: "Witness aggregates", prompt: "Show witness group aggregates for my retro" },
    { label: "Anonymous task", prompt: "Create an anonymous follow-up task from my feedback" },
    { label: "Start retro pulse", prompt: "Start a retro pulse on my first kanban board" },
    { label: "Team themes", prompt: "What themes appear in anonymous witness feedback?" },
    { label: "Verified note", prompt: "Submit anonymous witness feedback as a note" },
  ],
  vault: [
    { label: "Vault summary", prompt: "Summarize my locked space after I unlock" },
    { label: "List vault spaces", prompt: "List my spaces and which are vaults" },
    { label: "Secure pages", prompt: "Search my pages without exposing vault titles" },
    { label: "Unlock guidance", prompt: "How do I unlock a vault for the agent?" },
    { label: "Private overview", prompt: "Productivity overview in vault witness mode" },
    { label: "Create safe page", prompt: "Create a page in a non-vault space" },
  ],
  delegate: [
    { label: "Governance triage", prompt: "Triage governance tasks for my wallet" },
    { label: "Delegate log", prompt: "Log a delegate action for community follow-up" },
    { label: "Wallet tasks", prompt: "List my boards and create a delegate-tagged task" },
    { label: "DAO overview", prompt: "Give me a productivity overview as DAO delegate" },
    { label: "Bind wallet", prompt: "Bind my Freighter wallet as delegate identity" },
    { label: "Anonymous delegate", prompt: "Create a task with delegate attestation" },
  ],
};

type AssistantSuggestionsProps = {
  mode: PrivacyMode;
  onSelect: (prompt: string) => void;
};

export function AssistantSuggestions({ mode, onSelect }: AssistantSuggestionsProps) {
  const items = SUGGESTIONS[mode];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <button key={item.label} type="button" onClick={() => onSelect(item.prompt)}>
          <Card className="h-full border-2 border-border p-4 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
            <p className="font-head text-sm">{item.label}</p>
            <p className="mt-1 font-sans text-xs text-muted-foreground line-clamp-2">
              {item.prompt}
            </p>
          </Card>
        </button>
      ))}
    </div>
  );
}
