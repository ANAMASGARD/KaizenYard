import { and, eq, isNotNull } from "drizzle-orm";
import { db, noteCollaborators, notes } from "@/db";
import { hasMinRole } from "@/lib/collaboration/types";
import {
  isCollaboratorRole,
  type NoteRole,
} from "@/lib/notes/room";

export type { NoteRole, CollaboratorRole } from "@/lib/notes/room";

export async function getNoteRole(
  noteId: number,
  clerkId: string,
): Promise<NoteRole | null> {
  const [note] = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!note) return null;

  if (note.deletedAt !== null && note.clerkId !== clerkId) {
    return null;
  }

  if (note.clerkId === clerkId) return "owner";

  const [collaborator] = await db
    .select()
    .from(noteCollaborators)
    .where(
      and(
        eq(noteCollaborators.noteId, noteId),
        eq(noteCollaborators.clerkId, clerkId),
        isNotNull(noteCollaborators.acceptedAt),
      ),
    )
    .limit(1);

  if (!collaborator) return null;
  if (!isCollaboratorRole(collaborator.role)) return null;
  return collaborator.role;
}

export async function requireNoteAccess(
  noteId: number,
  clerkId: string,
  minRole: "editor" | "viewer",
): Promise<NoteRole> {
  const role = await getNoteRole(noteId, clerkId);
  if (!role) {
    throw new Error("Note not found");
  }
  if (!hasMinRole(role, minRole)) {
    throw new Error("Insufficient permissions");
  }
  return role;
}

export async function requireNoteOwnership(
  noteId: number,
  clerkId: string,
): Promise<void> {
  const role = await getNoteRole(noteId, clerkId);
  if (role !== "owner") {
    throw new Error("Note not found");
  }
}
