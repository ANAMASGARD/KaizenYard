import { auth } from "@clerk/nextjs/server";
import { requireNoteAccess } from "@/lib/notes/access";
import {
  buildRefinePrompt,
  type AiRefineAction,
} from "@/lib/notes/ai-refine-prompts";
import {
  extractAssistantText,
  getOpenRouterClient,
  NOTES_LLM_MODEL,
} from "@/lib/notes/openrouter";

const REFINE_ACTIONS: AiRefineAction[] = [
  "improve_grammar",
  "rephrase",
  "make_shorter",
  "make_longer",
  "simplify",
  "change_tone",
];

function isRefineAction(value: string): value is AiRefineAction {
  return REFINE_ACTIONS.includes(value as AiRefineAction);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as {
    text?: string;
    action?: string;
    noteId?: number;
  };

  const text = body.text?.trim();
  const action = body.action;
  const noteId = body.noteId;

  if (!text || !action || !isRefineAction(action) || noteId === undefined) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await requireNoteAccess(noteId, userId, "editor");
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
            content: buildRefinePrompt(action, text),
          },
        ],
        stream: false,
      },
    });

    const refined = extractAssistantText(
      result.choices[0]?.message?.content,
    ).trim();

    if (!refined) {
      return Response.json({ error: "AI refine returned empty text" }, { status: 502 });
    }

    return Response.json({ text: refined });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI refine failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
