import { tool } from "ai";
import { z } from "zod";
import { listWhiteboards, getWhiteboard, createWhiteboard } from "@/lib/whiteboard/actions";
import { KANBAN_COLORS } from "@/lib/kanban/colors";
import type { AssistantToolContext } from "@/lib/assistant/types";
import { privacyExecute } from "@/lib/assistant/tools/privacy-tool";

export function createWhiteboardTools(ctx: AssistantToolContext) {
  return {
    listWhiteboards: tool({
      description: "List whiteboards.",
      inputSchema: z.object({ query: z.string().optional() }),
      execute: privacyExecute(ctx, async ({ query }) => {
        const boards = await listWhiteboards({ query });
        return boards.map((b) => ({
          id: b.id,
          title: b.title,
          color: b.color,
          pinned: b.pinned,
        }));
      }),
    }),

    getWhiteboard: tool({
      description: "Get whiteboard metadata and element count (not full scene).",
      inputSchema: z.object({ whiteboardId: z.number() }),
      execute: privacyExecute(ctx, async ({ whiteboardId }) => {
        const board = await getWhiteboard(whiteboardId);
        if (!board) {
          return { error: "Whiteboard not found" };
        }
        const content = board.content as { elements?: unknown[] };
        return {
          id: board.id,
          title: board.title,
          elementCount: Array.isArray(content.elements) ? content.elements.length : 0,
        };
      }),
    }),

    createWhiteboard: tool({
      description: "Create a new whiteboard.",
      inputSchema: z.object({
        title: z.string().optional(),
        color: z.enum(KANBAN_COLORS).optional(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (input) => {
        const board = await createWhiteboard(input);
        return { whiteboardId: board.id, title: board.title };
      }),
    }),
  };
}
