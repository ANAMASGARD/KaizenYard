import type { KanbanColor } from "@/lib/kanban/colors";
import type { WhiteboardRole } from "@/lib/whiteboard/room";
import type { WhiteboardScene } from "@/lib/whiteboard/scene";

export type WhiteboardRecord = {
  id: number;
  clerkId: string;
  title: string;
  color: KanbanColor;
  content: WhiteboardScene;
  pinned: boolean;
  deletedAt: string | null;
  sortOrder: number;
  role: WhiteboardRole;
  createdAt: string;
  updatedAt: string;
};

export type WhiteboardListItem = {
  id: number;
  title: string;
  color: KanbanColor;
  pinned: boolean;
  deletedAt: string | null;
  role: WhiteboardRole;
  updatedAt: string;
};

export type CreateWhiteboardInput = {
  title?: string;
  color?: KanbanColor;
  content?: WhiteboardScene;
};

export type UpdateWhiteboardInput = {
  title?: string;
  color?: KanbanColor;
  content?: WhiteboardScene;
  pinned?: boolean;
};
