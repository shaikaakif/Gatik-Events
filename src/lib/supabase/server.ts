import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/env";
import { getCurrentAccount } from "@/lib/auth/session";
import { mintDatabaseAccessToken } from "@/lib/auth/jwt";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    this.name = "SupabaseConfigurationError";
  }
}

export async function createSupabaseServerClient() {
  const config = getPublicSupabaseConfig();
  if (!config) throw new SupabaseConfigurationError();

  const account = await getCurrentAccount();
  const accessToken = account ? await mintDatabaseAccessToken(account.id) : undefined;
  return createClient(config.url, config.anonKey, {
    ...(accessToken ? { accessToken: async () => accessToken } : {}),
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
