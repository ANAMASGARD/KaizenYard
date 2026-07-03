pragma circom 2.1.6;

template VaultUnlock() {
    signal input secret;
    signal input salt;
    signal input vault_id;
    signal input commitment;
    signal input nullifier;

    commitment === secret * salt;
    nullifier === secret + vault_id;
}

component main { public [commitment, nullifier] } = VaultUnlock();
