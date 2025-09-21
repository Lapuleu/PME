import * as anchor from "/node_modules/@project-serum/anchor"
import { PublicKey } from "/node_modules/@solana/web3.js"

// Anchor setup
const provider = anchor.AnchorProvider.local()
anchor.setProvider(provider)

const programId = new PublicKey("AwArBUWBbQZp5uwPikx3rMxQkjFAYZBnM1R9w66AqDZJ")
const program = new anchor.Program(
  require("../target/idl/kv_store_multi.json"),
  programId,
  provider
)

// Store a key-value pair
export async function storeKeyValue(key, value) {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from("kv_multi")],
    program.programId
  )

  await program.methods
    .storePair(Buffer.from(key), Buffer.from(value))
    .accounts({
      kvAccount: pda,
      user: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .rpc()

  return pda.toBase58()
}

// Retrieve a single key-value
export async function getKeyValue(key) {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from("kv_multi")],
    program.programId
  )

  const account = await program.account.kvAccount.fetch(pda)
  const index = account.keys.findIndex(k => Buffer.from(k).toString() === key)
  if (index === -1) return null
  return Buffer.from(account.values[index]).toString()
}

// Retrieve all key-values
export async function getAllKeyValues() {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from("kv_multi")],
    program.programId
  )

  const account = await program.account.kvAccount.fetch(pda)
  const result = {}
  for (let i = 0; i < account.keys.length; i++) {
    result[Buffer.from(account.keys[i]).toString()] = Buffer.from(
      account.values[i]
    ).toString()
  }
  return result
}
