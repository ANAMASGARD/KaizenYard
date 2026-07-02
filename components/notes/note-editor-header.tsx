"use client";

import { Check, MoreHorizontal, Pin, Share2, Users } from "lucide-react";
import type { SaveStatus } from "@/lib/notes/use-note-autosave";
import { getNoteCapabilities } from "@/lib/notes/permissions";
import type { NoteRole } from "@/lib/notes/room";
import { formatRelativeTime } from "@/lib/notes/date-utils";
import { ActiveCollaborators } from "@/components/notes/active-collaborators";
import { SpeakToNote } from "@/components/notes/speak-to-note";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Menu } from "@/components/retroui/Menu";
import { cn } from "@/lib/utils";

type NoteEditorHeaderProps = {
  title: string;
  pinned: boolean;
  noteRole: NoteRole;
  saveStatus: SaveStatus;
  wordCount: number;
  lastEdited: string;
  onTitleChange: (title: string) => void;
  onTogglePin: () => void;
  onShare: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTranscript: (text: string) => void;
};

function saveStatusLabel(status: SaveStatus): string {
  switch (status) {
    case "saved":
      return "Saved";
    case "saving":
      return "Saving…";
    case "unsaved":
      return "Unsaved";
    case "error":
      return "Save failed";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function NoteEditorHeader({
  title,
  pinned,
  noteRole,
  saveStatus,
  wordCount,
  lastEdited,
  onTitleChange,
  onTogglePin,
  onShare,
  onDuplicate,
  onDelete,
  onTranscript,
}: NoteEditorHeaderProps) {
  const { canEdit, canShare, canManage } = getNoteCapabilities(noteRole);
  const readOnly = !canEdit;

  return (
    <div className="flex flex-col gap-3 border-b-2 border-border pb-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            readOnly={readOnly}
            className="border-transparent px-0 font-head text-xl shadow-none focus-visible:ring-0"
            placeholder="Untitled"
          />
          <div className="flex flex-wrap items-center gap-3 font-sans text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded border px-2 py-0.5",
                saveStatus === "saved"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
                  : "border-border bg-muted/40",
              )}
            >
              {saveStatus === "saved" ? (
                <Check className="size-3" />
              ) : (
                <span className="size-2 animate-pulse rounded-full bg-amber-500" />
              )}
              {saveStatusLabel(saveStatus)}
            </span>
            <span>{wordCount} words</span>
            <span>Last edited {formatRelativeTime(lastEdited)}</span>
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Auto-save on
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActiveCollaborators />
          {canShare ? (
            <Button type="button" variant="outline" size="sm" onClick={onShare}>
              <Share2 className="size-4" />
              Share
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              type="button"
              variant={pinned ? "default" : "outline"}
              size="sm"
              onClick={onTogglePin}
              aria-label={pinned ? "Unpin note" : "Pin note"}
            >
              <Pin className="size-4" />
            </Button>
          ) : null}
          {noteRole !== "owner" ? (
            <span className="inline-flex items-center gap-1 rounded border border-violet-600 bg-violet-50 px-2 py-1 font-head text-[10px] uppercase tracking-wide text-violet-900 dark:bg-violet-950 dark:text-violet-100">
              <Users className="size-3" />
              Shared
            </span>
          ) : null}
          {canManage ? (
            <Menu>
              <Menu.Trigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <Menu.Content>
                <Menu.Item onClick={onDuplicate}>Duplicate</Menu.Item>
                <Menu.Item onClick={onDelete} className="text-red-600">
                  Move to trash
                </Menu.Item>
              </Menu.Content>
            </Menu>
          ) : null}
        </div>
      </div>

      {canEdit ? <SpeakToNote onTranscript={onTranscript} /> : null}
    </div>
  );
}
