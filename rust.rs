use anchor_lang::prelude::*;

declare_id!("AwArBUWBbQZp5uwPikx3rMxQkjFAYZBnM1R9w66AqDZJ");

#[program]
pub mod kv_store {
    use super::*;

    // Store a key-value pair (both are arbitrary bytes)
    pub fn store_pair(ctx: Context<StorePair>, key: Vec<u8>, value: Vec<u8>) -> Result<()> {
        let kv_account = &mut ctx.accounts.kv_account;
        kv_account.key = key;
        kv_account.value = value;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct StorePair<'info> {
    #[account(init_if_needed, payer = user, space = 8 + 64 + 64)]
    pub kv_account: Account<'info, KVAccount>, // stores up to 64 bytes each
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct KVAccount {
    pub key: Vec<u8>,
    pub value: Vec<u8>,
}
