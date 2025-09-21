use anchor_lang::prelude::*;

declare_id!("AwArBUWBbQZp5uwPikx3rMxQkjFAYZBnM1R9w66AqDZJ");

#[program]
pub mod kv_store_multi {
    use super::*;

    pub fn store_pair(ctx: Context<StorePairs>, key: Vec<u8>, value: Vec<u8>) -> Result<()> {
        let kv_account = &mut ctx.accounts.kv_account;

        // Replace value if key exists
        if let Some(pos) = kv_account.keys.iter().position(|k| *k == key) {
            kv_account.values[pos] = value;
        } else {
            kv_account.keys.push(key);
            kv_account.values.push(value);
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct StorePairs<'info> {
    #[account(init_if_needed, payer = user, space = 8 + 1024)]
    pub kv_account: Account<'info, KVAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct KVAccount {
    pub keys: Vec<Vec<u8>>,
    pub values: Vec<Vec<u8>>,
}
