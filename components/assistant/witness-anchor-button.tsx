"use client";

import { useState } from "react";
import { Anchor } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { WitnessBadge } from "@/components/assistant/witness-badge";
import { updateWitnessAttestationTxHash } from "@/lib/assistant/actions";
import { useWitnessAnchor } from "@/lib/assistant/witness/use-witness-anchor";
import { useFreighter } from "@/hooks/use-freighter";
import { toast } from "sonner";

type WitnessAnchorButtonProps = {
  witnessGroupId: number;
  commitment: string;
  nullifier: string;
  actionHash: string;
  mode?: "witness" | "delegate";
};

export function WitnessAnchorButton({
  witnessGroupId,
  commitment,
  nullifier,
  actionHash,
  mode = "witness",
}: WitnessAnchorButtonProps) {
  const { connected, connect } = useFreighter();
  const { anchor } = useWitnessAnchor();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleAnchor() {
    if (!connected) {
      await connect();
      return;
    }

    setPending(true);
    try {
      const result = await anchor({
        witnessGroupId,
        commitmentHex: commitment,
        nullifierHex: nullifier,
        actionHash,
        mode,
      });

      if (!result.anchored) {
        toast.message("Contract not configured — attestation saved off-chain only");
        return;
      }

      if (result.txHash) {
        setTxHash(result.txHash);
        await updateWitnessAttestationTxHash(nullifier, result.txHash);
        toast.success("Witness action anchored on Stellar testnet");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to anchor on-chain");
    } finally {
      setPending(false);
    }
  }

  if (txHash) {
    return <WitnessBadge txHash={txHash} />;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => void handleAnchor()}
      className="mt-2"
    >
      <Anchor className="mr-1 size-3" aria-hidden />
      {connected ? "Anchor on Stellar" : "Connect Freighter to anchor"}
    </Button>
  );
}
