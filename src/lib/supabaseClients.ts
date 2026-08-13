import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase as lisboaClient } from "@/integrations/supabase/client";
import { TENANTS, getTenant, isTenantConfigured, type TenantId } from "@/tenants/config";

export type TypedSupabase = SupabaseClient<Database>;

const cache = new Map<TenantId, TypedSupabase>();

/**
 * One Supabase client per system, created once.
 * Each non-hub client uses its own auth.storageKey so sessions never overwrite
 * each other in localStorage when the user switches systems.
 */
export function getTenantClient(id: TenantId): TypedSupabase {
  // Lisboa keeps using the generated client (same storage key as today) so
  // existing sessions and behaviour are untouched.
  if (id === "lisboa") return lisboaClient as unknown as TypedSupabase;

  const cached = cache.get(id);
  if (cached) return cached;

  const tenant = getTenant(id);
  if (!isTenantConfigured(tenant)) {
    throw new Error(`Sistema "${tenant.name}" ainda não está configurado.`);
  }

  const client = createClient<Database>(tenant.supabaseUrl, tenant.supabaseAnonKey, {
    auth: {
      storageKey: `sb-${id}-auth`,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  cache.set(id, client);
  return client;
}

export function configuredTenants() {
  return TENANTS.filter(isTenantConfigured);
}
