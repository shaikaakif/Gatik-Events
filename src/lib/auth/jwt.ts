import "server-only";

import { importJWK, SignJWT, type JWK } from "jose";

export async function mintDatabaseAccessToken(userId: string) {
  const rawKey = process.env.AUTH_JWT_PRIVATE_KEY?.trim();
  const keyId = process.env.AUTH_JWT_KEY_ID?.trim();
  if (!rawKey || !keyId) throw new Error("Custom JWT signing is not configured.");

  let jwk: JWK;
  try {
    jwk = JSON.parse(rawKey) as JWK;
  } catch {
    throw new Error("AUTH_JWT_PRIVATE_KEY must be a valid private JWK JSON value.");
  }
  const privateKey = await importJWK(jwk, "ES256");
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
}
