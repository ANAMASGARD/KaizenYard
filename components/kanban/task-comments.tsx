"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  useCreateComment,
  useCreateThread,
  useThreads,
  useUser,
} from "@liveblocks/react/suspense";
import { MessageSquare, Send } from "lucide-react";
import type { BoardRole } from "@/lib/kanban/room";
import { Avatar } from "@/components/retroui/Avatar";
import { Button } from "@/components/retroui/Button";
import { Textarea } from "@/components/retroui/Textarea";
import {
  bgClassForUserId,
  initialsForName,
} from "@/lib/liveblocks/user-color";
import {
  commentBodyToPlainText,
  formatCommentTime,
  textToCommentBody,
} from "@/lib/liveblocks/comment-utils";
import { cn } from "@/lib/utils";

type TaskCommentsProps = {
  taskId: number;
  boardRole: BoardRole;
};

function CommentAuthor({
  userId,
  fallbackName,
}: {
  userId: string;
  fallbackName?: string;
}) {
  const { user } = useUser(userId);
  const name = user?.name ?? fallbackName ?? "Collaborator";

  return (
    <div className="flex items-center gap-2">
      <Avatar
        className={cn("size-7 border-2 border-border", bgClassForUserId(userId))}
      >
        {user?.avatar ? (
          <Avatar.Image src={user.avatar} alt={name} />
        ) : null}
        <Avatar.Fallback className="font-head text-[9px]">
          {initialsForName(name)}
        </Avatar.Fallback>
      </Avatar>
      <span className="font-head text-xs">{name}</span>
    </div>
  );
}

export function TaskComments({ taskId, boardRole }: TaskCommentsProps) {
  const { threads } = useThreads({
    query: { metadata: { taskId } },
  });
  const createThread = useCreateThread();
  const createComment = useCreateComment();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readOnly = boardRole === "viewer";
  const thread = threads[0];

  const comments = useMemo(() => {
    if (!thread) return [];
    return [...thread.comments].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [thread]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || readOnly) return;

    setSending(true);
    setError(null);

    try {
      const body = textToCommentBody(text);
      if (thread) {
        createComment({
          threadId: thread.id,
          body,
        });
      } else {
        createThread({
          body,
          metadata: { taskId },
        });
      }
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3 rounded border-2 border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4 text-violet-600" />
        <p className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Comments
        </p>
        {comments.length > 0 ? (
          <span className="rounded border border-border px-1.5 py-0.5 font-sans text-[10px]">
            {comments.length}
          </span>
        ) : null}
      </div>

      {comments.length === 0 ? (
        <p className="font-sans text-sm text-muted-foreground">
          No comments yet. Start the conversation.
        </p>
      ) : (
        <ul className="max-h-48 space-y-3 overflow-y-auto">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded border border-border bg-background p-2 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <CommentAuthor userId={comment.userId} />
                <time className="font-sans text-[10px] text-muted-foreground">
                  {formatCommentTime(comment.createdAt)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap font-sans text-sm">
                {commentBodyToPlainText(comment.body)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {!readOnly ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setDraft(e.target.value)
            }
            placeholder="Write a comment…"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={sending || !draft.trim()}
            >
              <Send className="size-4" />
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="font-sans text-xs text-muted-foreground">
          Viewers can read comments but cannot post.
        </p>
      )}

      {error ? (
        <p className="font-sans text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
