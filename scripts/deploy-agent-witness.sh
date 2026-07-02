#!/usr/bin/env bash
# Deploy agent_witness_verifier to Stellar testnet.
# Prerequisites: stellar CLI, funded testnet identity.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts/agent_witness_verifier"

echo "Building agent_witness_verifier WASM..."
cargo build --target wasm32v1-none --release

WASM="$ROOT/contracts/agent_witness_verifier/target/wasm32v1-none/release/agent_witness_verifier.wasm"
IDENTITY="${STELLAR_IDENTITY:-kaizenyard-witness}"
NETWORK="${STELLAR_NETWORK:-testnet}"

echo "Deploying to $NETWORK as $IDENTITY..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM" \
  --source "$IDENTITY" \
  --network "$NETWORK")

echo ""
echo "Deployed agent_witness_verifier: $CONTRACT_ID"
echo "Add to .env:"
echo "NEXT_PUBLIC_AGENT_WITNESS_VERIFIER_CONTRACT_ID=$CONTRACT_ID"
