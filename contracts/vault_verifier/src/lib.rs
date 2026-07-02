#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Bytes, BytesN,
    Env, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Vault(u32),
    Nullifier(BytesN<32>),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    VaultNotRegistered = 1,
    CommitmentMismatch = 2,
    NullifierUsed = 3,
}

const UNLOCK_EVENT: Symbol = symbol_short!("unlock");

#[contract]
pub struct VaultVerifier;

#[contractimpl]
impl VaultVerifier {
    /// Register a vault commitment on-chain (called when creating a Secure Vault).
    pub fn register_vault(env: Env, caller: Address, vault_id: u32, commitment: Bytes) {
        caller.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Vault(vault_id), &commitment);
        env.events()
            .publish((symbol_short!("reg_vault"),), (vault_id, caller));
    }

    /// Verify vault unlock: validates public ZK outputs (commitment + nullifier anti-replay).
    /// Client generates Groth16 proof locally; public signals must match registered commitment.
    pub fn verify_unlock(
        env: Env,
        caller: Address,
        vault_id: u32,
        commitment: BytesN<32>,
        nullifier: BytesN<32>,
    ) -> Result<bool, VaultError> {
        caller.require_auth();

        let registered: Bytes = env
            .storage()
            .persistent()
            .get(&DataKey::Vault(vault_id))
            .ok_or(VaultError::VaultNotRegistered)?;

        let commitment_bytes = Bytes::from_array(&env, &commitment.to_array());
        if registered.len() != 32 || registered != commitment_bytes {
            return Err(VaultError::CommitmentMismatch);
        }

        if env
            .storage()
            .persistent()
            .has(&DataKey::Nullifier(nullifier.clone()))
        {
            return Err(VaultError::NullifierUsed);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Nullifier(nullifier.clone()), &true);

        env.events()
            .publish((UNLOCK_EVENT,), (vault_id, caller, nullifier));

        Ok(true)
    }

    pub fn is_vault_registered(env: Env, vault_id: u32) -> bool {
        env.storage().persistent().has(&DataKey::Vault(vault_id))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn verify_unlock_success() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VaultVerifier, ());
        let client = VaultVerifierClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        let commitment = BytesN::from_array(&env, &[7u8; 32]);
        client.register_vault(&user, &1u32, &Bytes::from_array(&env, &[7u8; 32]));

        let nullifier = BytesN::from_array(&env, &[9u8; 32]);
        let ok = client.verify_unlock(&user, &1u32, &commitment, &nullifier);
        assert_eq!(ok, Ok(true));

        let replay = client.verify_unlock(&user, &1u32, &commitment, &nullifier);
        assert_eq!(replay, Err(Ok(VaultError::NullifierUsed)));
    }
}
