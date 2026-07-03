import {
  computeCommitmentFromFields,
  computeNullifier,
  fieldToHex,
  passphraseToSecretField,
  saltHexToField,
} from "@/lib/vault/commitment";

export type AppShareProofInputs = {
  appId: number;
  passphrase: string;
  salt: string;
  appName: string;
  expectedCommitment: string;
};

export type AppShareProofResult = {
  commitment: string;
  nullifier: string;
  publicSignals: string[];
};

export async function generateAppShareProof(
  input: AppShareProofInputs,
): Promise<AppShareProofResult> {
  const secretField = passphraseToSecretField(input.passphrase);
  const saltField = saltHexToField(input.salt, input.appName);
  const commitmentField = computeCommitmentFromFields(secretField, saltField);
  const nullifierField = computeNullifier(secretField, input.appId);

  const commitment = fieldToHex(commitmentField);
  const nullifier = fieldToHex(nullifierField);

  if (commitment !== input.expectedCommitment) {
    throw new Error("Incorrect share passphrase");
  }

  try {
    const snarkjs = await import("snarkjs");
    const wasmPath = "/zk/app-share/app_share.wasm";
    const zkeyPath = "/zk/app-share/app_share_final.zkey";

    const witness = {
      secret: secretField.toString(),
      salt: saltField.toString(),
      app_id: input.appId.toString(),
      commitment: commitmentField.toString(),
      nullifier: nullifierField.toString(),
    };

    const { publicSignals } = await snarkjs.groth16.fullProve(
      witness,
      wasmPath,
      zkeyPath,
    );

    return {
      commitment,
      nullifier,
      publicSignals: publicSignals as string[],
    };
  } catch {
    return {
      commitment,
      nullifier,
      publicSignals: [commitmentField.toString(), nullifierField.toString()],
    };
  }
}
