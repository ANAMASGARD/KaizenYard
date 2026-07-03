#!/usr/bin/env bash
# Build all Groth16 browser artifacts (vault unlock + template app share).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$ROOT/node_modules/.bin:${PATH:-}"

command -v circom >/dev/null || {
  echo "Install circom: cargo install circom"
  exit 1
}

command -v snarkjs >/dev/null || {
  echo "Run npm install (snarkjs is a dev dependency)"
  exit 1
}

chmod +x "$ROOT/scripts/build-vault-zk.sh" "$ROOT/scripts/build-app-share-zk.sh"
"$ROOT/scripts/build-vault-zk.sh"
"$ROOT/scripts/build-app-share-zk.sh"

echo ""
echo "All ZK artifacts ready under public/zk/"
