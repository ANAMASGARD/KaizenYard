import type { KanbanColor } from "@/lib/kanban/colors";
import type { NoteRole } from "@/lib/notes/room";

export type TiptapJson = Record<string, unknown>;

export type NoteRecord = {
  id: number;
  clerkId: string;
  title: string;
  color: KanbanColor;
  categoryKey: string | null;
  content: TiptapJson;
  pinned: boolean;
  deletedAt: string | null;
  sortOrder: number;
  role: NoteRole;
  createdAt: string;
  updatedAt: string;
};

export type NoteListItem = {
  id: number;
  title: string;
  color: KanbanColor;
  categoryKey: string | null;
  pinned: boolean;
  deletedAt: string | null;
  role: NoteRole;
  updatedAt: string;
};

export type CreateNoteInput = {
  title?: string;
  color?: KanbanColor;
  content?: TiptapJson;
};

export type UpdateNoteInput = {
  title?: string;
  color?: KanbanColor;
  categoryKey?: string | null;
  content?: TiptapJson;
  pinned?: boolean;
};
