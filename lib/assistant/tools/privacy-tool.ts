import type { UIMessage } from "ai";
import type { AssistantToolContext } from "@/lib/assistant/types";
import { rehydrateToolInput, tokenizeToolResult } from "@/lib/assistant/privacy/gateway";

export function privacyExecute<TInput, TOutput>(
  ctx: AssistantToolContext,
  execute: (input: TInput) => Promise<TOutput>,
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput) => {
    const hydrated = await rehydrateToolInput(input, ctx.agentSessionId, ctx.privacyMode);
    const result = await execute(hydrated);
    return tokenizeToolResult(result, ctx.agentSessionId, ctx.privacyMode);
  };
}

/** Adapter for ToolLoopAgent UI stream — gateway messages are valid UIMessage[]. */
export function toAgentUiMessages(messages: UIMessage[]): UIMessage[] {
  return messages;
}
