export type WhiteboardRole = "owner" | "editor" | "viewer";

export type { CollaboratorRole } from "@/lib/collaboration/types";
export { isCollaboratorRole } from "@/lib/collaboration/types";

export function whiteboardPageRoomId(whiteboardId: number): string {
  return `whiteboard:page:${whiteboardId}`;
}

export function parseWhiteboardPageRoomId(room: string): number | null {
  const prefix = "whiteboard:page:";
  if (!room.startsWith(prefix)) return null;
  const n = Number(room.slice(prefix.length));
  return Number.isFinite(n) ? n : null;
}
