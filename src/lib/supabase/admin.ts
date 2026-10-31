import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/env";

export function createSupabaseAdminClient() {
  const config = getPublicSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceRoleKey) {
    throw new Error("Supabase admin access is not configured.");
  }
  return createClient(config.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
