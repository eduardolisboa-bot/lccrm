import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase as baseClient } from "@/integrations/supabase/client";
import { TENANTS, type TenantId } from "@/tenants/config";

export type TypedSupabase = SupabaseClient<Database>;

const cache = new Map<TenantId, TypedSupabase>();

type AnyRec = Record<string, unknown>;

function withTenant(values: unknown, tenant: TenantId): unknown {
  if (Array.isArray(values)) return values.map((v) => ({ ...(v as AnyRec), tenant }));
  if (values && typeof values === "object") return { ...(values as AnyRec), tenant };
  return values;
}

/** user_profiles guarda a lista de sistemas do usuário em `tenants`. */
function scopeProfiles(qb: any, tenant: TenantId) {
  return new Proxy(qb, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      switch (prop) {
        case "select":
          return (...args: unknown[]) => target.select(...args).contains("tenants", [tenant]);
        case "insert":
          return (values: unknown, ...rest: unknown[]) => {
            const stamp = (v: AnyRec) => ({ tenants: [tenant], ...v });
            const next = Array.isArray(values)
              ? (values as AnyRec[]).map(stamp)
              : stamp(values as AnyRec);
            return target.insert(next, ...rest);
          };
        default:
          return value.bind(target);
      }
    },
  });
}

/** Wraps a PostgREST table builder so every read/write is scoped to the system. */
function scopeTable(qb: any, tenant: TenantId) {
  return new Proxy(qb, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      switch (prop) {
        case "select":
          return (...args: unknown[]) => target.select(...args).eq("tenant", tenant);
        case "update":
          return (...args: unknown[]) => target.update(...args).eq("tenant", tenant);
        case "delete":
          return (...args: unknown[]) => target.delete(...args).eq("tenant", tenant);
        case "insert":
          return (values: unknown, ...rest: unknown[]) =>
            target.insert(withTenant(values, tenant), ...rest);
        case "upsert":
          return (values: unknown, ...rest: unknown[]) =>
            target.upsert(withTenant(values, tenant), ...rest);
        default:
          return value.bind(target);
      }
    },
  });
}

/**
 * Single unified backend, three isolated data sets.
 * Every query made through a tenant client is automatically filtered by
 * (and stamped with) the system it belongs to, so data never crosses over.
 */
export function getTenantClient(id: TenantId): TypedSupabase {
  const cached = cache.get(id);
  if (cached) return cached;

  const client = new Proxy(baseClient as unknown as TypedSupabase, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) =>
          table === "user_profiles"
            ? scopeProfiles((target as any).from(table), id)
            : scopeTable((target as any).from(table), id);
      }
      const value = Reflect.get(target as object, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as TypedSupabase;

  cache.set(id, client);
  return client;
}

export function configuredTenants() {
  return TENANTS;
}
