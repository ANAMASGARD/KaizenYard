"use client";

import {
  inviteNoteCollaborator,
  listNoteCollaborators,
  removeNoteCollaborator,
  updateNoteCollaboratorRole,
} from "@/lib/notes/collaboration-actions";
import { CollaborationPanel as SharedCollaborationPanel } from "@/components/collaboration/collaboration-panel";

type CollaborationPanelProps = {
  noteId: number;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CollaborationPanel({
  noteId,
  isOwner,
  open,
  onOpenChange,
}: CollaborationPanelProps) {
  return (
    <SharedCollaborationPanel
      entityId={noteId}
      title="Share note"
      ownerLabel="Note owner"
      isOwner={isOwner}
      open={open}
      onOpenChange={onOpenChange}
      listCollaborators={listNoteCollaborators}
      inviteCollaborator={inviteNoteCollaborator}
      updateCollaboratorRole={updateNoteCollaboratorRole}
      removeCollaborator={removeNoteCollaborator}
      editorRoleHint="Editor — can edit the note"
      viewerRoleHint="Viewer — read-only access"
    />
  );
}
