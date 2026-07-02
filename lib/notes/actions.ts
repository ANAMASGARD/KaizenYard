"use server";

import { auth } from "@clerk/nextjs/server";
import {
  and,
  eq,
  ilike,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { db, noteCollaborators, notes } from "@/db";
import { getNoteRole, requireNoteAccess, requireNoteOwnership } from "@/lib/notes/access";
import { noteRowToListItem } from "@/lib/notes/mappers";
import { EMPTY_TIPTAP_DOC } from "@/lib/notes/persistence";
import type { NoteRole } from "@/lib/notes/room";
import { isKanbanColor, type KanbanColor } from "@/lib/kanban/colors";
import { isValidCategoryKey } from "@/lib/settings/categories-actions";
import type {
  CreateNoteInput,
  NoteListItem,
  NoteRecord,
  TiptapJson,
  UpdateNoteInput,
} from "@/lib/notes/types";

const EMPTY_DOC: TiptapJson = EMPTY_TIPTAP_DOC;

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function toNoteRecord(
  row: typeof notes.$inferSelect,
  role: NoteRole,
): NoteRecord {
  return {
    id: row.id,
    clerkId: row.clerkId,
    title: row.title,
    color: isKanbanColor(row.color) ? row.color : "yellow",
    categoryKey: row.categoryKey ?? null,
    content: row.content as TiptapJson,
    pinned: row.pinned,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    sortOrder: row.sortOrder,
    role,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function resolveRoleForNote(
  noteId: number,
  clerkId: string,
  ownerClerkId: string,
): Promise<NoteRole | null> {
  if (ownerClerkId === clerkId) return "owner";
  return getNoteRole(noteId, clerkId);
}

export async function listNotes(options?: {
  trash?: boolean;
  query?: string;
}): Promise<NoteListItem[]> {
  const userId = await requireUserId();
  const trash = options?.trash ?? false;
  const query = options?.query?.trim();

  const owned = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.clerkId, userId),
        trash ? isNotNull(notes.deletedAt) : isNull(notes.deletedAt),
        query ? ilike(notes.title, `%${query}%`) : undefined,
      ),
    );

  const collabRows = await db
    .select({ note: notes, role: noteCollaborators.role })
    .from(noteCollaborators)
    .innerJoin(notes, eq(noteCollaborators.noteId, notes.id))
    .where(
      and(
        eq(noteCollaborators.clerkId, userId),
        isNotNull(noteCollaborators.acceptedAt),
        trash ? isNotNull(notes.deletedAt) : isNull(notes.deletedAt),
        query ? ilike(notes.title, `%${query}%`) : undefined,
      ),
    );

  const items: NoteListItem[] = [];
  const seen = new Set<number>();

  for (const row of owned) {
    seen.add(row.id);
    items.push(noteRowToListItem(row, "owner"));
  }

  for (const { note, role } of collabRows) {
    if (seen.has(note.id)) continue;
    seen.add(note.id);
    const noteRole: NoteRole =
      role === "viewer" ? "viewer" : role === "editor" ? "editor" : "editor";
    items.push(noteRowToListItem(note, noteRole));
  }

  items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return items;
}

export async function getNote(noteId: number): Promise<NoteRecord | null> {
  const userId = await requireUserId();

  const [row] = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!row) return null;

  const role = await resolveRoleForNote(noteId, userId, row.clerkId);
  if (!role) return null;

  return toNoteRecord(row, role);
}

export async function createNote(input?: CreateNoteInput): Promise<NoteRecord> {
  const userId = await requireUserId();

  const color =
    input?.color && isKanbanColor(input.color) ? input.color : "yellow";

  const [maxOrder] = await db
    .select({ max: sql<number>`coalesce(max(${notes.sortOrder}), -1)` })
    .from(notes)
    .where(and(eq(notes.clerkId, userId), isNull(notes.deletedAt)));

  const [row] = await db
    .insert(notes)
    .values({
      clerkId: userId,
      title: input?.title?.trim() || "Untitled",
      color,
      content: input?.content ?? EMPTY_DOC,
      sortOrder: (maxOrder?.max ?? -1) + 1,
    })
    .returning();

  return toNoteRecord(row, "owner");
}

export async function updateNote(
  noteId: number,
  input: UpdateNoteInput,
): Promise<NoteRecord> {
  const userId = await requireUserId();
  const role = await requireNoteAccess(noteId, userId, "editor");

  if (input.categoryKey) {
    const valid = await isValidCategoryKey("notes", input.categoryKey);
    if (!valid) {
      throw new Error("Invalid category");
    }
  }

  const [row] = await db
    .update(notes)
    .set({
      ...(input.title !== undefined ? { title: input.title.trim() || "Untitled" } : {}),
      ...(input.color !== undefined && isKanbanColor(input.color)
        ? { color: input.color }
        : {}),
      ...(input.categoryKey !== undefined ? { categoryKey: input.categoryKey } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(notes.id, noteId))
    .returning();

  if (!row) {
    throw new Error("Note not found");
  }

  return toNoteRecord(row, role);
}

export async function duplicateNote(noteId: number): Promise<NoteRecord> {
  const userId = await requireUserId();
  await requireNoteAccess(noteId, userId, "viewer");

  const [source] = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!source) {
    throw new Error("Note not found");
  }

  return createNote({
    title: `${source.title} (copy)`,
    color: isKanbanColor(source.color) ? source.color : "yellow",
    content: source.content as TiptapJson,
  });
}

export async function togglePin(noteId: number): Promise<NoteRecord> {
  const userId = await requireUserId();
  const role = await requireNoteAccess(noteId, userId, "editor");

  const [current] = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!current) {
    throw new Error("Note not found");
  }

  const [row] = await db
    .update(notes)
    .set({ pinned: !current.pinned, updatedAt: sql`now()` })
    .where(eq(notes.id, noteId))
    .returning();

  return toNoteRecord(row, role);
}

export async function setNoteColor(
  noteId: number,
  color: KanbanColor,
): Promise<NoteRecord> {
  if (!isKanbanColor(color)) {
    throw new Error("Invalid color");
  }
  return updateNote(noteId, { color });
}

export async function setNoteCategory(
  noteId: number,
  categoryKey: string | null,
): Promise<NoteRecord> {
  return updateNote(noteId, { categoryKey });
}

export async function softDeleteNote(noteId: number): Promise<void> {
  const userId = await requireUserId();
  await requireNoteOwnership(noteId, userId);

  await db
    .update(notes)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(notes.id, noteId));
}

export async function restoreNote(noteId: number): Promise<NoteRecord> {
  const userId = await requireUserId();
  await requireNoteOwnership(noteId, userId);

  const [row] = await db
    .update(notes)
    .set({ deletedAt: null, updatedAt: sql`now()` })
    .where(eq(notes.id, noteId))
    .returning();

  if (!row) {
    throw new Error("Note not found");
  }

  return toNoteRecord(row, "owner");
}

export async function permanentDeleteNote(noteId: number): Promise<void> {
  const userId = await requireUserId();
  await requireNoteOwnership(noteId, userId);

  await db.delete(notes).where(eq(notes.id, noteId));
}

export async function emptyTrash(): Promise<number> {
  const userId = await requireUserId();

  const trashed = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.clerkId, userId), isNotNull(notes.deletedAt)));

  if (trashed.length === 0) return 0;

  await db.delete(notes).where(
    and(
      eq(notes.clerkId, userId),
      isNotNull(notes.deletedAt),
    ),
  );

  return trashed.length;
}

export async function searchNotes(query: string): Promise<NoteListItem[]> {
  return listNotes({ query, trash: false });
}
