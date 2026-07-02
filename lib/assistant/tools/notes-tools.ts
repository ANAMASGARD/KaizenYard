import { tool } from "ai";
import { z } from "zod";
import { listNotes, getNote, createNote, updateNote } from "@/lib/notes/actions";
import { KANBAN_COLORS } from "@/lib/kanban/colors";
import { tiptapJsonToPlainText } from "@/lib/assistant/tiptap-text";
import type { AssistantToolContext } from "@/lib/assistant/types";
import { privacyExecute } from "@/lib/assistant/tools/privacy-tool";

export function createNotesTools(ctx: AssistantToolContext) {
  return {
    listNotes: tool({
      description: "List notes, optionally filtered by search query.",
      inputSchema: z.object({ query: z.string().optional() }),
      execute: privacyExecute(ctx, async ({ query }) => {
        const notes = await listNotes({ query });
        return notes.map((n) => ({
          id: n.id,
          title: n.title,
          color: n.color,
          pinned: n.pinned,
          updatedAt: n.updatedAt,
        }));
      }),
    }),

    getNote: tool({
      description: "Get a note by ID with plain-text content excerpt.",
      inputSchema: z.object({ noteId: z.number() }),
      execute: privacyExecute(ctx, async ({ noteId }) => {
        const note = await getNote(noteId);
        if (!note) {
          return { error: "Note not found" };
        }
        const text = tiptapJsonToPlainText(note.content);
        return {
          id: note.id,
          title: note.title,
          contentExcerpt: text.slice(0, 2000),
        };
      }),
    }),

    createNote: tool({
      description: "Create a new note.",
      inputSchema: z.object({
        title: z.string().optional(),
        color: z.enum(KANBAN_COLORS).optional(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (input) => {
        const note = await createNote({
          title: input.title,
          color: input.color,
        });
        return { noteId: note.id, title: note.title };
      }),
    }),

    updateNote: tool({
      description: "Update note title.",
      inputSchema: z.object({
        noteId: z.number(),
        title: z.string(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (input) => {
        const note = await updateNote(input.noteId, { title: input.title });
        return { noteId: note.id, title: note.title };
      }),
    }),
  };
}
