import type { SpaceRole } from "@/lib/pages/room";

export type SpaceCapabilities = {
  canEdit: boolean;
  canManageTrash: boolean;
  canInvite: boolean;
  canDelete: boolean;
  canShare: boolean;
};

export function getSpaceCapabilities(role: SpaceRole): SpaceCapabilities {
  switch (role) {
    case "owner":
      return {
        canEdit: true,
        canManageTrash: true,
        canInvite: true,
        canDelete: true,
        canShare: true,
      };
    case "editor":
      return {
        canEdit: true,
        canManageTrash: false,
        canInvite: false,
        canDelete: false,
        canShare: true,
      };
    case "viewer":
      return {
        canEdit: false,
        canManageTrash: false,
        canInvite: false,
        canDelete: false,
        canShare: false,
      };
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
