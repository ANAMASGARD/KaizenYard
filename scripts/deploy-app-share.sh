#!/usr/bin/env bash
# Deploy app_share_verifier only (vault + witness already on testnet).
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

echo "=== Building app_share_verifier ==="
cd "$ROOT/contracts/app_share_verifier"
stellar contract build
APP_SHARE_WASM="$ROOT/contracts/app_share_verifier/target/wasm32v1-none/release/app_share_verifier.wasm"

echo "=== Deploying app_share_verifier ==="
APP_SHARE_ID=$(stellar contract deploy --wasm "$APP_SHARE_WASM" --source "$IDENTITY" --network "$NETWORK" | tail -1)

echo ""
echo "Deployed app_share_verifier to Stellar $NETWORK:"
echo "  NEXT_PUBLIC_APP_SHARE_VERIFIER_CONTRACT_ID=$APP_SHARE_ID"
echo ""
echo "Add to .env and Vercel project env vars."
