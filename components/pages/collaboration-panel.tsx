"use client";

import {
  inviteSpaceCollaborator,
  listSpaceCollaborators,
  removeSpaceCollaborator,
  updateSpaceCollaboratorRole,
} from "@/lib/pages/collaboration-actions";
import { CollaborationPanel as SharedCollaborationPanel } from "@/components/collaboration/collaboration-panel";

type CollaborationPanelProps = {
  spaceId: number;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CollaborationPanel({
  spaceId,
  isOwner,
  open,
  onOpenChange,
}: CollaborationPanelProps) {
  return (
    <SharedCollaborationPanel
      entityId={spaceId}
      title="Share space"
      ownerLabel="Space owner"
      isOwner={isOwner}
      open={open}
      onOpenChange={onOpenChange}
      listCollaborators={listSpaceCollaborators}
      inviteCollaborator={inviteSpaceCollaborator}
      updateCollaboratorRole={updateSpaceCollaboratorRole}
      removeCollaborator={removeSpaceCollaborator}
      editorRoleHint="Editor — can edit pages"
      viewerRoleHint="Viewer — read-only access"
    />
  );
}
