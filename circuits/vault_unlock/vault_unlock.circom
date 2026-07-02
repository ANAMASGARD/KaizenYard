pragma circom 2.1.6;

template VaultUnlock() {
    signal input secret;
    signal input salt;
    signal input vault_id;
    signal output commitment;
    signal output nullifier;

    commitment <== secret * salt;
    nullifier <== secret + vault_id;
}

component main { public [commitment, nullifier] } = VaultUnlock();
