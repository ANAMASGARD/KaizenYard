import {
  computeCommitmentFromFields,
  computeNullifier,
  fieldToHex,
  passphraseToSecretField,
  saltHexToField,
} from "@/lib/vault/commitment";

export type AppShareCommitmentResult = {
  commitment: string;
  salt: string;
  secretField: string;
  saltField: string;
  nullifierRoot: string;
};

export async function computeAppShareCommitment(
  passphrase: string,
  appLabel: string,
  appId: number,
): Promise<AppShareCommitmentResult> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const secretField = passphraseToSecretField(passphrase);
  const saltField = saltHexToField(salt, appLabel);
  const commitmentField = computeCommitmentFromFields(secretField, saltField);
  const nullifierRoot = computeNullifier(secretField, appId);

  return {
    commitment: fieldToHex(commitmentField),
    salt,
    secretField: secretField.toString(),
    saltField: saltField.toString(),
    nullifierRoot: fieldToHex(nullifierRoot),
  };
}

export function verifyAppSharePassphrase(input: {
  passphrase: string;
  salt: string;
  appLabel: string;
  expectedCommitment: string;
}): boolean {
  const secretField = passphraseToSecretField(input.passphrase);
  const saltField = saltHexToField(input.salt, input.appLabel);
  const commitment = fieldToHex(computeCommitmentFromFields(secretField, saltField));
  return commitment === input.expectedCommitment;
}
