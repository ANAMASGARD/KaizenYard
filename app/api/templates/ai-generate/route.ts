import { auth } from "@clerk/nextjs/server";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";
import { buildTemplateGenerationPrompt } from "@/lib/templates/ai-prompt";
import { generatedAppDefinitionSchema } from "@/lib/templates/schema";
import { PROMPT_MAX_LENGTH } from "@/lib/templates/types";

const TEMPLATES_LLM_MODEL = "qwen/qwen3.5-flash-02-23" as const;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt?.trim();

  if (!prompt || prompt.length > PROMPT_MAX_LENGTH) {
    return Response.json({ error: "Invalid prompt" }, { status: 400 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "OPENROUTER_API_KEY is not configured" },
      { status: 500 },
    );
  }

  try {
    const result = await generateText({
      model: openrouter(TEMPLATES_LLM_MODEL),
      system: buildTemplateGenerationPrompt(prompt),
      prompt,
      output: Output.object({
        schema: generatedAppDefinitionSchema,
      }),
    });
    return Response.json({ definition: result.output });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Template generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
