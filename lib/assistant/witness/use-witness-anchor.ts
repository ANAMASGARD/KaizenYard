"use client";

import { useFreighter } from "@/hooks/use-freighter";
import { submitSignedTx } from "@/lib/stellar/contract";

export async function anchorWitnessActionOnChain(input: {
  sourceAddress: string;
  witnessGroupId: number;
  commitmentHex: string;
  nullifierHex: string;
  actionHash: string;
  mode?: "witness" | "delegate";
  signTransaction: (xdr: string) => Promise<string>;
}): Promise<{ txHash?: string; anchored: boolean }> {
  const res = await fetch("/api/assistant/witness/build-anchor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceAddress: input.sourceAddress,
      witnessGroupId: input.witnessGroupId,
      commitmentHex: input.commitmentHex,
      nullifierHex: input.nullifierHex,
      actionHash: input.actionHash,
      mode: input.mode ?? "witness",
    }),
  });

  const data = (await res.json()) as {
    configured?: boolean;
    xdr?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to build anchor transaction");
  }

  if (!data.configured || !data.xdr) {
    return { anchored: false };
  }

  const signed = await input.signTransaction(data.xdr);
  const { hash } = await submitSignedTx(signed);
  return { txHash: hash, anchored: true };
}

export function useWitnessAnchor() {
  const { address, sign, connected } = useFreighter();

  return {
    connected,
    address,
    anchor: async (
      input: Omit<Parameters<typeof anchorWitnessActionOnChain>[0], "signTransaction" | "sourceAddress">,
    ) => {
      if (!connected || !address) {
        throw new Error("Connect Freighter to anchor on-chain");
      }
      return anchorWitnessActionOnChain({
        ...input,
        sourceAddress: address,
        signTransaction: sign,
      });
    },
  };
}
