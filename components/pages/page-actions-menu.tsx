"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { SpaceListItem } from "@/lib/pages/types";
import { Menu } from "@/components/retroui/Menu";
import { Button } from "@/components/retroui/Button";
import { Select } from "@/components/retroui/Select";
import { cn } from "@/lib/utils";

type PageActionsMenuProps = {
  canEdit: boolean;
  spaces: SpaceListItem[];
  currentSpaceId: number;
  onRename: () => void;
  onMove: (targetSpaceId: number) => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onExport: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isFavorite?: boolean;
  className?: string;
};

export function PageActionsMenu({
  canEdit,
  spaces,
  currentSpaceId,
  onRename,
  onMove,
  onDuplicate,
  onToggleFavorite,
  onShare,
  onExport,
  onArchive,
  onDelete,
  isFavorite = false,
  className,
}: PageActionsMenuProps) {
  const [moveOpen, setMoveOpen] = useState(false);
  const moveTargets = spaces.filter((space) => space.id !== currentSpaceId);

  if (!canEdit) return null;

  return (
    <Menu>
      <Menu.Trigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-8 w-8 px-0", className)}
            aria-label="Page actions"
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        }
      />
      <Menu.Content align="end" className="min-w-44">
        <Menu.Item onClick={onRename}>Rename</Menu.Item>
        <Menu.Item
          onClick={() => {
            setMoveOpen((open) => !open);
          }}
        >
          Move
        </Menu.Item>
        {moveOpen && moveTargets.length > 0 ? (
          <div
            className="border-t border-border px-2 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Select
              value={String(currentSpaceId)}
              onValueChange={(value) => {
                onMove(Number(value));
                setMoveOpen(false);
              }}
            >
              <Select.Trigger className="h-8 min-w-full text-xs">
                <Select.Value placeholder="Choose space" />
              </Select.Trigger>
              <Select.Content>
                {moveTargets.map((space) => (
                  <Select.Item key={space.id} value={String(space.id)}>
                    {space.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        ) : null}
        <Menu.Item onClick={onDuplicate}>Duplicate</Menu.Item>
        <Menu.Item onClick={onToggleFavorite}>
          {isFavorite ? "Unfavorite" : "Favorite"}
        </Menu.Item>
        <Menu.Item onClick={onShare}>Share</Menu.Item>
        <Menu.Item onClick={onExport}>Export</Menu.Item>
        <Menu.Item onClick={onArchive}>Archive</Menu.Item>
        <Menu.Item onClick={onDelete} className="text-destructive">
          Delete
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}

type FileActionsMenuProps = {
  canEdit: boolean;
  spaces: SpaceListItem[];
  currentSpaceId: number;
  onRename: () => void;
  onMove: (targetSpaceId: number) => void;
  onDownload: () => void;
  onToggleFavorite: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isFavorite?: boolean;
  className?: string;
};

export function FileActionsMenu({
  canEdit,
  spaces,
  currentSpaceId,
  onRename,
  onMove,
  onDownload,
  onToggleFavorite,
  onArchive,
  onDelete,
  isFavorite = false,
  className,
}: FileActionsMenuProps) {
  const [moveOpen, setMoveOpen] = useState(false);
  const moveTargets = spaces.filter((space) => space.id !== currentSpaceId);

  if (!canEdit) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("h-8 px-2 text-xs", className)}
        onClick={onDownload}
      >
        Download
      </Button>
    );
  }

  return (
    <Menu>
      <Menu.Trigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-8 w-8 px-0", className)}
            aria-label="File actions"
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        }
      />
      <Menu.Content align="end" className="min-w-44">
        <Menu.Item onClick={onRename}>Rename</Menu.Item>
        <Menu.Item onClick={() => setMoveOpen((open) => !open)}>Move</Menu.Item>
        {moveOpen && moveTargets.length > 0 ? (
          <div
            className="border-t border-border px-2 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Select
              value={String(currentSpaceId)}
              onValueChange={(value) => {
                onMove(Number(value));
                setMoveOpen(false);
              }}
            >
              <Select.Trigger className="h-8 min-w-full text-xs">
                <Select.Value placeholder="Choose space" />
              </Select.Trigger>
              <Select.Content>
                {moveTargets.map((space) => (
                  <Select.Item key={space.id} value={String(space.id)}>
                    {space.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        ) : null}
        <Menu.Item onClick={onDownload}>Download</Menu.Item>
        <Menu.Item onClick={onToggleFavorite}>
          {isFavorite ? "Unfavorite" : "Favorite"}
        </Menu.Item>
        <Menu.Item onClick={onArchive}>Archive</Menu.Item>
        <Menu.Item onClick={onDelete} className="text-destructive">
          Delete
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}
