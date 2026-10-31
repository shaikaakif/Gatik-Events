import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
} as const;

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function keyedHash(value: string) {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SESSION_SECRET is not configured.");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function hashPassword(password: string) {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
