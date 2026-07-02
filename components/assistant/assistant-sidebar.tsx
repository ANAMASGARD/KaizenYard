"use client";

import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import type { AssistantSessionRecord } from "@/lib/assistant/types";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type AssistantSidebarProps = {
  sessions: AssistantSessionRecord[];
  activeSessionId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onRename: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  className?: string;
};

export function AssistantSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  className,
}: AssistantSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r-2 border-border bg-background",
        className,
      )}
    >
      <div className="border-b-2 border-border p-3">
        <Button type="button" variant="default" className="w-full" onClick={onNew}>
          <MessageSquarePlus className="mr-2 size-4" aria-hidden />
          New chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <p className="mb-2 px-2 font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Sessions
        </p>
        {sessions.length === 0 ? (
          <p className="px-2 font-sans text-xs text-muted-foreground">No chats yet</p>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <div
                  className={cn(
                    "group flex items-center gap-1 rounded border-2 border-transparent px-2 py-1.5",
                    activeSessionId === session.id && "border-border bg-primary shadow-sm",
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left font-sans text-sm"
                    onClick={() => onSelect(session.id)}
                  >
                    <span className="line-clamp-1">{session.title}</span>
                    <span className="block font-head text-[9px] uppercase tracking-wider text-muted-foreground">
                      {session.privacyMode}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100"
                    aria-label="Rename session"
                    onClick={() => {
                      const title = window.prompt("Rename chat", session.title);
                      if (title) onRename(session.id, title);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100"
                    aria-label="Delete session"
                    onClick={() => onDelete(session.id)}
                  >
                    <Trash2 className="size-3.5 text-red-600" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
