"use client";

import { Folder, Lock } from "lucide-react";
import { COLOR_META } from "@/lib/kanban/colors";
import { formatRelativeTime } from "@/lib/notes/date-utils";
import type { SpaceListItem } from "@/lib/pages/types";
import { Avatar } from "@/components/retroui/Avatar";
import { Badge } from "@/components/retroui/Badge";
import { Card } from "@/components/retroui/Card";
import { SpaceActionsMenu } from "@/components/pages/space-actions-menu";
import { cn } from "@/lib/utils";

type SpaceCardProps = {
  space: SpaceListItem;
  view: "grid" | "list";
  onOpen: () => void;
  onToggleFavorite: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

export function SpaceCard({
  space,
  view,
  onOpen,
  onToggleFavorite,
  onRename,
  onDuplicate,
  onArchive,
  onDelete,
}: SpaceCardProps) {
  const meta = COLOR_META[space.color];
  const canEdit = space.role === "owner" || space.role === "editor";
  const itemSummary =
    space.fileCount > 0
      ? `${space.pageCount} ${space.pageCount === 1 ? "Page" : "Pages"} · ${space.fileCount} ${space.fileCount === 1 ? "File" : "Files"}`
      : `${space.pageCount} ${space.pageCount === 1 ? "Page" : "Pages"}`;

  const icon = (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded border-2 border-border shadow-sm",
        view === "list" ? "size-12" : "size-11",
        meta.bgClass,
      )}
    >
      {space.isVault ? (
        <Lock className={cn("size-5", meta.textClass)} />
      ) : (
        <Folder className={cn("size-5", meta.textClass)} />
      )}
    </span>
  );

  const actions = (
    <SpaceCardActions
      isFavorite={space.isFavorite}
      canEdit={canEdit}
      onToggleFavorite={(e) => {
        e.stopPropagation();
        onToggleFavorite();
      }}
      onRename={onRename}
      onDuplicate={onDuplicate}
      onArchive={onArchive}
      onDelete={onDelete}
    />
  );

  if (view === "list") {
    return (
      <Card
        className="flex cursor-pointer items-center gap-4 border-2 border-border p-4 shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg"
        onClick={onOpen}
      >
        {icon}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-head text-sm">{space.name}</h3>
            {space.isVault ? (
              <Badge variant="outline" size="sm" className="border-2">
                Secure Vault
              </Badge>
            ) : null}
          </div>
          {space.description ? (
            <p className="mt-1 truncate font-sans text-xs text-muted-foreground">
              {space.description}
            </p>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            <Avatar className="size-6 border-border">
              <Avatar.Fallback className="text-[9px]">
                {space.ownerInitials}
              </Avatar.Fallback>
            </Avatar>
            <p className="font-sans text-[10px] text-muted-foreground">
              {itemSummary} · Updated {formatRelativeTime(space.updatedAt)}
            </p>
          </div>
        </div>
        {actions}
      </Card>
    );
  }

  return (
    <Card
      className="flex cursor-pointer flex-col border-2 border-border p-4 shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg"
      onClick={onOpen}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        {icon}
        {actions}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-head text-sm">{space.name}</h3>
        {space.isVault ? (
          <Badge variant="outline" size="sm" className="border-2">
            Secure Vault
          </Badge>
        ) : null}
      </div>
      {space.description ? (
        <p className="mt-2 line-clamp-2 font-sans text-xs text-muted-foreground">
          {space.description}
        </p>
      ) : null}
      <div className="mt-auto flex items-center gap-2 pt-4">
        <Avatar className="size-6 border-border">
          <Avatar.Fallback className="text-[9px]">
            {space.ownerInitials}
          </Avatar.Fallback>
        </Avatar>
        <p className="font-sans text-[10px] text-muted-foreground">
          {itemSummary} · Updated {formatRelativeTime(space.updatedAt)}
        </p>
      </div>
    </Card>
  );
}

function SpaceCardActions({
  isFavorite,
  canEdit,
  onToggleFavorite,
  onRename,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  isFavorite: boolean;
  canEdit: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onRename: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
        onClick={onToggleFavorite}
        className={cn(
          "rounded border-2 border-border px-1.5 py-0.5 text-xs shadow-sm",
          isFavorite ? "bg-primary text-primary-foreground" : "bg-background",
        )}
      >
        ★
      </button>
      <SpaceActionsMenu
        canEdit={canEdit}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onArchive={onArchive}
        onDelete={onDelete}
      />
    </div>
  );
}
