"use client";

import { PenTool, Pin, Users } from "lucide-react";
import { COLOR_META } from "@/lib/kanban/colors";
import { formatRelativeTime } from "@/lib/notes/date-utils";
import type { WhiteboardListItem } from "@/lib/whiteboard/types";
import { cn } from "@/lib/utils";

type WhiteboardListItemRowProps = {
  whiteboard: WhiteboardListItem;
  active: boolean;
  onSelect: () => void;
};

export function WhiteboardListItemRow({
  whiteboard,
  active,
  onSelect,
}: WhiteboardListItemRowProps) {
  const meta = COLOR_META[whiteboard.color];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-2 rounded border-2 p-2 text-left font-sans text-sm transition-transform",
        active
          ? "border-border bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded border-2 border-border shadow-sm",
          meta.bgClass,
          active && "border-primary-foreground/30",
        )}
        aria-hidden
      >
        <PenTool
          className={cn(
            "size-4",
            active ? "text-primary-foreground" : meta.textClass,
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{whiteboard.title}</span>
        <span
          className={cn(
            "mt-0.5 block font-sans text-[10px]",
            active ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          Edited {formatRelativeTime(whiteboard.updatedAt)}
        </span>
      </span>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {whiteboard.pinned ? (
          <Pin
            className={cn(
              "size-3",
              active ? "text-primary-foreground" : "text-amber-600",
            )}
            aria-label="Pinned"
          />
        ) : null}
        {whiteboard.role !== "owner" ? (
          <Users
            className="size-3.5 text-violet-600 dark:text-violet-400"
            aria-label="Shared whiteboard"
          />
        ) : null}
      </div>
    </button>
  );
}
