#!/usr/bin/env bash
# Build Groth16 artifacts for vault_unlock circuit (BLS12-381 / Stellar-compatible).
# Requires: circom, snarkjs, node
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$ROOT/node_modules/.bin:${PATH:-}"
CIRCUIT_DIR="$ROOT/circuits/vault_unlock"
OUT_DIR="$ROOT/public/zk"
BUILD_DIR="$ROOT/circuits/vault_unlock/build"

mkdir -p "$OUT_DIR" "$BUILD_DIR"

echo "Compiling vault_unlock.circom (bls12381)…"
circom "$CIRCUIT_DIR/vault_unlock.circom" \
  --r1cs --wasm --sym \
  -p bls12381 \
  -o "$BUILD_DIR"

PTAU="$BUILD_DIR/pot12_final.ptau"
if [ ! -f "$PTAU" ]; then
  echo "Generating dev powers-of-tau (NOT for production)…"
  snarkjs powersoftau new bls12-381 12 "$BUILD_DIR/pot12_0000.ptau"
  snarkjs powersoftau contribute "$BUILD_DIR/pot12_0000.ptau" "$BUILD_DIR/pot12_0001.ptau" \
    --name="kaizenyard-dev" -e="random"
  snarkjs powersoftau prepare phase2 "$BUILD_DIR/pot12_0001.ptau" "$PTAU"
fi

ZKEY="$BUILD_DIR/vault_unlock_final.zkey"
snarkjs groth16 setup "$BUILD_DIR/vault_unlock.r1cs" "$PTAU" "$BUILD_DIR/vault_unlock_0000.zkey"
snarkjs zkey contribute "$BUILD_DIR/vault_unlock_0000.zkey" "$ZKEY" --name="kaizenyard" -e="random"
snarkjs zkey export verificationkey "$ZKEY" "$OUT_DIR/verification_key.json"

cp "$BUILD_DIR/vault_unlock_js/vault_unlock.wasm" "$OUT_DIR/vault_unlock.wasm"
cp "$ZKEY" "$OUT_DIR/vault_unlock_final.zkey"

echo "Artifacts written to public/zk/"
echo "  vault_unlock.wasm"
echo "  vault_unlock_final.zkey"
echo "  verification_key.json"
