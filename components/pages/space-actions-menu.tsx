"use client";

import { MoreHorizontal } from "lucide-react";
import { Menu } from "@/components/retroui/Menu";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type SpaceActionsMenuProps = {
  canEdit: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  className?: string;
};

export function SpaceActionsMenu({
  canEdit,
  onRename,
  onDuplicate,
  onArchive,
  onDelete,
  className,
}: SpaceActionsMenuProps) {
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
            aria-label="Space actions"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        }
      />
      <Menu.Content align="end">
        <Menu.Item onClick={onRename}>Rename</Menu.Item>
        <Menu.Item onClick={onDuplicate}>Duplicate</Menu.Item>
        <Menu.Item onClick={onArchive}>Archive</Menu.Item>
        <Menu.Item onClick={onDelete} className="text-destructive">
          Delete
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}
