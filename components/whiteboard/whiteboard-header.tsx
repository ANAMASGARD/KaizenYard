"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  Download,
  LayoutGrid,
  MoreHorizontal,
  Pin,
  Share2,
  Sparkles,
  Star,
  StickyNote,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { SaveStatus } from "@/lib/whiteboard/use-whiteboard-autosave";
import { getWhiteboardCapabilities } from "@/lib/whiteboard/permissions";
import type { WhiteboardRole } from "@/lib/whiteboard/room";
import { formatRelativeTime } from "@/lib/notes/date-utils";
import { ActiveCollaborators } from "@/components/kanban/active-collaborators";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Menu } from "@/components/retroui/Menu";
import { cn } from "@/lib/utils";

/** Uniform toolbar buttons — same height, no hover shift (prevents shadow overlap). */
const TOOLBAR_BTN =
  "h-8 shrink-0 gap-1.5 px-2.5 shadow-sm hover:translate-y-0 hover:shadow-sm active:translate-y-0 active:translate-x-0 active:shadow-sm";

type WhiteboardHeaderProps = {
  title: string;
  pinned: boolean;
  whiteboardRole: WhiteboardRole;
  saveStatus: SaveStatus;
  lastEdited: string;
  onTitleChange: (title: string) => void;
  onTogglePin: () => void;
  onShare: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAiDiagram: () => void;
  onExportPng: () => void;
  onAddSticky?: () => void;
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

export function WhiteboardHeader({
  title,
  pinned,
  whiteboardRole,
  saveStatus,
  lastEdited,
  onTitleChange,
  onTogglePin,
  onShare,
  onDuplicate,
  onDelete,
  onAiDiagram,
  onExportPng,
  onAddSticky,
}: WhiteboardHeaderProps) {
  const { canEdit, canShare, canManage } =
    getWhiteboardCapabilities(whiteboardRole);
  const readOnly = !canEdit;
  const [titleFocused, setTitleFocused] = useState(false);
  const showRenameHint =
    canEdit && !titleFocused && (title === "" || title === "Untitled");

  return (
    <div className="flex flex-col gap-1.5">
      {/* Main toolbar — grid keeps title + actions on one aligned row */}
      <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
        <nav
          className="flex shrink-0 items-center gap-1 self-center font-sans text-[10px] text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-0.5 hover:text-foreground"
            title="Home"
          >
            <LayoutGrid className="size-3" />
            <span className="hidden md:inline">Home</span>
          </Link>
          <ChevronRight className="size-2.5 shrink-0" />
          <span className="inline-flex items-center gap-0.5">
            <LayoutGrid className="size-3 shrink-0" />
            <span className="hidden sm:inline">Whiteboard</span>
          </span>
          <ChevronRight className="size-2.5 shrink-0" />
          {canEdit ? (
            <button
              type="button"
              onClick={onTogglePin}
              className={cn(
                "inline-flex size-6 shrink-0 items-center justify-center rounded transition-colors",
                pinned
                  ? "text-amber-600"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={pinned ? "Unpin whiteboard" : "Pin whiteboard"}
            >
              <Star className={cn("size-3", pinned && "fill-current")} />
            </button>
          ) : null}
        </nav>

        <div
          className={cn(
            "flex min-w-0 items-center justify-center",
            canEdit && "cursor-text",
          )}
          onClick={(event) => {
            if (!canEdit) return;
            const input = event.currentTarget.querySelector("input");
            input?.focus();
            input?.select();
          }}
        >
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            readOnly={readOnly}
            className={cn(
              "h-8 w-full max-w-md border-transparent px-2 text-center font-head text-lg leading-none shadow-none focus-visible:ring-0",
              canEdit && !titleFocused && "hover:underline decoration-dotted underline-offset-4",
            )}
            placeholder={showRenameHint ? "Untitled — click to rename" : "Untitled"}
            aria-label="Whiteboard title"
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 pr-10 lg:pr-12">
          {canEdit && onAddSticky ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={TOOLBAR_BTN}
              onClick={onAddSticky}
              title="Add sticky note"
            >
              <StickyNote className="size-3.5 shrink-0" />
              <span className="hidden lg:inline">Sticky</span>
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={TOOLBAR_BTN}
              onClick={onAiDiagram}
              title="AI Diagram"
            >
              <Sparkles className="size-3.5 shrink-0" />
              <span className="hidden lg:inline">AI</span>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(TOOLBAR_BTN, "hidden sm:inline-flex")}
            onClick={onExportPng}
            title="Export PNG"
          >
            <Download className="size-3.5 shrink-0" />
            <span className="hidden xl:inline">Export</span>
          </Button>
          {canShare ? (
            <Button
              type="button"
              size="sm"
              className={TOOLBAR_BTN}
              onClick={onShare}
              title="Share"
            >
              <Share2 className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          ) : null}
          {whiteboardRole !== "owner" ? (
            <span
              className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded border border-violet-600 bg-violet-50 px-2 font-head text-[9px] uppercase tracking-wide text-violet-900 dark:bg-violet-950 dark:text-violet-100"
              title="Shared whiteboard"
            >
              <Users className="size-2.5" />
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
                <Menu.Item onClick={onTogglePin}>
                  <Pin className="size-3.5" />
                  {pinned ? "Unpin" : "Pin"}
                </Menu.Item>
                <Menu.Item onClick={onDelete} className="text-red-600">
                  Delete
                </Menu.Item>
              </Menu.Content>
            </Menu>
          ) : null}
        </div>
      </div>

      {/* Status row — separate from title/actions */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[10px] text-muted-foreground">
        <span
          className={cn(
            "inline-flex h-6 items-center gap-1 rounded border px-1.5",
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
        <span className="inline-flex h-6 items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Auto-save on
        </span>
        <span className="inline-flex h-6 items-center">
          Last saved {formatRelativeTime(lastEdited)}
        </span>
        <ActiveCollaborators />
      </div>
    </div>
  );
}
