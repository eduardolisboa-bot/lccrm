import { getTenantClient, type TypedSupabase } from "@/lib/supabaseClients";
import { DEFAULT_TENANT_ID, type TenantId } from "@/tenants/config";

const STORAGE_KEY = "crm.activeTenant";

let activeId: TenantId = DEFAULT_TENANT_ID;

export function getActiveTenantId(): TenantId {
  return activeId;
}

export function setActiveTenantId(id: TenantId) {
  activeId = id;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
}

export function readStoredTenantId(): TenantId | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "lisboa" || v === "epic" || v === "hope" ? v : null;
}

export function getSupabase(): TypedSupabase {
  return getTenantClient(activeId);
}

/**
 * Drop-in replacement for the generated client: always proxies to the client
 * of the ACTIVE system, so no module can accidentally read the wrong database.
 */
export const supabase = new Proxy({} as TypedSupabase, {
  get(_t, prop, receiver) {
    return Reflect.get(getSupabase(), prop, receiver);
  },
});
