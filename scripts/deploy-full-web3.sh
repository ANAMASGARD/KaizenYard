#!/usr/bin/env bash
# Full Web3 deploy: Stellar testnet contracts + Groth16 browser artifacts.
# Prerequisites: stellar CLI, circom, npm install (snarkjs).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/usr/local/bin:$ROOT/node_modules/.bin:${PATH:-}"

command -v stellar >/dev/null || {
  echo "Install Stellar CLI: curl -fsSL https://github.com/stellar/stellar-cli/raw/main/install.sh | sh"
  exit 1
}

command -v circom >/dev/null || {
  echo "Install circom: git clone https://github.com/iden3/circom && cd circom && cargo install --path circom"
  exit 1
}

chmod +x "$ROOT/scripts/deploy-stellar-testnet.sh" "$ROOT/scripts/build-all-zk.sh"
"$ROOT/scripts/deploy-stellar-testnet.sh"
"$ROOT/scripts/build-all-zk.sh"

echo ""
echo "Web3 deploy complete. Copy contract IDs above into .env and Vercel."
