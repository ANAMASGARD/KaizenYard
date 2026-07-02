import { auth } from "@clerk/nextjs/server";
import { getLlmViewSnapshotForSession } from "@/lib/assistant/privacy/llm-view-store";
import { getAssistantSessionForUser } from "@/lib/assistant/sessions/actions";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = Number(searchParams.get("sessionId"));
  if (!sessionId) {
    return Response.json({ error: "sessionId required" }, { status: 400 });
  }

  const session = await getAssistantSessionForUser(sessionId);
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const prompt = await getLlmViewSnapshotForSession(sessionId);
  return Response.json({
    agentSessionId: session.agentSessionId,
    privacyMode: session.privacyMode,
    llmView: prompt ?? "No LLM view captured yet — send a message first.",
  });
}
