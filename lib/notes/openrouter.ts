import { OpenRouter } from "@openrouter/sdk";

export const NOTES_LLM_MODEL = "qwen/qwen3.5-flash-02-23" as const;

export function getOpenRouterClient(): OpenRouter {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  return new OpenRouter({
    apiKey,
    httpReferer: process.env.OPENROUTER_HTTP_REFERER ?? "https://kaizenyard.app",
    appTitle: process.env.OPENROUTER_APP_TITLE ?? "Kaizenyard",
  });
}

export function extractAssistantText(
  content: string | Array<{ text?: string }> | null | undefined,
): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
}
