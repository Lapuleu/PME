import * as crypto from "crypto";

// AES-256-CBC encryption
function encryptPrivateKey(privateKey: Uint8Array, password: string): { iv: string, encrypted: string } {
  const iv = crypto.randomBytes(16); // Initialization vector
  const key = crypto.createHash("sha256").update(password).digest(); // derive 32-byte key

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(privateKey);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return { iv: iv.toString("hex"), encrypted: encrypted.toString("hex") };
}

function decryptPrivateKey(encryptedHex: string, ivHex: string, password: string): Uint8Array {
  const key = crypto.createHash("sha256").update(password).digest();
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return new Uint8Array(decrypted);
}
