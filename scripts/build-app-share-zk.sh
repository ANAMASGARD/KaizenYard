#!/usr/bin/env bash
# Build Groth16 artifacts for app_share circuit (BLS12-381 / Stellar-compatible).
# Requires: circom, snarkjs, node
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$ROOT/node_modules/.bin:${PATH:-}"
CIRCUIT_DIR="$ROOT/circuits/app_share"
OUT_DIR="$ROOT/public/zk/app-share"
BUILD_DIR="$ROOT/circuits/app_share/build"
VAULT_BUILD_DIR="$ROOT/circuits/vault_unlock/build"

mkdir -p "$OUT_DIR" "$BUILD_DIR"

echo "Compiling app_share.circom (bls12381)…"
circom "$CIRCUIT_DIR/app_share.circom" \
  --r1cs --wasm --sym \
  -p bls12381 \
  -o "$BUILD_DIR"

PTAU="$VAULT_BUILD_DIR/pot12_final.ptau"
if [ ! -f "$PTAU" ]; then
  echo "Reusing vault PTAU not found — generating dev powers-of-tau (NOT for production)…"
  mkdir -p "$VAULT_BUILD_DIR"
  snarkjs powersoftau new bls12-381 12 "$VAULT_BUILD_DIR/pot12_0000.ptau"
  snarkjs powersoftau contribute "$VAULT_BUILD_DIR/pot12_0000.ptau" "$VAULT_BUILD_DIR/pot12_0001.ptau" \
    --name="kaizenyard-dev" -e="random"
  snarkjs powersoftau prepare phase2 "$VAULT_BUILD_DIR/pot12_0001.ptau" "$PTAU"
fi

ZKEY="$BUILD_DIR/app_share_final.zkey"
snarkjs groth16 setup "$BUILD_DIR/app_share.r1cs" "$PTAU" "$BUILD_DIR/app_share_0000.zkey"
snarkjs zkey contribute "$BUILD_DIR/app_share_0000.zkey" "$ZKEY" --name="kaizenyard" -e="random"
snarkjs zkey export verificationkey "$ZKEY" "$OUT_DIR/verification_key.json"

cp "$BUILD_DIR/app_share_js/app_share.wasm" "$OUT_DIR/app_share.wasm"
cp "$ZKEY" "$OUT_DIR/app_share_final.zkey"

echo "Artifacts written to public/zk/app-share/"
echo "  app_share.wasm"
echo "  app_share_final.zkey"
echo "  verification_key.json"
