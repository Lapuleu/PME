import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "/node_modules/@solana/web3.js";

/**
 * Key-Value Store client using a custom Solana program.
 * Your program must accept two instructions:
 *   - "store" to save a key/value
 *   - "get" (account fetch) to read the data
 *
 * This client assumes a simple program where each key maps to a PDA
 * derived from ["kv", key].
 */

const RPC_URL = "https://api.devnet.solana.com"; // or mainnet
const connection = new Connection(RPC_URL, "confirmed");

// ----------------------
// CONFIGURATION
// ----------------------
// Replace with your deployed program’s public key
const PROGRAM_ID = new PublicKey("AwArBUWBbQZp5uwPikx3rMxQkjFAYZBnM1R9w66AqDZJ");

/**
 * Generate or load a wallet.
 * For production use, integrate Phantom or another wallet adapter.
 */
export function generateWallet() {
  return Keypair.generate();
}

/**
 * Store a key-value pair on Solana.
 * @param {Keypair} wallet - Keypair paying for the transaction.
 * @param {string} key - Arbitrary string key.
 * @param {string} value - Arbitrary string value.
 * @returns {string} - PDA where the value is stored.
 */
export async function storeKeyValue(wallet, key, value) {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from("kv"), Buffer.from(key)],
    PROGRAM_ID
  );

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: pda, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: Buffer.from(JSON.stringify({ action: "store", key, value })),
  });

  const tx = new Transaction().add(instruction);

  await sendAndConfirmTransaction(connection, tx, [wallet]);
  return pda.toBase58();
}

/**
 * Retrieve a stored value.
 * @param {string} key
 * @returns {string} value stored (program must return raw data)
 */
export async function getKeyValue(key) {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from("kv"), Buffer.from(key)],
    PROGRAM_ID
  );

  // Fetch raw account data from the Solana cluster
  const accountInfo = await connection.getAccountInfo(pda);
  if (!accountInfo) throw new Error("Key not found on-chain");

  // Decode according to your program’s data layout
  // This example assumes raw UTF-8 string
  return Buffer.from(accountInfo.data).toString();
}
