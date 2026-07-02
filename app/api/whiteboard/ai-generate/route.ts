import { auth } from "@clerk/nextjs/server";
import { requireWhiteboardAccess } from "@/lib/whiteboard/access";
import {
  buildAiDiagramPrompt,
  isAiDiagramType,
} from "@/lib/whiteboard/ai-diagram-prompts";
import type { ExcalidrawElementLike } from "@/lib/whiteboard/scene";
import {
  extractAssistantText,
  getOpenRouterClient,
  NOTES_LLM_MODEL,
} from "@/lib/notes/openrouter";

function parseDiagramJson(
  raw: string,
): { elements: ExcalidrawElementLike[] } | null {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  try {
    const parsed = JSON.parse(jsonText) as { elements?: unknown };
    if (!Array.isArray(parsed.elements)) {
      return null;
    }
    return { elements: parsed.elements as ExcalidrawElementLike[] };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as {
    whiteboardId?: number;
    prompt?: string;
    diagramType?: string;
  };

  const whiteboardId = body.whiteboardId;
  const prompt = body.prompt?.trim();
  const diagramType = body.diagramType;

  if (
    whiteboardId === undefined ||
    !prompt ||
    !diagramType ||
    !isAiDiagramType(diagramType)
  ) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await requireWhiteboardAccess(whiteboardId, userId, "editor");
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "OPENROUTER_API_KEY is not configured" },
      { status: 500 },
    );
  }

  try {
    const openRouter = getOpenRouterClient();
    const result = await openRouter.chat.send({
      chatRequest: {
        model: NOTES_LLM_MODEL,
        messages: [
          {
            role: "user",
            content: buildAiDiagramPrompt(diagramType, prompt),
          },
        ],
        stream: false,
      },
    });

    const raw = extractAssistantText(result.choices[0]?.message?.content).trim();
    if (!raw) {
      return Response.json(
        { error: "AI diagram returned empty response" },
        { status: 502 },
      );
    }

    const diagram = parseDiagramJson(raw);
    if (!diagram) {
      return Response.json(
        { error: "AI diagram returned invalid JSON" },
        { status: 502 },
      );
    }

    return Response.json(diagram);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI diagram generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
