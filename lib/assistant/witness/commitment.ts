import {
  computeCommitmentFromFields,
  computeNullifier,
  computeVaultCommitment,
  passphraseToSecretField,
  fieldToHex,
} from "@/lib/vault/commitment";

export type WitnessCommitmentResult = {
  commitment: string;
  salt: string;
  secretField: string;
  saltField: string;
};

export async function computeWitnessSessionCommitment(
  sessionSecret: string,
  witnessGroupId: number,
): Promise<WitnessCommitmentResult> {
  return computeVaultCommitment(sessionSecret, `witness:${witnessGroupId}`);
}

export function computeWitnessNullifier(
  sessionSecret: string,
  witnessGroupId: number,
): string {
  const secretField = passphraseToSecretField(sessionSecret);
  const nullifier = computeNullifier(secretField, witnessGroupId);
  return fieldToHex(nullifier);
}

export function verifyWitnessCommitment(
  secretField: bigint,
  saltField: bigint,
  expectedCommitmentHex: string,
): boolean {
  const commitment = computeCommitmentFromFields(secretField, saltField);
  return fieldToHex(commitment) === expectedCommitmentHex;
}

export { fieldToHex };
