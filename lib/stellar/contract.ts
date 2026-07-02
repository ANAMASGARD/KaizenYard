import {
  Contract,
  Horizon,
  rpc as StellarRpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
  Networks,
} from "@stellar/stellar-sdk";
import {
  getAppShareVerifierContractId,
  getStellarConfig,
  getVaultVerifierContractId,
} from "@/lib/stellar/config";

function getRpc(): StellarRpc.Server {
  const { rpcUrl } = getStellarConfig();
  return new StellarRpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith("http://") });
}

function getHorizon(): Horizon.Server {
  const { horizonUrl } = getStellarConfig();
  return new Horizon.Server(horizonUrl);
}

export async function fundTestnetAccount(publicKey: string): Promise<void> {
  const { friendbotUrl } = getStellarConfig();
  if (!friendbotUrl) return;
  const res = await fetch(`${friendbotUrl}?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) {
    throw new Error("Friendbot funding failed");
  }
}

export async function registerVaultOnChain(
  sourceAddress: string,
  vaultId: number,
  commitmentHex: string,
): Promise<string> {
  const contractId = getVaultVerifierContractId();
  if (!contractId) {
    throw new Error("Vault verifier contract ID not configured");
  }

  const rpc = getRpc();
  const account = await rpc.getAccount(sourceAddress);
  const contract = new Contract(contractId);
  const networkPassphrase =
    getStellarConfig().networkPassphrase === Networks.PUBLIC
      ? Networks.PUBLIC
      : Networks.TESTNET;

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        "register_vault",
        nativeToScVal(sourceAddress, { type: "address" }),
        nativeToScVal(vaultId, { type: "u32" }),
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

export async function buildVerifyUnlockTx(
  sourceAddress: string,
  vaultId: number,
  commitmentHex: string,
  nullifierHex: string,
): Promise<string> {
  const contractId = getVaultVerifierContractId();
  if (!contractId) {
    throw new Error("Vault verifier contract ID not configured");
  }

  const rpc = getRpc();
  const account = await rpc.getAccount(sourceAddress);
  const contract = new Contract(contractId);
  const networkPassphrase =
    getStellarConfig().networkPassphrase === Networks.PUBLIC
      ? Networks.PUBLIC
      : Networks.TESTNET;

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        "verify_unlock",
        nativeToScVal(sourceAddress, { type: "address" }),
        nativeToScVal(vaultId, { type: "u32" }),
        nativeToScVal(Buffer.from(commitmentHex.padStart(64, "0").slice(-64), "hex"), {
          type: "bytes",
        }),
        nativeToScVal(Buffer.from(nullifierHex.padStart(64, "0").slice(-64), "hex"), {
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

export async function submitSignedTx(signedXdr: string): Promise<{
  hash: string;
  returnValue: unknown;
}> {
  const rpc = getRpc();
  const networkPassphrase =
    getStellarConfig().networkPassphrase === Networks.PUBLIC
      ? Networks.PUBLIC
      : Networks.TESTNET;

  const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  const response = await rpc.sendTransaction(tx);

  if (response.status === "ERROR") {
    throw new Error(`Transaction failed: ${response.errorResult ?? "unknown"}`);
  }

  let getResponse = await rpc.getTransaction(response.hash);
  while (getResponse.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResponse = await rpc.getTransaction(response.hash);
  }

  if (getResponse.status !== "SUCCESS") {
    throw new Error(`Transaction failed: ${getResponse.status}`);
  }

  return {
    hash: response.hash,
    returnValue: getResponse.returnValue
      ? scValToNative(getResponse.returnValue)
      : null,
  };
}

export async function registerAppShareOnChain(
  sourceAddress: string,
  appId: number,
  commitmentHex: string,
): Promise<string> {
  const contractId = getAppShareVerifierContractId();
  if (!contractId) {
    throw new Error("App share verifier contract ID not configured");
  }

  const rpc = getRpc();
  const account = await rpc.getAccount(sourceAddress);
  const contract = new Contract(contractId);
  const networkPassphrase =
    getStellarConfig().networkPassphrase === Networks.PUBLIC
      ? Networks.PUBLIC
      : Networks.TESTNET;

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        "register_share_app",
        nativeToScVal(sourceAddress, { type: "address" }),
        nativeToScVal(appId, { type: "u32" }),
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

export async function buildVerifyAppShareTx(
  sourceAddress: string,
  appId: number,
  commitmentHex: string,
  nullifierHex: string,
): Promise<string> {
  const contractId = getAppShareVerifierContractId();
  if (!contractId) {
    throw new Error("App share verifier contract ID not configured");
  }

  const rpc = getRpc();
  const account = await rpc.getAccount(sourceAddress);
  const contract = new Contract(contractId);
  const networkPassphrase =
    getStellarConfig().networkPassphrase === Networks.PUBLIC
      ? Networks.PUBLIC
      : Networks.TESTNET;

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        "verify_share_access",
        nativeToScVal(sourceAddress, { type: "address" }),
        nativeToScVal(appId, { type: "u32" }),
        nativeToScVal(Buffer.from(commitmentHex.padStart(64, "0").slice(-64), "hex"), {
          type: "bytes",
        }),
        nativeToScVal(Buffer.from(nullifierHex.padStart(64, "0").slice(-64), "hex"), {
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

export async function getAccountBalance(address: string): Promise<string> {
  try {
    const account = await getHorizon().loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native && "balance" in native ? native.balance : "0";
  } catch {
    return "0";
  }
}
