import type { UIMessage } from "ai";
import {
  createPrivacyEnvelopeState,
  detokenizeObject,
  tokenizeObject,
  tokenizeText,
  type PrivacyEnvelopeState,
} from "@/lib/assistant/privacy/envelope";
import { mergePrivacyMap, loadPrivacyMap } from "@/lib/assistant/privacy/map-store";
import { requiresTokenization } from "@/lib/assistant/modes";
import type { PrivacyMode } from "@/lib/assistant/types";

export type PrivacyGatewayResult = {
  messages: UIMessage[];
  map: Record<string, string>;
};

export async function applyPrivacyGatewayToMessages(
  messages: UIMessage[],
  options: {
    privacyMode: PrivacyMode;
    agentSessionId: string;
    userDisplayName?: string | null;
    userEmail?: string | null;
  },
): Promise<PrivacyGatewayResult> {
  if (!requiresTokenization(options.privacyMode)) {
    return { messages, map: {} };
  }

  const existing = await loadPrivacyMap(options.agentSessionId);
  const state = createPrivacyEnvelopeState(existing);

  if (options.userEmail) {
    tokenizeText(options.userEmail, state);
  }
  if (options.userDisplayName) {
    tokenizeText(options.userDisplayName, state);
  }

  const tokenized = messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) => {
      if (part.type === "text") {
        return { ...part, text: tokenizeText(part.text, state) };
      }
      return part;
    }),
  }));

  await mergePrivacyMap(options.agentSessionId, state.map);

  return { messages: tokenized, map: state.map };
}

export async function tokenizeToolResult<T>(
  result: T,
  agentSessionId: string,
  privacyMode: PrivacyMode,
): Promise<T> {
  if (!requiresTokenization(privacyMode)) {
    return result;
  }
  const map = await loadPrivacyMap(agentSessionId);
  const state = createPrivacyEnvelopeState(map);
  const tokenized = tokenizeObject(result, state);
  await mergePrivacyMap(agentSessionId, state.map);
  return tokenized;
}

export async function rehydrateToolInput<T>(
  input: T,
  agentSessionId: string,
  privacyMode: PrivacyMode,
): Promise<T> {
  if (!requiresTokenization(privacyMode)) {
    return input;
  }
  const map = await loadPrivacyMap(agentSessionId);
  return detokenizeObject(input, map);
}

export function getEnvelopeStateFromMap(map: Record<string, string>): PrivacyEnvelopeState {
  return createPrivacyEnvelopeState(map);
}

export { saveLlmViewSnapshot, getLlmViewSnapshotForSession } from "@/lib/assistant/privacy/llm-view-store";
