import { tool } from "ai";
import { z } from "zod";
import { listGeneratedApps, createGeneratedApp } from "@/lib/templates/actions";
import { buildTemplateGenerationPrompt } from "@/lib/templates/ai-prompt";
import { generatedAppDefinitionSchema } from "@/lib/templates/schema";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";
import { getAiConfigForUser } from "@/lib/settings/ai-config";
import type { AssistantToolContext } from "@/lib/assistant/types";
import { privacyExecute } from "@/lib/assistant/tools/privacy-tool";

export function createTemplatesTools(ctx: AssistantToolContext) {
  return {
    listGeneratedApps: tool({
      description: "List AI-generated template apps.",
      inputSchema: z.object({}),
      execute: privacyExecute(ctx, async () => {
        const apps = await listGeneratedApps();
        return apps.map((a) => ({
          id: a.id,
          appName: a.appName,
          description: a.description,
          sidebarPinned: a.sidebarPinned,
        }));
      }),
    }),

    generateTemplateApp: tool({
      description: "Generate a new mini-app from a natural language prompt.",
      inputSchema: z.object({ prompt: z.string().max(500) }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (input) => {
        const aiConfig = await getAiConfigForUser(ctx.clerkId);
        const result = await generateText({
          model: openrouter(aiConfig.model),
          system: buildTemplateGenerationPrompt(input.prompt),
          prompt: input.prompt,
          output: Output.object({ schema: generatedAppDefinitionSchema }),
        });
        const app = await createGeneratedApp(result.output);
        return { appId: app.id, appName: app.appName };
      }),
    }),
  };
}
