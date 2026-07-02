import {
  buildVerifyAppShareTx,
  registerAppShareOnChain,
  submitSignedTx,
} from "@/lib/stellar/contract";

export async function registerAppShareCommitment(input: {
  sourceAddress: string;
  appId: number;
  commitment: string;
  sign: (xdr: string) => Promise<string>;
}) {
  const xdr = await registerAppShareOnChain(
    input.sourceAddress,
    input.appId,
    input.commitment,
  );
  const signed = await input.sign(xdr);
  return submitSignedTx(signed);
}

export async function verifyAppShareOnChain(input: {
  sourceAddress: string;
  appId: number;
  commitment: string;
  nullifier: string;
  sign: (xdr: string) => Promise<string>;
}) {
  const xdr = await buildVerifyAppShareTx(
    input.sourceAddress,
    input.appId,
    input.commitment,
    input.nullifier,
  );
  const signed = await input.sign(xdr);
  return submitSignedTx(signed);
}
