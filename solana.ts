import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

// Initialize Anchor program
const provider = anchor.AnchorProvider.local();
anchor.setProvider(provider);

const programId = new PublicKey("AwArBUWBbQZp5uwPikx3rMxQkjFAYZBnM1R9w66AqDZJ");
const program = new anchor.Program(
  require("../target/idl/kv_store.json"),
  programId,
  provider
);

// Store a key-value pair
export async function storeKeyValue(key: string, value: string) {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from("kv"), Buffer.from(key)],
    programId
  );

  await program.methods
    .storePair(Buffer.from(key), Buffer.from(value))
    .accounts({
      kvAccount: pda,
      user: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  return pda.toBase58();
}

// Retrieve a key-value pair
export async function getKeyValue(key: string) {
  const [pda] = await PublicKey.findProgramAddressSync(
    [Buffer.from("kv"), Buffer.from(key)],
    programId
  );

  const account = await program.account.kvAccount.fetch(pda) as {
    key: Uint8Array,
    value: Uint8Array
  };

  console.log("Key:", Buffer.from(account.key).toString());
  console.log("Value:", Buffer.from(account.value).toString());

  return {
    key: Buffer.from(account.key).toString(),
    value: Buffer.from(account.value).toString()
  };
}