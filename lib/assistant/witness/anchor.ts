import { createHash } from "node:crypto";
import { getAgentWitnessVerifierContractId } from "@/lib/stellar/config";
import { buildVerifyWitnessActionTx } from "@/lib/assistant/witness/contract";

export function actionHashToBytes32(actionHash: string): string {
  if (actionHash.length === 64 && /^[0-9a-f]+$/i.test(actionHash)) {
    return actionHash.padStart(64, "0").slice(-64);
  }
  const hash = createHash("sha256").update(actionHash).digest("hex");
  return hash.slice(0, 64);
}

export function isWitnessContractConfigured(): boolean {
  return Boolean(getAgentWitnessVerifierContractId());
}

export async function buildWitnessAnchorTx(input: {
  sourceAddress: string;
  groupId: number;
  commitmentHex: string;
  nullifierHex: string;
  actionHash: string;
  mode: "witness" | "delegate";
}): Promise<string | null> {
  if (!isWitnessContractConfigured()) {
    return null;
  }

  return buildVerifyWitnessActionTx(
    input.sourceAddress,
    input.groupId,
    input.commitmentHex.padStart(64, "0").slice(-64),
    input.nullifierHex.padStart(64, "0").slice(-64),
    actionHashToBytes32(input.actionHash),
    input.mode,
  );
}
