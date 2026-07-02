import {
  computeCommitmentFromFields,
  computeNullifier,
  fieldToHex,
  passphraseToSecretField,
  saltHexToField,
} from "@/lib/vault/commitment";

export type VaultProofInputs = {
  vaultId: number;
  passphrase: string;
  salt: string;
  spaceName: string;
  expectedCommitment: string;
};

export type VaultProofResult = {
  commitment: string;
  nullifier: string;
  publicSignals: string[];
};

export async function generateVaultProof(
  input: VaultProofInputs,
): Promise<VaultProofResult> {
  const secretField = passphraseToSecretField(input.passphrase);
  const saltField = saltHexToField(input.salt, input.spaceName);
  const commitmentField = computeCommitmentFromFields(secretField, saltField);
  const nullifierField = computeNullifier(secretField, input.vaultId);

  const commitment = fieldToHex(commitmentField);
  const nullifier = fieldToHex(nullifierField);

  if (normalizeHex(commitment) !== normalizeHex(input.expectedCommitment)) {
    throw new Error("Incorrect vault passphrase");
  }

  try {
    const snarkjs = await import("snarkjs");
    const wasmPath = "/zk/vault_unlock.wasm";
    const zkeyPath = "/zk/vault_unlock_final.zkey";

    const witness = {
      secret: secretField.toString(),
      salt: saltField.toString(),
      vault_id: input.vaultId.toString(),
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      witness,
      wasmPath,
      zkeyPath,
    );

    return {
      commitment,
      nullifier,
      publicSignals: publicSignals as string[],
      ...{ proof },
    } as VaultProofResult & { proof: unknown };
  } catch {
    return {
      commitment,
      nullifier,
      publicSignals: [
        commitmentField.toString(),
        nullifierField.toString(),
      ],
    };
  }
}

export async function proveVaultUnlock(
  input: VaultProofInputs,
): Promise<VaultProofResult> {
  return generateVaultProof(input);
}

function normalizeHex(hex: string): string {
  return hex.padStart(64, "0").slice(-64).toLowerCase();
}
