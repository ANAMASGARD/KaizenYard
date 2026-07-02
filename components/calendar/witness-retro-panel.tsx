"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { createRetroMeetingPulse } from "@/lib/calendar/pulse-actions";
import { countWitnessAttestations } from "@/lib/witness/attestations";
import Link from "next/link";
import { WitnessBadge } from "@/components/assistant/witness-badge";
import { toast } from "sonner";

type CalendarWitnessRetroPanelProps = {
  calendarItemId: number;
  witnessGroupId?: number | null;
};

export function CalendarWitnessRetroPanel({
  calendarItemId,
  witnessGroupId,
}: CalendarWitnessRetroPanelProps) {
  const [attestationCount, setAttestationCount] = useState(0);
  const [pending, setPending] = useState(false);
  const [sharePath, setSharePath] = useState<string | null>(null);

  useEffect(() => {
    if (!witnessGroupId) return;
    void countWitnessAttestations(witnessGroupId).then(setAttestationCount);
  }, [witnessGroupId]);

  async function handleStartRetro() {
    setPending(true);
    try {
      const pulse = await createRetroMeetingPulse(calendarItemId);
      setSharePath(pulse.sharePath ?? null);
      toast.success("Witness retro pulse created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create retro");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="border-2 border-border p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-violet-600" aria-hidden />
          <p className="font-head text-sm">Witness Retro</p>
        </div>
        <WitnessBadge />
      </div>
      <p className="font-sans text-sm text-muted-foreground">
        Verified anonymous meeting feedback via Kaizen Witness — managers see themes, not names.
      </p>
      {witnessGroupId ? (
        <p className="mt-2 font-sans text-xs">
          {attestationCount} verified anonymous action(s) recorded
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={pending}
          onClick={() => void handleStartRetro()}
        >
          Start witness retro
        </Button>
        <Link
          href={
            witnessGroupId
              ? `/assistant?witness=${witnessGroupId}&mode=witness`
              : "/assistant?mode=witness"
          }
          className="inline-flex items-center justify-center border-2 border-border bg-background px-3 py-1.5 font-head text-[10px] uppercase tracking-wider shadow-sm hover:bg-muted"
        >
          Open Witness Agent
        </Link>
      </div>
      {sharePath ? (
        <p className="mt-3 break-all font-mono text-[10px] text-muted-foreground">
          Share: {sharePath}
        </p>
      ) : null}
    </Card>
  );
}
