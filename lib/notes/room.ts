export type NoteRole = "owner" | "editor" | "viewer";

export type { CollaboratorRole } from "@/lib/collaboration/types";
export { isCollaboratorRole } from "@/lib/collaboration/types";

export function notePageRoomId(noteId: number): string {
  return `notes:page:${noteId}`;
}

export function parseNotePageRoomId(room: string): number | null {
  const prefix = "notes:page:";
  if (!room.startsWith(prefix)) return null;
  const n = Number(room.slice(prefix.length));
  return Number.isFinite(n) ? n : null;
}
