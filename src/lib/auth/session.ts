import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createOpaqueToken, hashToken } from "@/lib/auth/crypto";

export const SESSION_COOKIE = "gatik_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

export type AppAccount = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  email_verified_at: string | null;
  status: "active" | "suspended" | "disabled";
};

export const getCurrentAccount = cache(async (): Promise<AppAccount | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const admin = createSupabaseAdminClient();
  const { data: session } = await admin
    .from("auth_sessions")
    .select("id, user_id, expires_at, revoked_at")
    .eq("token_hash", hashToken(token))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!session) return null;

  const { data: account } = await admin
    .from("app_users")
    .select("id, email, full_name, phone, email_verified_at, status")
    .eq("id", session.user_id)
    .eq("status", "active")
    .not("email_verified_at", "is", null)
    .maybeSingle();
  return account as AppAccount | null;
});

export async function createAppSession(userId: string) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("auth_sessions").insert({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error("Could not create a secure session.");

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createSupabaseAdminClient();
    await admin.from("auth_sessions").update({ revoked_at: new Date().toISOString() }).eq("token_hash", hashToken(token));
  }
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
