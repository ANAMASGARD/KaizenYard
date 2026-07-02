import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { requireNoteAccess } from "@/lib/notes/access";
import {
  buildRefinePrompt,
  type AiRefineAction,
} from "@/lib/notes/ai-refine-prompts";

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

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  try {
    const { text: refined } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: buildRefinePrompt(action, text),
    });

    return Response.json({ text: refined.trim() });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI refine failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
