export type BoardRole = "owner" | "editor" | "viewer";
export type CollaboratorRole = "editor" | "viewer";

export function kanbanBoardRoomId(boardId: number): string {
  return `kanban:board:${boardId}`;
}

export function parseKanbanBoardRoomId(room: string): number | null {
  const prefix = "kanban:board:";
  if (!room.startsWith(prefix)) return null;
  const n = Number(room.slice(prefix.length));
  return Number.isFinite(n) ? n : null;
}

export function isCollaboratorRole(value: string): value is CollaboratorRole {
  return value === "editor" || value === "viewer";
}
