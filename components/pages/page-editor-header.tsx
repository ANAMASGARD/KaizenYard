"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink, Star } from "lucide-react";
import type { SaveStatus } from "@/lib/pages/use-page-autosave";
import type { SpaceRole } from "@/lib/pages/room";
import { txExplorerUrl } from "@/lib/stellar/config";
import { getVaultSession } from "@/lib/vault/session";
import { formatRelativeTime } from "@/lib/notes/date-utils";
import { ActiveCollaborators } from "@/components/kanban/active-collaborators";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { cn } from "@/lib/utils";

const TOOLBAR_BTN =
  "h-8 border-2 border-border px-2 font-sans text-xs shadow-sm";

type PageEditorHeaderProps = {
  spaceId: number;
  spaceName: string;
  isVault: boolean;
  title: string;
  isFavorite: boolean;
  pageRole: SpaceRole;
  saveStatus: SaveStatus;
  wordCount: number;
  lastEdited: string;
  onTitleChange: (title: string) => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function PageEditorHeader({
  spaceId,
  spaceName,
  isVault,
  title,
  isFavorite,
  pageRole,
  saveStatus,
  wordCount,
  lastEdited,
  onTitleChange,
  onToggleFavorite,
  onShare,
  onDuplicate,
  onDelete,
}: PageEditorHeaderProps) {
  const vaultSession = isVault ? getVaultSession(spaceId) : null;
  const readOnly = pageRole === "viewer";

  return (
    <header className="shrink-0 border-b-2 border-border bg-background px-4 py-3 sm:px-6">
      <nav className="mb-2 flex items-center gap-1 font-sans text-xs text-muted-foreground">
        <Link href="/pages" className="hover:text-foreground">
          All Spaces
        </Link>
        <ChevronRight className="size-3" />
        <Link href={`/pages/space/${spaceId}`} className="hover:text-foreground">
          {spaceName}
        </Link>
        <ChevronRight className="size-3" />
        <span className="truncate text-foreground">{title || "Untitled"}</span>
      </nav>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          readOnly={readOnly}
          className="max-w-xl font-head text-lg"
          placeholder="Untitled"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ActiveCollaborators compact />
          {vaultSession?.txHash ? (
            <a
              href={txExplorerUrl(vaultSession.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(TOOLBAR_BTN, "inline-flex items-center gap-1 bg-primary/20")}
            >
              Verified on Stellar
              <ExternalLink className="size-3" />
            </a>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={TOOLBAR_BTN}
            onClick={onToggleFavorite}
            disabled={readOnly}
          >
            <Star className={cn("size-3.5", isFavorite && "fill-primary text-primary")} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={TOOLBAR_BTN}
            onClick={onShare}
          >
            Share
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={TOOLBAR_BTN}
            onClick={onDuplicate}
          >
            Duplicate
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={TOOLBAR_BTN}
            onClick={onDelete}
            disabled={readOnly}
          >
            Delete
          </Button>
        </div>
      </div>

      <p className="mt-2 font-sans text-[10px] text-muted-foreground">
        {saveStatus === "saving"
          ? "Saving…"
          : saveStatus === "unsaved"
            ? "Unsaved changes"
            : saveStatus === "error"
              ? "Save failed"
              : "Saved"}{" "}
        · {wordCount} words · Edited {formatRelativeTime(lastEdited)}
      </p>
    </header>
  );
}
