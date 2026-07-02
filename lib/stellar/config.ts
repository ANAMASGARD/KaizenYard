export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";

const CONFIG = {
  testnet: {
    horizonUrl: "https://horizon-testnet.stellar.org",
    rpcUrl:
      process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
      "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    friendbotUrl: "https://friendbot.stellar.org",
    explorerBase: "https://stellar.expert/explorer/testnet",
  },
  mainnet: {
    horizonUrl: "https://horizon.stellar.org",
    rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    friendbotUrl: null as string | null,
    explorerBase: "https://stellar.expert/explorer/public",
  },
} as const;

export type StellarNetworkKey = keyof typeof CONFIG;

export function getStellarConfig() {
  const key = (STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet") as StellarNetworkKey;
  return CONFIG[key];
}

export function getVaultVerifierContractId(): string | null {
  return process.env.NEXT_PUBLIC_VAULT_VERIFIER_CONTRACT_ID ?? null;
}

export function getAppShareVerifierContractId(): string | null {
  return process.env.NEXT_PUBLIC_APP_SHARE_VERIFIER_CONTRACT_ID ?? null;
}

export function txExplorerUrl(hash: string): string {
  const { explorerBase } = getStellarConfig();
  return `${explorerBase}/tx/${hash}`;
}

export function contractExplorerUrl(contractId: string): string {
  const { explorerBase } = getStellarConfig();
  return `${explorerBase}/contract/${contractId}`;
}
