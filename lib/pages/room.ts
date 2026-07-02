export type CollaboratorRole = "editor" | "viewer";
export type SpaceRole = "owner" | CollaboratorRole;

export function isCollaboratorRole(value: string): value is CollaboratorRole {
  return value === "editor" || value === "viewer";
}

const PAGE_ROOM_PREFIX = "pages:page:";

export function pageRoomId(pageId: number): string {
  return `${PAGE_ROOM_PREFIX}${pageId}`;
}

export function parsePageRoomId(room: string): number | null {
  if (!room.startsWith(PAGE_ROOM_PREFIX)) return null;
  const id = Number.parseInt(room.slice(PAGE_ROOM_PREFIX.length), 10);
  return Number.isFinite(id) ? id : null;
}
