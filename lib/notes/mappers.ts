import { isKanbanColor } from "@/lib/kanban/colors";
import type { NoteListItem, NoteRecord } from "@/lib/notes/types";
import type { NoteRole } from "@/lib/notes/room";

export function noteRecordToListItem(record: NoteRecord): NoteListItem {
  return {
    id: record.id,
    title: record.title,
    color: record.color,
    categoryKey: record.categoryKey,
    pinned: record.pinned,
    deletedAt: record.deletedAt,
    role: record.role,
    updatedAt: record.updatedAt,
  };
}

export function noteRowToListItem(
  row: {
    id: number;
    title: string;
    color: string;
    categoryKey?: string | null;
    pinned: boolean;
    deletedAt: Date | null;
    updatedAt: Date;
  },
  role: NoteRole,
): NoteListItem {
  return {
    id: row.id,
    title: row.title,
    color: isKanbanColor(row.color) ? row.color : "yellow",
    categoryKey: row.categoryKey ?? null,
    pinned: row.pinned,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    role,
    updatedAt: row.updatedAt.toISOString(),
  };
}
