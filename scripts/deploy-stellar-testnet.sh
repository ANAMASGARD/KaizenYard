#!/usr/bin/env bash
# Build + deploy Kaizenyard Soroban contracts to Stellar TESTNET (hackathon).
# No Stellar API key required — uses public RPC + Friendbot funding.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/usr/local/bin:${PATH:-}"
IDENTITY="${STELLAR_IDENTITY:-kaizenyard-deploy}"
NETWORK="${STELLAR_NETWORK:-testnet}"

command -v stellar >/dev/null || {
  echo "Install Stellar CLI: curl -fsSL https://github.com/stellar/stellar-cli/raw/main/install.sh | sh"
  exit 1
}

if ! stellar keys address "$IDENTITY" >/dev/null 2>&1; then
  echo "Creating identity $IDENTITY on $NETWORK..."
  stellar keys generate "$IDENTITY" --network "$NETWORK" --fund
fi

echo "=== Building vault_verifier ==="
cd "$ROOT/contracts/vault_verifier"
stellar contract build
VAULT_WASM="$ROOT/contracts/vault_verifier/target/wasm32v1-none/release/vault_verifier.wasm"

echo "=== Building agent_witness_verifier ==="
cd "$ROOT/contracts/agent_witness_verifier"
stellar contract build
WITNESS_WASM="$ROOT/contracts/agent_witness_verifier/target/wasm32v1-none/release/agent_witness_verifier.wasm"

echo "=== Building app_share_verifier ==="
cd "$ROOT/contracts/app_share_verifier"
stellar contract build
APP_SHARE_WASM="$ROOT/contracts/app_share_verifier/target/wasm32v1-none/release/app_share_verifier.wasm"

echo "=== Deploying vault_verifier ==="
VAULT_ID=$(stellar contract deploy --wasm "$VAULT_WASM" --source "$IDENTITY" --network "$NETWORK" | tail -1)

echo "=== Deploying agent_witness_verifier ==="
WITNESS_ID=$(stellar contract deploy --wasm "$WITNESS_WASM" --source "$IDENTITY" --network "$NETWORK" | tail -1)

echo "=== Deploying app_share_verifier ==="
APP_SHARE_ID=$(stellar contract deploy --wasm "$APP_SHARE_WASM" --source "$IDENTITY" --network "$NETWORK" | tail -1)

echo ""
echo "Deployed to Stellar $NETWORK:"
echo "  NEXT_PUBLIC_VAULT_VERIFIER_CONTRACT_ID=$VAULT_ID"
echo "  NEXT_PUBLIC_AGENT_WITNESS_VERIFIER_CONTRACT_ID=$WITNESS_ID"
echo "  NEXT_PUBLIC_APP_SHARE_VERIFIER_CONTRACT_ID=$APP_SHARE_ID"
echo ""
echo "Add these to .env and Vercel project env vars."
echo "Then run: ./scripts/build-all-zk.sh"
