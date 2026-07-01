"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useParams } from "next/navigation";
import {
  castTaskPulseVote,
  getTaskPulseByToken,
} from "@/lib/kanban/pulse-actions";
import type { TaskPulseRecord, TaskPulseVoteType } from "@/lib/kanban/pulse-types";
import { voteLabel } from "@/components/kanban/task-pulse-panel";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Textarea } from "@/components/retroui/Textarea";
import { cn } from "@/lib/utils";

export default function TaskPulseVotePage() {
  const params = useParams<{ token: string }>();
  const [pulse, setPulse] = useState<TaskPulseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    void getTaskPulseByToken(params.token)
      .then(setPulse)
      .catch(() => setError("Check-in not found"))
      .finally(() => setLoading(false));
  }, [params.token]);

  async function vote(v: TaskPulseVoteType) {
    setPending(true);
    try {
      const updated = await castTaskPulseVote(params.token, v, note);
      setPulse(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <p className="font-head text-sm text-muted-foreground">Loading check-in…</p>
    );
  }

  if (error || !pulse) {
    return (
      <p className="font-sans text-sm text-destructive">
        {error ?? "Check-in not found"}
      </p>
    );
  }

  return (
    <Card className="mx-auto max-w-md border-2 border-border p-6 shadow-md">
      <h1 className="font-head text-xl font-semibold">Anonymous task check-in</h1>
      <p className="mt-2 font-sans text-sm text-muted-foreground">
        Your vote is anonymous and cannot be traced back to you.
      </p>
      <p className="mt-1 font-head text-sm text-muted-foreground">
        Task: {pulse.taskTitle}
      </p>
      <p className="mt-4 font-head text-base">{pulse.question}</p>

      {pulse.hasVoted || !pulse.isOpen ? (
        <div className="mt-6 space-y-2 font-sans text-sm">
          <p className="font-semibold">Results</p>
          <p className="text-emerald-700 dark:text-emerald-300">
            On track: {pulse.tally.onTrack}
          </p>
          <p className="text-amber-700 dark:text-amber-300">
            At risk: {pulse.tally.atRisk}
          </p>
          <p className="text-red-700 dark:text-red-300">
            Blocked: {pulse.tally.blocked}
          </p>
          {pulse.notes.length > 0 ? (
            <div className="mt-3 space-y-1">
              {pulse.notes.map((entry, index) => (
                <p
                  key={`${entry.vote}-${index}`}
                  className="rounded border border-border bg-muted/30 px-2 py-1 text-xs"
                >
                  <span className="font-head uppercase">{voteLabel(entry.vote)}:</span>{" "}
                  {entry.note}
                </p>
              ))}
            </div>
          ) : null}
          {pulse.hasVoted ? (
            <p className="text-xs text-muted-foreground">Thanks for voting.</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <Textarea
            value={note}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
            placeholder="Optional anonymous note (blockers, context)…"
            rows={3}
            className="text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={pending}
              onClick={() => void vote("on_track")}
            >
              On track
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className={cn("border-amber-600 text-amber-800 dark:text-amber-200")}
              onClick={() => void vote("at_risk")}
            >
              At risk
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className={cn("border-red-600 text-red-800 dark:text-red-200")}
              onClick={() => void vote("blocked")}
            >
              Blocked
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
