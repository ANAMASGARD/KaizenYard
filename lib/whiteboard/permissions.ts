import type { WhiteboardRole } from "@/lib/whiteboard/room";
import { hasMinRole } from "@/lib/collaboration/types";

export type WhiteboardCapabilities = {
  canEdit: boolean;
  canManage: boolean;
  canShare: boolean;
  canTrash: boolean;
};

export function getWhiteboardCapabilities(
  role: WhiteboardRole,
): WhiteboardCapabilities {
  return {
    canEdit: hasMinRole(role, "editor"),
    canManage: role === "owner",
    canShare: hasMinRole(role, "viewer"),
    canTrash: role === "owner",
  };
}
