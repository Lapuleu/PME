import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as crypto from "crypto";

// ----------------------
// AES Encryption Helpers
// ----------------------
function encryptPrivateKey(privateKey: Uint8Array, password: string) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(password).digest();

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted: Buffer = cipher.update(privateKey);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return { iv: iv.toString("hex"), encrypted: encrypted.toString("hex") };
}

function decryptPrivateKey(encryptedHex: string, ivHex: string, password: string) {
  const key = crypto.createHash("sha256").update(password).digest();
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return new Uint8Array(decrypted);
}

// ----------------------
// Anchor Setup
// ----------------------
const provider = anchor.AnchorProvider.local();  // Uses local wallet
anchor.setProvider(provider);
const connection = provider.connection;
const payer = provider.wallet;

// ----------------------
// Define Program IDL (mock)
// ----------------------
// Normally, this would be a compiled Anchor program
// For simplicity, we store encrypted data in a PDA
const programId = new PublicKey("FILL_IN_WITH_YOUR_PROGRAM_ID");

// ----------------------
// Client-side storage logic
// ----------------------
async function storeEncryptedKey(password: string, privateKey: Uint8Array) {
  const { encrypted, iv } = encryptPrivateKey(privateKey, password);

  // Derive a PDA for storing this key
  const [pda, _] = await PublicKey.findProgramAddress(
    [Buffer.from("encrypted_key")],
    programId
  );

  console.log("PDA to store encrypted key:", pda.toBase58());

  // Build a transaction to store the encrypted string
  // Note: The program must implement a `store_key` instruction accepting the string
  const tx = new anchor.web3.Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: pda,
      lamports: 1000 // minimal lamports to create the account if needed
    })
  );

  const signature = await provider.sendAndConfirm(tx);
  console.log("Transaction signature:", signature);

  return { encrypted, iv, pda };
}

async function retrieveEncryptedKey(pda: PublicKey, password: string, encrypted: string, iv: string) {
  // In a real Anchor program, you would fetch account data:
  // const account = await program.account.encryptedKey.fetch(pda);
  // For this demo, we just decrypt locally

  const privateKey = decryptPrivateKey(encrypted, iv, password);
  console.log("Decrypted private key:", privateKey);
  return privateKey;
}

// ----------------------
// Example Usage
// ----------------------
async function main() {
  // Generate random keypair to simulate a private key
  const keypair = Keypair.generate();
  console.log("Original private key:", keypair.secretKey);

  const password = window.crypto.getRandomValues(new Uint8Array(10)).toString();

  // Store encrypted key
  const { encrypted, iv, pda } = await storeEncryptedKey(password, keypair.secretKey);

  // Retrieve & decrypt
  const decryptedKey = await retrieveEncryptedKey(pda, password, encrypted, iv);

  console.log("Match:", Buffer.from(keypair.secretKey).toString("hex") === Buffer.from(decryptedKey).toString("hex"));
}

main().catch(console.error);
