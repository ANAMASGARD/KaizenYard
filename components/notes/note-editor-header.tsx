"use client";

import { Check, MoreHorizontal, Pin, Share2, Users } from "lucide-react";
import type { SaveStatus } from "@/lib/notes/use-note-autosave";
import { getNoteCapabilities } from "@/lib/notes/permissions";
import type { SpeechLanguageId } from "@/lib/notes/speech-languages";
import type { NoteRole } from "@/lib/notes/room";
import { formatRelativeTime } from "@/lib/notes/date-utils";
import { ActiveCollaborators } from "@/components/notes/active-collaborators";
import { ReadAloud } from "@/components/notes/read-aloud";
import { SpeakToNote } from "@/components/notes/speak-to-note";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Menu } from "@/components/retroui/Menu";
import { cn } from "@/lib/utils";

/** Uniform toolbar buttons — same height, no hover shift (prevents overlap). */
const TOOLBAR_BTN =
  "h-8 shrink-0 gap-1.5 px-2.5 shadow-sm hover:translate-y-0 hover:shadow-sm active:translate-y-0 active:translate-x-0 active:shadow-sm";

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
  onSttStart?: () => void;
  onSpeechLanguageChange?: (language: SpeechLanguageId) => void;
  getNoteText: () => string;
  speak: (text: string) => void;
  stopTts: () => void;
  isSpeaking: boolean;
  ttsSupported: boolean;
  ttsError?: string | null;
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
  onSttStart,
  onSpeechLanguageChange,
  getNoteText,
  speak,
  stopTts,
  isSpeaking,
  ttsSupported,
  ttsError,
}: NoteEditorHeaderProps) {
  const { canEdit, canShare, canManage } = getNoteCapabilities(noteRole);
  const readOnly = !canEdit;

  return (
    <div className="flex flex-col gap-1.5 border-b-2 border-border px-3 py-2 sm:px-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          readOnly={readOnly}
          className="min-w-0 border-transparent px-0 font-head text-lg leading-tight shadow-none focus-visible:ring-0"
          placeholder="Untitled"
        />

        <div className="flex max-w-full flex-wrap items-center justify-end gap-1">
          <ActiveCollaborators compact />
          <ReadAloud
            getText={getNoteText}
            label="Read"
            speak={speak}
            stop={stopTts}
            isSpeaking={isSpeaking}
            supported={ttsSupported}
            error={ttsError}
            compact
            className="shrink-0"
          />
          {canShare ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={TOOLBAR_BTN}
              onClick={onShare}
            >
              <Share2 className="size-3.5" />
              Share
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              type="button"
              variant={pinned ? "default" : "outline"}
              size="sm"
              className={cn(TOOLBAR_BTN, "w-8 px-0")}
              onClick={onTogglePin}
              aria-label={pinned ? "Unpin note" : "Pin note"}
            >
              <Pin className="size-3.5" />
            </Button>
          ) : null}
          {noteRole !== "owner" ? (
            <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded border border-violet-600 bg-violet-50 px-2 font-head text-[10px] uppercase tracking-wide text-violet-900 dark:bg-violet-950 dark:text-violet-100">
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
                    className={cn(TOOLBAR_BTN, "w-8 px-0")}
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="size-3.5" />
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

      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5",
              saveStatus === "saved"
                ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
                : "border-border bg-muted/40",
            )}
          >
            {saveStatus === "saved" ? (
              <Check className="size-2.5" />
            ) : (
              <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
            )}
            {saveStatusLabel(saveStatus)}
          </span>
          <span className="shrink-0 text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <span className="shrink-0">{wordCount} words</span>
          <span className="shrink-0 text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <span className="min-w-0 truncate">
            {formatRelativeTime(lastEdited)}
          </span>
        </div>

        {canEdit ? (
          <>
            <span
              className="hidden h-4 w-px shrink-0 bg-border sm:block"
              aria-hidden
            />
            <SpeakToNote
              compact
              onTranscript={onTranscript}
              onStart={onSttStart}
              onLanguageChange={onSpeechLanguageChange}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
