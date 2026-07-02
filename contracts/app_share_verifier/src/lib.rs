#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Map};

#[contracttype]
pub enum DataKey {
    Commitment(BytesN<32>),
    Nullifier(BytesN<32>),
}

#[contract]
pub struct AppShareVerifier;

#[contractimpl]
impl AppShareVerifier {
    pub fn register_share_app(
        env: Env,
        owner: Address,
        app_id: u32,
        commitment: BytesN<32>,
    ) {
        owner.require_auth();
        let _ = app_id;
        env.storage().persistent().set(&DataKey::Commitment(commitment.clone()), &true);
    }

    pub fn verify_share_access(
        env: Env,
        _viewer: Address,
        _app_id: u32,
        commitment: BytesN<32>,
        nullifier: BytesN<32>,
    ) -> bool {
        if env.storage().persistent().has(&DataKey::Nullifier(nullifier.clone())) {
            return false;
        }

        let exists = env
            .storage()
            .persistent()
            .get::<_, bool>(&DataKey::Commitment(commitment))
            .unwrap_or(false);

        if exists {
            env.storage().persistent().set(&DataKey::Nullifier(nullifier), &true);
        }

        exists
    }
}
