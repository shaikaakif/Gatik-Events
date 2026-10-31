import "server-only";

import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { keyedHash } from "@/lib/auth/crypto";

export async function enforceAuthRateLimit(scope: string, identity: string, limit = 8, windowMinutes = 15) {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const keyHash = keyedHash(`${identity.toLowerCase()}:${forwarded}`);
  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count } = await admin
    .from("auth_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("scope", scope)
    .eq("key_hash", keyHash)
    .gte("attempted_at", since);
  if ((count ?? 0) >= limit) return false;
  await admin.from("auth_rate_limits").insert({ scope, key_hash: keyHash });
  return true;
}
