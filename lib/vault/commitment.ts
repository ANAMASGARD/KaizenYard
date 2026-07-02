const FIELD_PRIME = BigInt(
  "5243587517512619047944774050818596583769055250052763780750315975154961266173943326472139795752167723559571360075890000601286614034607905855967295254075748092483808899686524991614102883417957967808811549354781426086895461266799340443528780746173498793150153287895595233564845624390967048960000000000001",
);

function toField(value: string): bigint {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  let acc = BigInt(0);
  for (const byte of bytes) {
    acc = (acc * BigInt(256) + BigInt(byte)) % FIELD_PRIME;
  }
  return acc === BigInt(0) ? BigInt(1) : acc;
}

function fieldToHex(value: bigint): string {
  return value.toString(16).padStart(64, "0");
}

export type VaultCommitmentResult = {
  commitment: string;
  salt: string;
  secretField: string;
  saltField: string;
};

export async function computeVaultCommitment(
  passphrase: string,
  spaceLabel: string,
): Promise<VaultCommitmentResult> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const secretField = toField(passphrase);
  const saltField = toField(`${salt}:${spaceLabel}`);
  const commitmentField = (secretField * saltField) % FIELD_PRIME;

  return {
    commitment: fieldToHex(commitmentField),
    salt,
    secretField: secretField.toString(),
    saltField: saltField.toString(),
  };
}

export function computeCommitmentFromFields(
  secretField: bigint,
  saltField: bigint,
): bigint {
  return (secretField * saltField) % FIELD_PRIME;
}

export function computeNullifier(
  secretField: bigint,
  vaultId: number,
): bigint {
  return (secretField + BigInt(vaultId)) % FIELD_PRIME;
}

export function passphraseToSecretField(passphrase: string): bigint {
  return toField(passphrase);
}

export function saltHexToField(salt: string, spaceLabel: string): bigint {
  return toField(`${salt}:${spaceLabel}`);
}

export { FIELD_PRIME, fieldToHex };
