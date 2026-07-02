import type { NoteRole } from "@/lib/notes/room";
import { hasMinRole } from "@/lib/collaboration/types";

export type NoteCapabilities = {
  canEdit: boolean;
  canManage: boolean;
  canShare: boolean;
  canTrash: boolean;
};

export function getNoteCapabilities(role: NoteRole): NoteCapabilities {
  return {
    canEdit: hasMinRole(role, "editor"),
    canManage: role === "owner",
    canShare: hasMinRole(role, "viewer"),
    canTrash: role === "owner",
  };
}
