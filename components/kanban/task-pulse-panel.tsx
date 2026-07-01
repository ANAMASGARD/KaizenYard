"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Copy, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  closeTaskPulse,
  createTaskPulse,
  getTaskPulseForTask,
} from "@/lib/kanban/pulse-actions";
import type { TaskPulseRecord, TaskPulseVoteType } from "@/lib/kanban/pulse-types";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { cn } from "@/lib/utils";

type TaskPulsePanelProps = {
  taskId: number;
};

export function TaskPulsePanel({ taskId }: TaskPulsePanelProps) {
  const [pulse, setPulse] = useState<TaskPulseRecord | null>(null);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void getTaskPulseForTask(taskId).then(setPulse);
  }, [taskId]);

  async function handleCreate() {
    setPending(true);
    try {
      const created = await createTaskPulse(
        taskId,
        question.trim() || undefined,
      );
      setPulse(created);
      toast.success("Anonymous check-in started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start check-in");
    } finally {
      setPending(false);
    }
  }

  async function handleClose() {
    if (!pulse) return;
    setPending(true);
    try {
      await closeTaskPulse(pulse.id);
      setPulse({ ...pulse, isOpen: false });
      toast.success("Check-in closed");
    } finally {
      setPending(false);
    }
  }

  const shareUrl =
    typeof window !== "undefined" && pulse
      ? `${window.location.origin}/tasks/pulse/${pulse.shareToken}`
      : "";

  return (
    <div className="space-y-3 rounded border-2 border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
        <p className="font-head text-xs uppercase tracking-[0.2em]">
          Anonymous risk check-in
        </p>
      </div>
      <p className="font-sans text-[11px] text-muted-foreground">
        Share a link so teammates can flag risk or blockers anonymously — no one
        sees who voted.
      </p>

      {!pulse ? (
        <div className="space-y-2">
          <Textarea
            value={question}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setQuestion(e.target.value)
            }
            placeholder="Optional custom question…"
            rows={2}
            className="text-sm"
          />
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => void handleCreate()}
          >
            Start anonymous check-in
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-sans text-sm font-medium">{pulse.question}</p>

          <div className="grid grid-cols-3 gap-2 font-sans text-xs">
            <div className="rounded border-2 border-border bg-emerald-100 px-2 py-1.5 text-center dark:bg-emerald-950">
              <p className="font-head text-base">{pulse.tally.onTrack}</p>
              <p className="text-emerald-900 dark:text-emerald-100">On track</p>
            </div>
            <div className="rounded border-2 border-border bg-amber-100 px-2 py-1.5 text-center dark:bg-amber-950">
              <p className="font-head text-base">{pulse.tally.atRisk}</p>
              <p className="text-amber-900 dark:text-amber-100">At risk</p>
            </div>
            <div className="rounded border-2 border-border bg-red-100 px-2 py-1.5 text-center dark:bg-red-950">
              <p className="font-head text-base">{pulse.tally.blocked}</p>
              <p className="text-red-900 dark:text-red-100">Blocked</p>
            </div>
          </div>

          {pulse.notes.length > 0 ? (
            <div className="space-y-1.5">
              <p className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Anonymous notes
              </p>
              {pulse.notes.map((entry, index) => (
                <div
                  key={`${entry.vote}-${index}`}
                  className="rounded border border-border bg-background px-2 py-1.5 font-sans text-xs"
                >
                  <span
                    className={cn(
                      "mr-2 font-head uppercase",
                      entry.vote === "on_track" && "text-emerald-700",
                      entry.vote === "at_risk" && "text-amber-700",
                      entry.vote === "blocked" && "text-red-700",
                    )}
                  >
                    {entry.vote.replace("_", " ")}
                  </span>
                  {entry.note}
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex gap-1">
            <Input readOnly value={shareUrl} className="text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
                toast.success("Link copied");
              }}
              aria-label="Copy link"
            >
              <Copy className="size-4" />
            </Button>
          </div>

          {pulse.isOpen ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => void handleClose()}
            >
              Close check-in
            </Button>
          ) : (
            <p className="font-sans text-xs text-muted-foreground">
              Check-in closed — start a new one after refreshing.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function voteLabel(vote: TaskPulseVoteType): string {
  switch (vote) {
    case "on_track":
      return "On track";
    case "at_risk":
      return "At risk";
    case "blocked":
      return "Blocked";
    default: {
      const _exhaustive: never = vote;
      return _exhaustive;
    }
  }
}
