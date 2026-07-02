import { isKanbanColor } from "@/lib/kanban/colors";
import type { WhiteboardListItem, WhiteboardRecord } from "@/lib/whiteboard/types";
import type { WhiteboardRole } from "@/lib/whiteboard/room";

export function whiteboardRecordToListItem(
  record: WhiteboardRecord,
): WhiteboardListItem {
  return {
    id: record.id,
    title: record.title,
    color: record.color,
    pinned: record.pinned,
    deletedAt: record.deletedAt,
    role: record.role,
    updatedAt: record.updatedAt,
  };
}

export function whiteboardRowToListItem(
  row: {
    id: number;
    title: string;
    color: string;
    pinned: boolean;
    deletedAt: Date | null;
    updatedAt: Date;
  },
  role: WhiteboardRole,
): WhiteboardListItem {
  return {
    id: row.id,
    title: row.title,
    color: isKanbanColor(row.color) ? row.color : "yellow",
    pinned: row.pinned,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    role,
    updatedAt: row.updatedAt.toISOString(),
  };
}
