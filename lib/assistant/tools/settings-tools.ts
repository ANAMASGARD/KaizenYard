import { tool } from "ai";
import { z } from "zod";
import { getUserSettings, updateUserSettings } from "@/lib/settings/actions";
import type { AssistantToolContext } from "@/lib/assistant/types";
import { privacyExecute } from "@/lib/assistant/tools/privacy-tool";

export function createSettingsTools(ctx: AssistantToolContext) {
  return {
    getUserSettings: tool({
      description: "Get user preferences (safe fields only).",
      inputSchema: z.object({}),
      execute: privacyExecute(ctx, async () => {
        const settings = await getUserSettings();
        return {
          defaultCalendarView: settings.defaultCalendarView,
          timezone: settings.timezone,
          aiModel: settings.aiModel,
          aiBehavior: settings.aiBehavior,
          aiTone: settings.aiTone,
          allowAiDataUsage: settings.allowAiDataUsage,
          aiFeatures: settings.aiFeatures,
        };
      }),
    }),

    updateUserSettings: tool({
      description: "Update safe user preferences (not security-related).",
      inputSchema: z.object({
        defaultCalendarView: z.enum(["day", "week", "month"]).optional(),
        timezone: z.string().optional(),
        compactMode: z.boolean().optional(),
        showCompletedTasks: z.boolean().optional(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (input) => {
        const updated = await updateUserSettings(input);
        return {
          defaultCalendarView: updated.defaultCalendarView,
          timezone: updated.timezone,
          compactMode: updated.compactMode,
        };
      }),
    }),
  };
}
