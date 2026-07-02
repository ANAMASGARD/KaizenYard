import { tool } from "ai";
import { z } from "zod";
import {
  listCalendarItems,
  getCalendarSettings,
  createCalendarItem,
  updateCalendarItem,
} from "@/lib/calendar/actions";
import type { AssistantToolContext } from "@/lib/assistant/types";
import { privacyExecute } from "@/lib/assistant/tools/privacy-tool";

export function createCalendarTools(ctx: AssistantToolContext) {
  return {
    listCalendarItems: tool({
      description: "List calendar items in a date range (ISO strings).",
      inputSchema: z.object({
        rangeStart: z.string().describe("ISO start datetime"),
        rangeEnd: z.string().describe("ISO end datetime"),
      }),
      execute: privacyExecute(ctx, async (hydrated) => {
        const items = await listCalendarItems(hydrated.rangeStart, hydrated.rangeEnd);
        return items.map((i) => ({
          id: i.id,
          title: i.title,
          itemType: i.itemType,
          category: i.category,
          scheduledAt: i.scheduledAt,
          durationMin: i.durationMin,
          description: i.description,
          location: i.location,
        }));
      }),
    }),

    getCalendarSettings: tool({
      description: "Get user calendar settings (focus goals, work hours).",
      inputSchema: z.object({}),
      execute: privacyExecute(ctx, async () => getCalendarSettings()),
    }),

    createCalendarItem: tool({
      description: "Create a calendar item (event, task, or reminder).",
      inputSchema: z.object({
        title: z.string(),
        itemType: z.enum(["task", "reminder"]),
        category: z.string(),
        scheduledAt: z.string().optional(),
        durationMin: z.number().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (hydrated) => {
        const item = await createCalendarItem({
          title: hydrated.title,
          itemType: hydrated.itemType,
          category: hydrated.category,
          scheduledAt: hydrated.scheduledAt,
          durationMin: hydrated.durationMin,
          description: hydrated.description,
          location: hydrated.location,
        });
        return { id: item.id, title: item.title, scheduledAt: item.scheduledAt };
      }),
    }),

    updateCalendarItem: tool({
      description: "Update an existing calendar item by ID.",
      inputSchema: z.object({
        id: z.number(),
        title: z.string().optional(),
        scheduledAt: z.string().optional(),
        durationMin: z.number().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (hydrated) => {
        const item = await updateCalendarItem(hydrated.id, {
          title: hydrated.title,
          scheduledAt: hydrated.scheduledAt,
          durationMin: hydrated.durationMin,
          description: hydrated.description,
          location: hydrated.location,
        });
        return { id: item.id, title: item.title };
      }),
    }),
  };
}
