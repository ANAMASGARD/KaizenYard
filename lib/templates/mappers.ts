import type { GeneratedApp } from "@/db/schema";
import type {
  GeneratedAppDefinition,
  GeneratedAppListItem,
  GeneratedAppRecord,
  PinnedSidebarApp,
} from "@/lib/templates/types";
import { parseGeneratedAppDefinition } from "@/lib/templates/schema";

function toDefinition(raw: unknown): GeneratedAppDefinition {
  const parsed = parseGeneratedAppDefinition(raw);
  if (!parsed) {
    throw new Error("Invalid app definition stored in database");
  }
  return parsed;
}

export function generatedAppRowToRecord(row: GeneratedApp): GeneratedAppRecord {
  return {
    id: row.id,
    clerkId: row.clerkId,
    appName: row.appName,
    description: row.description,
    icon: row.icon,
    color: row.color,
    layout: row.layout as GeneratedAppRecord["layout"],
    definition: toDefinition(row.definition),
    runtimeState:
      row.runtimeState && typeof row.runtimeState === "object"
        ? (row.runtimeState as Record<string, unknown>)
        : {},
    sidebarPinned: row.sidebarPinned,
    sidebarOrder: row.sidebarOrder,
    shareToken: row.shareToken,
    shareEnabled: row.shareEnabled,
    shareMode: row.shareMode as GeneratedAppRecord["shareMode"],
    isZkShare: row.isZkShare,
    shareCommitment: row.shareCommitment,
    shareSalt: row.shareSalt,
    shareNullifierRoot: row.shareNullifierRoot,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function generatedAppRowToListItem(row: GeneratedApp): GeneratedAppListItem {
  return {
    id: row.id,
    appName: row.appName,
    description: row.description,
    icon: row.icon,
    color: row.color,
    sidebarPinned: row.sidebarPinned,
    sidebarOrder: row.sidebarOrder,
    shareToken: row.shareToken,
    shareEnabled: row.shareEnabled,
    shareMode: row.shareMode as GeneratedAppListItem["shareMode"],
    isZkShare: row.isZkShare,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function generatedAppRowToPinned(row: GeneratedApp): PinnedSidebarApp {
  return {
    id: row.id,
    appName: row.appName,
    icon: row.icon,
    color: row.color,
    sidebarOrder: row.sidebarOrder,
  };
}
