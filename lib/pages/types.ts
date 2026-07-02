import type { KanbanColor } from "@/lib/kanban/colors";
import type { SpaceRole } from "@/lib/pages/room";

export type TiptapJson = Record<string, unknown>;

export type PageTemplate =
  | "blank"
  | "project_plan"
  | "meeting_notes"
  | "prd"
  | "research_notes"
  | "task_plan";

export type SpaceFilter = "all" | "favorites" | "recent" | "archived";

export type SpaceSort = "updated" | "name" | "created";

export type SpaceRecord = {
  id: number;
  clerkId: string;
  name: string;
  description: string | null;
  color: KanbanColor;
  isVault: boolean;
  vaultCommitment: string | null;
  vaultSalt: string | null;
  pinned: boolean;
  isFavorite: boolean;
  archivedAt: string | null;
  deletedAt: string | null;
  sortOrder: number;
  role: SpaceRole;
  pageCount: number;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SpaceListItem = {
  id: number;
  name: string;
  description: string | null;
  color: KanbanColor;
  isVault: boolean;
  pinned: boolean;
  isFavorite: boolean;
  archivedAt: string | null;
  role: SpaceRole;
  pageCount: number;
  fileCount: number;
  ownerInitials: string;
  updatedAt: string;
};

export type PageRecord = {
  id: number;
  spaceId: number;
  clerkId: string;
  title: string;
  template: PageTemplate;
  content: TiptapJson;
  isFavorite: boolean;
  archivedAt: string | null;
  deletedAt: string | null;
  sortOrder: number;
  lastEditedByClerkId: string | null;
  role: SpaceRole;
  createdAt: string;
  updatedAt: string;
};

export type PageListItem = {
  id: number;
  spaceId: number;
  title: string;
  template: PageTemplate;
  isFavorite: boolean;
  archivedAt: string | null;
  role: SpaceRole;
  lastEditedByClerkId: string | null;
  authorInitials: string;
  updatedAt: string;
  locked?: boolean;
};

export type SpaceFileListItem = {
  id: number;
  spaceId: number;
  pageId: number | null;
  clerkId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  isFavorite: boolean;
  archivedAt: string | null;
  role: SpaceRole;
  authorInitials: string;
  updatedAt: string;
};

export type SpaceContentItem =
  | ({ kind: "page" } & PageListItem)
  | ({ kind: "file" } & SpaceFileListItem);

export type CreateSpaceInput = {
  name?: string;
  description?: string;
  color?: KanbanColor;
  isVault?: boolean;
  vaultCommitment?: string;
  vaultSalt?: string;
};

export type UpdateSpaceInput = {
  name?: string;
  description?: string;
  color?: KanbanColor;
  pinned?: boolean;
  isFavorite?: boolean;
  archivedAt?: string | null;
};

export type CreatePageInput = {
  spaceId: number;
  title?: string;
  template?: PageTemplate;
  content?: TiptapJson;
};

export type UpdatePageInput = {
  title?: string;
  template?: PageTemplate;
  content?: TiptapJson;
  isFavorite?: boolean;
  archivedAt?: string | null;
};
