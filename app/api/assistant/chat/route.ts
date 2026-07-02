import { auth, currentUser } from "@clerk/nextjs/server";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { ToolLoopAgent, createAgentUIStreamResponse, isStepCount, type UIMessage } from "ai";
import {
  getAssistantSessionForUser,
  syncSessionMessagesFromChat,
} from "@/lib/assistant/sessions/actions";
import { buildAssistantSystemPrompt } from "@/lib/assistant/system-prompt";
import { createAssistantTools } from "@/lib/assistant/tools";
import { applyPrivacyGatewayToMessages } from "@/lib/assistant/privacy/gateway";
import { saveLlmViewSnapshot } from "@/lib/assistant/privacy/llm-view-store";
import { toAgentUiMessages } from "@/lib/assistant/tools/privacy-tool";
import {
  AiFeatureDisabledError,
  assertAiFeatureEnabled,
  getAiConfigForUser,
} from "@/lib/settings/ai-config";

export const maxDuration = 60;

type ChatRequestBody = {
  messages: UIMessage[];
  sessionId: number;
  vaultUnlockedSpaceIds?: number[];
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: "OPENROUTER_API_KEY is not configured" }, { status: 500 });
  }

  const body = (await request.json()) as ChatRequestBody;
  const { messages, sessionId, vaultUnlockedSpaceIds } = body;

  if (!sessionId || !Array.isArray(messages)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const session = await getAssistantSessionForUser(sessionId);
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const privacyMode = session.privacyMode;
    const aiConfig = await getAiConfigForUser(userId);
    assertAiFeatureEnabled(aiConfig, "assistant");

    const user = await currentUser();
    const { messages: gatewayMessages } = await applyPrivacyGatewayToMessages(messages, {
      privacyMode,
      agentSessionId: session.agentSessionId,
      userDisplayName: user?.fullName,
      userEmail: user?.primaryEmailAddress?.emailAddress,
    });

    const systemPrompt = buildAssistantSystemPrompt(aiConfig, privacyMode);
    await saveLlmViewSnapshot(
      session.agentSessionId,
      JSON.stringify({ system: systemPrompt, messages: gatewayMessages }, null, 2),
    );

    const toolContext = {
      clerkId: userId,
      privacyMode,
      agentSessionId: session.agentSessionId,
      witnessGroupId: session.witnessGroupId,
      delegateAddress: session.delegateAddress,
      vaultUnlockedSpaceIds: vaultUnlockedSpaceIds ?? [],
    };

    const tools = createAssistantTools(toolContext, sessionId, privacyMode);

    const agent = new ToolLoopAgent({
      model: openrouter(aiConfig.model),
      instructions: systemPrompt,
      tools,
      stopWhen: isStepCount(8),
    });

    return createAgentUIStreamResponse({
      agent,
      uiMessages: toAgentUiMessages(gatewayMessages),
      onFinish: async ({ messages: finalMessages }) => {
        await syncSessionMessagesFromChat(
          sessionId,
          finalMessages.map((m) => ({ role: m.role, parts: m.parts })),
        );
      },
    });
  } catch (err) {
    if (err instanceof AiFeatureDisabledError) {
      return Response.json({ error: err.message }, { status: 403 });
    }
    const message = err instanceof Error ? err.message : "Assistant chat failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
