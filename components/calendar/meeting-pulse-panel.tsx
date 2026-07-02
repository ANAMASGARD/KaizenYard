"use client";

import { useEffect, useState } from "react";
import { Copy, Link2 } from "lucide-react";
import {
  castPulseVote,
  closePulse,
  createMeetingPulse,
  getPulseForItem,
} from "@/lib/calendar/pulse-actions";
import type { MeetingPulseRecord, PulseVoteType } from "@/lib/calendar/types";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { toast } from "sonner";

type MeetingPulsePanelProps = {
  calendarItemId: number;
  hasRecurrence: boolean;
};

export function MeetingPulsePanel({
  calendarItemId,
  hasRecurrence,
}: MeetingPulsePanelProps) {
  const [pulse, setPulse] = useState<MeetingPulseRecord | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (hasRecurrence) {
      void getPulseForItem(calendarItemId).then((p) => {
        if (p?.pulseType !== "retro") {
          setPulse(p);
        }
      });
    }
  }, [calendarItemId, hasRecurrence]);

  if (!hasRecurrence) return null;

  async function handleCreate() {
    setPending(true);
    try {
      const created = await createMeetingPulse(calendarItemId);
      setPulse(created);
      toast.success("Anonymous pulse created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create pulse");
    } finally {
      setPending(false);
    }
  }

  async function handleVote(vote: PulseVoteType) {
    if (!pulse) return;
    setPending(true);
    try {
      const updated = await castPulseVote(pulse.shareToken, vote);
      setPulse(updated);
    } finally {
      setPending(false);
    }
  }

  async function handleClose() {
    if (!pulse) return;
    setPending(true);
    try {
      await closePulse(pulse.id);
      setPulse({ ...pulse, isOpen: false });
    } finally {
      setPending(false);
    }
  }

  const shareUrl =
    typeof window !== "undefined" && pulse
      ? `${window.location.origin}/calendar/pulse/${pulse.shareToken}`
      : "";

  return (
    <div className="space-y-2 rounded border-2 border-border bg-muted/30 p-3">
      <p className="font-head text-xs uppercase tracking-wide">Anonymous meeting pulse</p>
      <p className="font-sans text-[11px] text-muted-foreground">
        Let teammates vote anonymously on whether this recurring meeting is still worth keeping.
      </p>

      {!pulse ? (
        <Button type="button" size="sm" disabled={pending} onClick={handleCreate}>
          Create anonymous pulse
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="font-sans text-sm font-medium">{pulse.question}</p>
          {pulse.tally.total > 0 && (
            <div className="flex gap-2 font-sans text-xs">
              <span className="text-emerald-700">Keep: {pulse.tally.keep}</span>
              <span className="text-red-700">Drop: {pulse.tally.drop}</span>
              <span className="text-muted-foreground">Unsure: {pulse.tally.unsure}</span>
            </div>
          )}
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
          {pulse.isOpen && (
            <div className="flex flex-wrap gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => handleVote("keep")}
              >
                Keep
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => handleVote("drop")}
              >
                Drop
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => handleVote("unsure")}
              >
                Unsure
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={handleClose}
              >
                Close pulse
              </Button>
            </div>
          )}
          {!pulse.isOpen && (
            <p className="flex items-center gap-1 font-sans text-xs text-muted-foreground">
              <Link2 className="size-3" /> Pulse closed
            </p>
          )}
        </div>
      )}
    </div>
  );
}
