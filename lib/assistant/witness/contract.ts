import {
  Contract,
  rpc as StellarRpc,
  TransactionBuilder,
  nativeToScVal,
  BASE_FEE,
  Networks,
} from "@stellar/stellar-sdk";
import { getAgentWitnessVerifierContractId, getStellarConfig } from "@/lib/stellar/config";
import { submitSignedTx } from "@/lib/stellar/contract";

function getRpc(): StellarRpc.Server {
  const { rpcUrl } = getStellarConfig();
  return new StellarRpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith("http://") });
}

function getNetworkPassphrase(): string {
  return getStellarConfig().networkPassphrase === Networks.PUBLIC
    ? Networks.PUBLIC
    : Networks.TESTNET;
}

export async function buildRegisterWitnessGroupTx(
  sourceAddress: string,
  groupId: number,
  commitmentHex: string,
): Promise<string> {
  const contractId = getAgentWitnessVerifierContractId();
  if (!contractId) {
    throw new Error("Agent witness verifier contract ID not configured");
  }

  const rpc = getRpc();
  const account = await rpc.getAccount(sourceAddress);
  const contract = new Contract(contractId);

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(
      contract.call(
        "register_witness_group",
        nativeToScVal(sourceAddress, { type: "address" }),
        nativeToScVal(groupId, { type: "u32" }),
        nativeToScVal(Buffer.from(commitmentHex.padStart(64, "0").slice(-64), "hex"), {
          type: "bytes",
        }),
      ),
    )
    .setTimeout(180)
    .build();

  const simulation = await rpc.simulateTransaction(tx);
  if (StellarRpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  tx = StellarRpc.assembleTransaction(tx, simulation).build();
  return tx.toXDR();
}

export async function buildVerifyWitnessActionTx(
  sourceAddress: string,
  groupId: number,
  commitmentHex: string,
  nullifierHex: string,
  actionHashHex: string,
  mode: string,
): Promise<string> {
  const contractId = getAgentWitnessVerifierContractId();
  if (!contractId) {
    throw new Error("Agent witness verifier contract ID not configured");
  }

  const rpc = getRpc();
  const account = await rpc.getAccount(sourceAddress);
  const contract = new Contract(contractId);

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(
      contract.call(
        "verify_witness_action",
        nativeToScVal(sourceAddress, { type: "address" }),
        nativeToScVal(groupId, { type: "u32" }),
        nativeToScVal(Buffer.from(commitmentHex.padStart(64, "0").slice(-64), "hex"), {
          type: "bytes",
        }),
        nativeToScVal(Buffer.from(nullifierHex.padStart(64, "0").slice(-64), "hex"), {
          type: "bytes",
        }),
        nativeToScVal(Buffer.from(actionHashHex.padStart(64, "0").slice(-64), "hex"), {
          type: "bytes",
        }),
        nativeToScVal(mode, { type: "symbol" }),
      ),
    )
    .setTimeout(180)
    .build();

  const simulation = await rpc.simulateTransaction(tx);
  if (StellarRpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  tx = StellarRpc.assembleTransaction(tx, simulation).build();
  return tx.toXDR();
}

export async function submitWitnessAction(
  signedXdr: string,
): Promise<{ hash: string }> {
  const result = await submitSignedTx(signedXdr);
  return { hash: result.hash };
}

export { getAgentWitnessVerifierContractId };
