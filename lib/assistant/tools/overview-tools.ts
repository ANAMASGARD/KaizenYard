import { tool } from "ai";
import { z } from "zod";
import { getProductivityOverview } from "@/lib/dashboard/actions";
import type { AssistantToolContext } from "@/lib/assistant/types";
import { privacyExecute } from "@/lib/assistant/tools/privacy-tool";

export function createOverviewTools(ctx: AssistantToolContext) {
  return {
    getProductivityOverview: tool({
      description: "Get counts of calendar items, boards, tasks, notes, etc.",
      inputSchema: z.object({}),
      execute: privacyExecute(ctx, async () => getProductivityOverview()),
    }),
  };
}
