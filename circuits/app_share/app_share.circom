pragma circom 2.1.6;

template AppShare() {
  signal input secret;
  signal input salt;
  signal input app_id;

  signal output commitment;
  signal output nullifier;

  commitment <== secret * salt;
  nullifier <== secret + app_id;
}

component main = AppShare();
