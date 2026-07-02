import type { AssistantToolContext } from "@/lib/assistant/types";
import type { PrivacyMode } from "@/lib/assistant/types";
import { createCalendarTools } from "@/lib/assistant/tools/calendar-tools";
import { createKanbanTools } from "@/lib/assistant/tools/kanban-tools";
import { createNotesTools } from "@/lib/assistant/tools/notes-tools";
import { createWhiteboardTools } from "@/lib/assistant/tools/whiteboard-tools";
import { createPagesTools } from "@/lib/assistant/tools/pages-tools";
import { createTemplatesTools } from "@/lib/assistant/tools/templates-tools";
import { createSettingsTools } from "@/lib/assistant/tools/settings-tools";
import { createOverviewTools } from "@/lib/assistant/tools/overview-tools";
import { createWitnessTools } from "@/lib/assistant/tools/witness-tools";
import { createDelegateTools } from "@/lib/assistant/tools/delegate-tools";

function createCoreTools(ctx: AssistantToolContext) {
  return {
    ...createCalendarTools(ctx),
    ...createKanbanTools(ctx),
    ...createNotesTools(ctx),
    ...createWhiteboardTools(ctx),
    ...createPagesTools(ctx),
    ...createTemplatesTools(ctx),
    ...createSettingsTools(ctx),
    ...createOverviewTools(ctx),
  };
}

export function createAssistantTools(
  ctx: AssistantToolContext,
  sessionId: number,
  privacyMode: PrivacyMode,
) {
  const core = createCoreTools(ctx);

  switch (privacyMode) {
    case "witness":
      return { ...core, ...createWitnessTools(ctx) };
    case "delegate":
      return { ...core, ...createDelegateTools(ctx, sessionId) };
    case "blind":
    case "vault":
    case "standard":
      return core;
    default: {
      const _exhaustive: never = privacyMode;
      return _exhaustive;
    }
  }
}

export type AssistantTools = ReturnType<typeof createAssistantTools>;
