"use client";

import { MoreHorizontal, Plus } from "lucide-react";
import { deleteBoard } from "@/lib/kanban/actions";
import { COLOR_META } from "@/lib/kanban/colors";
import type { BoardRecord } from "@/lib/kanban/types";
import { Button } from "@/components/retroui/Button";
import { ContextMenu } from "@/components/retroui/ContextMenu";
import { cn } from "@/lib/utils";

type BoardSidebarProps = {
  boards: BoardRecord[];
  activeBoardId: number | null;
  onSelectBoard: (boardId: number) => void;
  onNewBoard: () => void;
  onEditBoard: (board: BoardRecord) => void;
  onBoardDeleted: (boardId: number) => void;
  className?: string;
};

export function BoardSidebar({
  boards,
  activeBoardId,
  onSelectBoard,
  onNewBoard,
  onEditBoard,
  onBoardDeleted,
  className,
}: BoardSidebarProps) {
  async function handleDelete(board: BoardRecord) {
    if (!confirm(`Delete "${board.name}" and all its tasks?`)) return;
    try {
      await deleteBoard(board.id);
      onBoardDeleted(board.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete board");
    }
  }

  return (
    <aside
      className={cn(
        "flex w-56 shrink-0 flex-col gap-3 border-2 border-border rounded bg-background p-3 shadow-md lg:w-60",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          My boards
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onNewBoard}
        >
          <Plus className="size-3.5" />
          New
        </Button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {boards.length === 0 ? (
          <p className="px-2 py-4 font-sans text-xs text-muted-foreground">
            No boards yet. Create one to get started.
          </p>
        ) : (
          boards.map((board) => {
            const active = board.id === activeBoardId;
            const meta = COLOR_META[board.color];
            return (
              <ContextMenu key={board.id}>
                <ContextMenu.Trigger
                  render={
                    <button
                      type="button"
                      onClick={() => onSelectBoard(board.id)}
                      className={cn(
                        "group flex w-full items-center gap-2 rounded border-2 px-2 py-1.5 text-left font-sans text-sm transition-transform",
                        active
                          ? "border-border bg-primary text-primary-foreground shadow-sm"
                          : "border-transparent hover:border-border hover:bg-muted/50",
                      )}
                    >
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full border border-border",
                          meta.dotClass,
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate">{board.name}</span>
                      <MoreHorizontal
                        className={cn(
                          "size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-60",
                          active && "opacity-60",
                        )}
                        aria-hidden
                      />
                    </button>
                  }
                />
                <ContextMenu.Content>
                  <ContextMenu.Item onClick={() => onEditBoard(board)}>
                    Rename / change color
                  </ContextMenu.Item>
                  <ContextMenu.Separator />
                  <ContextMenu.Item
                    className="text-red-600 dark:text-red-400"
                    onClick={() => void handleDelete(board)}
                  >
                    Delete board
                  </ContextMenu.Item>
                </ContextMenu.Content>
              </ContextMenu>
            );
          })
        )}
      </nav>
    </aside>
  );
}
