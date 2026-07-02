import {
  computeWitnessNullifier,
  computeWitnessSessionCommitment,
} from "@/lib/assistant/witness/commitment";

export type WitnessProofInputs = {
  secret: string;
  salt: string;
  witnessGroupId: number;
  commitment: string;
  nullifier: string;
};

export async function buildWitnessProofInputs(
  sessionSecret: string,
  witnessGroupId: number,
): Promise<WitnessProofInputs> {
  const commitmentResult = await computeWitnessSessionCommitment(
    sessionSecret,
    witnessGroupId,
  );
  const nullifier = computeWitnessNullifier(sessionSecret, witnessGroupId);
  return {
    secret: commitmentResult.secretField,
    salt: commitmentResult.saltField,
    witnessGroupId,
    commitment: commitmentResult.commitment,
    nullifier,
  };
}

export async function generateWitnessProof(
  sessionSecret: string,
  witnessGroupId: number,
): Promise<{ proof?: unknown; publicSignals: string[]; fallback: boolean }> {
  const inputs = await buildWitnessProofInputs(sessionSecret, witnessGroupId);

  try {
    const snarkjs = await import("snarkjs");
    const wasmPath = "/zk/vault_unlock/vault_unlock.wasm";
    const zkeyPath = "/zk/vault_unlock/vault_unlock_final.zkey";

    const wasmRes = await fetch(wasmPath, { method: "HEAD" });
    const zkeyRes = await fetch(zkeyPath, { method: "HEAD" });
    if (!wasmRes.ok || !zkeyRes.ok) {
      return {
        publicSignals: [inputs.commitment, inputs.nullifier],
        fallback: true,
      };
    }

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      {
        secret: inputs.secret,
        salt: inputs.salt,
        vault_id: String(inputs.witnessGroupId),
      },
      wasmPath,
      zkeyPath,
    );

    return { proof, publicSignals, fallback: false };
  } catch {
    return {
      publicSignals: [inputs.commitment, inputs.nullifier],
      fallback: true,
    };
  }
}
