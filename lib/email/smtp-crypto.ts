import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function keyBytes() {
  const secret = process.env.SMTP_SECRET_KEY?.trim();
  if (!secret || secret.length < 32) {
    return null;
  }
  return createHash("sha256").update(secret).digest();
}

/** Encrypt plaintext SMTP password for DB storage. No-op if key missing (dev). */
export function encryptSmtpPass(plaintext: string): string {
  const value = plaintext.trim();
  if (!value) return "";
  if (value.startsWith(PREFIX)) return value;

  const key = keyBytes();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SMTP_SECRET_KEY is required in production to store email passwords.",
      );
    }
    return value;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX +
    Buffer.concat([iv, tag, encrypted]).toString("base64url")
  );
}

/** Decrypt stored value; returns plaintext for legacy unencrypted rows. */
export function decryptSmtpPass(stored: string): string {
  const value = stored.trim();
  if (!value) return "";
  if (!value.startsWith(PREFIX)) return value;

  const key = keyBytes();
  if (!key) {
    throw new Error("SMTP_SECRET_KEY is required to decrypt the saved password.");
  }

  const raw = Buffer.from(value.slice(PREFIX.length), "base64url");
  if (raw.length < 12 + 16 + 1) {
    throw new Error("Saved email password is corrupt.");
  }
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

export function isEncryptedSmtpPass(stored: string) {
  return stored.trim().startsWith(PREFIX);
}
