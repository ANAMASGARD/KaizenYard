# ZK artifacts

Run `./scripts/build-vault-zk.sh` to generate:

- `vault_unlock.wasm` — witness calculator
- `vault_unlock_final.zkey` — proving key
- `verification_key.json` — verification key

Without these files, vault unlock still works: the client computes commitment/nullifier and the Soroban contract validates public outputs on-chain.
