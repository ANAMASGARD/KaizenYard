#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
    Symbol,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Group(u32),
    Nullifier(BytesN<32>),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum WitnessError {
    GroupNotRegistered = 1,
    CommitmentMismatch = 2,
    NullifierUsed = 3,
}

const WITNESS_EVENT: Symbol = symbol_short!("witness");

#[contract]
pub struct AgentWitnessVerifier;

#[contractimpl]
impl AgentWitnessVerifier {
    pub fn register_witness_group(
        env: Env,
        caller: Address,
        group_id: u32,
        commitment: BytesN<32>,
    ) {
        caller.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Group(group_id), &commitment);
        env.events()
            .publish((symbol_short!("reg_grp"),), (group_id, caller));
    }

    pub fn verify_witness_action(
        env: Env,
        caller: Address,
        group_id: u32,
        commitment: BytesN<32>,
        nullifier: BytesN<32>,
        action_hash: BytesN<32>,
        mode: Symbol,
    ) -> Result<bool, WitnessError> {
        caller.require_auth();

        let registered: BytesN<32> = env
            .storage()
            .persistent()
            .get(&DataKey::Group(group_id))
            .ok_or(WitnessError::GroupNotRegistered)?;

        if registered != commitment {
            return Err(WitnessError::CommitmentMismatch);
        }

        if env
            .storage()
            .persistent()
            .has(&DataKey::Nullifier(nullifier.clone()))
        {
            return Err(WitnessError::NullifierUsed);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Nullifier(nullifier.clone()), &true);

        env.events().publish(
            (WITNESS_EVENT,),
            (group_id, caller, nullifier, action_hash, mode),
        );

        Ok(true)
    }

    pub fn is_nullifier_used(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Nullifier(nullifier))
    }

    pub fn is_group_registered(env: Env, group_id: u32) -> bool {
        env.storage().persistent().has(&DataKey::Group(group_id))
    }
}
