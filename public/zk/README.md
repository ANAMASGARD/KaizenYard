# ZK artifacts (Groth16 / BLS12-381)

Built artifacts for browser proving via snarkjs:

## Vault unlock (`public/zk/`)

- `vault_unlock.wasm` — witness calculator
- `vault_unlock_final.zkey` — proving key
- `verification_key.json` — verification key

## Template app share (`public/zk/app-share/`)

- `app_share.wasm`
- `app_share_final.zkey`
- `verification_key.json`

## Rebuild

```bash
# Requires circom + npm install (snarkjs)
chmod +x scripts/build-all-zk.sh
./scripts/build-all-zk.sh
```

Dev trusted setup only — not production-ready.

Without these files, unlock/share flows still work: the client computes commitment/nullifier and Soroban contracts validate public outputs on-chain.
