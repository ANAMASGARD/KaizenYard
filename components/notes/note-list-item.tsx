"use client";

import { FileText, Pin, Users } from "lucide-react";
import { COLOR_META } from "@/lib/kanban/colors";
import { formatRelativeTime } from "@/lib/notes/date-utils";
import type { NoteListItem } from "@/lib/notes/types";
import { cn } from "@/lib/utils";

type NoteListItemRowProps = {
  note: NoteListItem;
  active: boolean;
  onSelect: () => void;
};

export function NoteListItemRow({ note, active, onSelect }: NoteListItemRowProps) {
  const meta = COLOR_META[note.color];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-2 rounded border-2 px-2 py-1.5 text-left font-sans text-sm transition-transform",
        active
          ? "border-border bg-primary text-primary-foreground shadow-sm"
          : "border-transparent hover:border-border hover:bg-muted/50",
      )}
    >
      <FileText
        className={cn(
          "size-3.5 shrink-0",
          active ? "text-primary-foreground" : "text-muted-foreground",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "size-2.5 shrink-0 rounded-full border border-border",
          meta.dotClass,
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{note.title}</span>
      {note.pinned ? (
        <Pin
          className={cn(
            "size-3 shrink-0",
            active ? "text-primary-foreground" : "text-amber-600",
          )}
          aria-label="Pinned"
        />
      ) : null}
      {note.role !== "owner" ? (
        <Users
          className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400"
          aria-label="Shared note"
        />
      ) : null}
      <span
        className={cn(
          "shrink-0 font-sans text-[10px]",
          active ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {formatRelativeTime(note.updatedAt)}
      </span>
    </button>
  );
}
