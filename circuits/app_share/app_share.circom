pragma circom 2.1.6;

template AppShare() {
  signal input secret;
  signal input salt;
  signal input app_id;
  signal input commitment;
  signal input nullifier;

  commitment === secret * salt;
  nullifier === secret + app_id;
}

component main { public [commitment, nullifier] } = AppShare();
