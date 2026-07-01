"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  castPulseVote,
  getPulseByToken,
} from "@/lib/calendar/pulse-actions";
import type { MeetingPulseRecord, PulseVoteType } from "@/lib/calendar/types";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";

export default function PulseVotePage() {
  const params = useParams<{ token: string }>();
  const [pulse, setPulse] = useState<MeetingPulseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getPulseByToken(params.token)
      .then(setPulse)
      .catch(() => setError("Pulse not found"))
      .finally(() => setLoading(false));
  }, [params.token]);

  async function vote(v: PulseVoteType) {
    setPending(true);
    try {
      const updated = await castPulseVote(params.token, v);
      setPulse(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <p className="font-head text-sm text-muted-foreground">Loading pulse…</p>
    );
  }

  if (error || !pulse) {
    return (
      <p className="font-sans text-sm text-destructive">
        {error ?? "Pulse not found"}
      </p>
    );
  }

  return (
    <Card className="mx-auto max-w-md border-2 border-border p-6 shadow-md">
      <h1 className="font-head text-xl font-semibold">Anonymous meeting pulse</h1>
      <p className="mt-2 font-sans text-sm text-muted-foreground">
        Your vote is anonymous and cannot be traced back to you.
      </p>
      <p className="mt-4 font-head text-base">{pulse.question}</p>

      {pulse.hasVoted || !pulse.isOpen ? (
        <div className="mt-6 space-y-2 font-sans text-sm">
          <p className="font-semibold">Results</p>
          <p className="text-emerald-700">Keep: {pulse.tally.keep}</p>
          <p className="text-red-700">Drop: {pulse.tally.drop}</p>
          <p className="text-muted-foreground">Unsure: {pulse.tally.unsure}</p>
          {pulse.hasVoted && (
            <p className="text-xs text-muted-foreground">Thanks for voting.</p>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={pending}
            onClick={() => vote("keep")}
          >
            Keep it
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => vote("drop")}
          >
            Drop it
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => vote("unsure")}
          >
            Not sure
          </Button>
        </div>
      )}
    </Card>
  );
}
