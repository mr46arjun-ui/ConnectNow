/**
 * Helpers for password-based authentication.
 * Uses argon2id (memory-hard). Hash format: $argon2id$v=19$m=...
 */
import argon2 from "argon2";

const HASH_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB - OWASP minimum
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, HASH_OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

// Password policy: min 8 chars, at least 1 letter and 1 number.
export function passwordIsStrongEnough(pw: string): boolean {
  if (typeof pw !== "string" || pw.length < 8 || pw.length > 128) return false;
  return /[A-Za-z]/.test(pw) && /\d/.test(pw);
}
