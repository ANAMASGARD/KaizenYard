import { getBoardRole } from "@/lib/kanban/access";
import { parseKanbanBoardRoomId } from "@/lib/kanban/room";
import { getNoteRole } from "@/lib/notes/access";
import { parseNotePageRoomId } from "@/lib/notes/room";
import { getPageRole } from "@/lib/pages/access";
import { parsePageRoomId } from "@/lib/pages/room";
import { getWhiteboardRole } from "@/lib/whiteboard/access";
import { parseWhiteboardPageRoomId } from "@/lib/whiteboard/room";

export type LiveblocksRoomAccess = "viewer" | "editor";

type RoomAuthHandler = {
  parse: (room: string) => number | null;
  getRole: (entityId: number, clerkId: string) => Promise<string | null>;
};

const ROOM_HANDLERS: RoomAuthHandler[] = [
  {
    parse: parseKanbanBoardRoomId,
    getRole: getBoardRole,
  },
  {
    parse: parseNotePageRoomId,
    getRole: getNoteRole,
  },
  {
    parse: parsePageRoomId,
    getRole: getPageRole,
  },
  {
    parse: parseWhiteboardPageRoomId,
    getRole: getWhiteboardRole,
  },
];

export async function resolveLiveblocksRoomAccess(
  room: string,
  clerkId: string,
): Promise<LiveblocksRoomAccess | null> {
  for (const handler of ROOM_HANDLERS) {
    const entityId = handler.parse(room);
    if (entityId === null) continue;

    const role = await handler.getRole(entityId, clerkId);
    if (!role) return null;

    return role === "viewer" ? "viewer" : "editor";
  }

  return null;
}

export function isKnownLiveblocksRoom(room: string): boolean {
  return ROOM_HANDLERS.some((handler) => handler.parse(room) !== null);
}
