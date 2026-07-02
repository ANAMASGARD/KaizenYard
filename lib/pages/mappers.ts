import { isKanbanColor } from "@/lib/kanban/colors";
import type {
  PageListItem,
  PageRecord,
  PageTemplate,
  SpaceListItem,
  SpaceRecord,
} from "@/lib/pages/types";
import type { SpaceRole } from "@/lib/pages/room";

const PAGE_TEMPLATES: PageTemplate[] = [
  "blank",
  "project_plan",
  "meeting_notes",
  "prd",
  "research_notes",
  "task_plan",
];

export function isPageTemplate(value: string): value is PageTemplate {
  return (PAGE_TEMPLATES as string[]).includes(value);
}

export function spaceRowToListItem(
  row: {
    id: number;
    name: string;
    description: string | null;
    color: string;
    isVault: boolean;
    pinned: boolean;
    isFavorite: boolean;
    archivedAt: Date | null;
    updatedAt: Date;
    clerkId: string;
  },
  role: SpaceRole,
  pageCount: number,
  fileCount: number,
  ownerInitials: string,
): SpaceListItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: isKanbanColor(row.color) ? row.color : "yellow",
    isVault: row.isVault,
    pinned: row.pinned,
    isFavorite: row.isFavorite,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    role,
    pageCount,
    fileCount,
    ownerInitials,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function spaceRecordToListItem(
  record: SpaceRecord,
  ownerInitials: string,
): SpaceListItem {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    color: record.color,
    isVault: record.isVault,
    pinned: record.pinned,
    isFavorite: record.isFavorite,
    archivedAt: record.archivedAt,
    role: record.role,
    pageCount: record.pageCount,
    fileCount: record.fileCount,
    ownerInitials,
    updatedAt: record.updatedAt,
  };
}

export function pageRowToListItem(
  row: {
    id: number;
    spaceId: number;
    title: string;
    template: string;
    isFavorite: boolean;
    archivedAt: Date | null;
    lastEditedByClerkId: string | null;
    updatedAt: Date;
  },
  role: SpaceRole,
  authorInitials: string,
  locked = false,
): PageListItem {
  return {
    id: row.id,
    spaceId: row.spaceId,
    title: locked ? "••••••" : row.title,
    template: isPageTemplate(row.template) ? row.template : "blank",
    isFavorite: row.isFavorite,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    role,
    lastEditedByClerkId: row.lastEditedByClerkId,
    authorInitials,
    updatedAt: row.updatedAt.toISOString(),
    locked,
  };
}

export function pageRecordToListItem(
  record: PageRecord,
  authorInitials: string,
  locked = false,
): PageListItem {
  return {
    id: record.id,
    spaceId: record.spaceId,
    title: locked ? "••••••" : record.title,
    template: record.template,
    isFavorite: record.isFavorite,
    archivedAt: record.archivedAt,
    role: record.role,
    lastEditedByClerkId: record.lastEditedByClerkId,
    authorInitials,
    updatedAt: record.updatedAt,
    locked,
  };
}

export const PAGE_TEMPLATE_LABELS: Record<PageTemplate, string> = {
  blank: "Document",
  project_plan: "Project Plan",
  meeting_notes: "Notes",
  prd: "Document",
  research_notes: "Reference",
  task_plan: "Planning",
};

export function fileTypeLabel(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("text/")) return "Text";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return "Spreadsheet";
  }
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return "Presentation";
  }
  return "File";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
