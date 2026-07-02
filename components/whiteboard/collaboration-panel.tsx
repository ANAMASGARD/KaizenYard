"use client";

import {
  inviteWhiteboardCollaborator,
  listWhiteboardCollaborators,
  removeWhiteboardCollaborator,
  updateWhiteboardCollaboratorRole,
} from "@/lib/whiteboard/collaboration-actions";
import { CollaborationPanel as SharedCollaborationPanel } from "@/components/collaboration/collaboration-panel";

type CollaborationPanelProps = {
  whiteboardId: number;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CollaborationPanel({
  whiteboardId,
  isOwner,
  open,
  onOpenChange,
}: CollaborationPanelProps) {
  return (
    <SharedCollaborationPanel
      entityId={whiteboardId}
      title="Share whiteboard"
      ownerLabel="Whiteboard owner"
      isOwner={isOwner}
      open={open}
      onOpenChange={onOpenChange}
      listCollaborators={listWhiteboardCollaborators}
      inviteCollaborator={inviteWhiteboardCollaborator}
      updateCollaboratorRole={updateWhiteboardCollaboratorRole}
      removeCollaborator={removeWhiteboardCollaborator}
      editorRoleHint="Editor — can edit the whiteboard"
      viewerRoleHint="Viewer — read-only access"
    />
  );
}
