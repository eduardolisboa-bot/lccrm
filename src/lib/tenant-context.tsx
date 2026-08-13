import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getTenantClient, type TypedSupabase } from "@/lib/supabaseClients";
import { getActiveTenantId, readStoredTenantId, setActiveTenantId } from "@/lib/supabase-active";
import { TENANTS, getTenant, isTenantConfigured, type Tenant, type TenantId } from "@/tenants/config";

interface TenantCtx {
  activeTenant: Tenant;
  availableTenants: Tenant[];
  configuredTenants: Tenant[];
  switchTenant: (id: TenantId) => void;
  supabase: TypedSupabase;
  refreshAvailability: () => Promise<void>;
}

const Ctx = createContext<TenantCtx | undefined>(undefined);

async function hasSession(id: TenantId) {
  try {
    const { data } = await getTenantClient(id).auth.getSession();
    return Boolean(data.session);
  } catch {
    return false;
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<TenantId>(getActiveTenantId());
  const [availableIds, setAvailableIds] = useState<TenantId[]>([]);

  const configured = useMemo(() => TENANTS.filter(isTenantConfigured), []);

  const refreshAvailability = useCallback(async () => {
    const results = await Promise.all(
      configured.map(async (t) => ((await hasSession(t.id)) ? t.id : null)),
    );
    setAvailableIds(results.filter(Boolean) as TenantId[]);
  }, [configured]);

  useEffect(() => {
    const stored = readStoredTenantId();
    if (stored && stored !== activeId && isTenantConfigured(getTenant(stored))) {
      setActiveTenantId(stored);
      setActiveId(stored);
    }
    void refreshAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTenant = getTenant(activeId);

  // Apply the active brand colors to the document root.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const b = activeTenant.branding;
    const c = (v: string) => (v.trim().startsWith("hsl") || v.includes("(") ? v : `hsl(${v})`);
    root.style.setProperty("--color-primary", c(b.primary));
    root.style.setProperty("--color-primary-hover", c(b.primaryHover));
    root.style.setProperty("--color-secondary", c(b.secondary));
    root.style.setProperty("--color-accent", c(b.accent));
    root.style.setProperty("--primary", c(b.primary));
    root.style.setProperty("--ring", c(b.primary));
    root.style.setProperty("--sidebar-primary", c(b.primary));
    root.dataset["tenant"] = activeTenant.id;
    document.title = `${activeTenant.name} — CRM`;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = activeTenant.branding.favicon;
  }, [activeTenant]);

  const switchTenant = useCallback(
    (id: TenantId) => {
      setActiveTenantId(id);
      setActiveId(id);
      queryClient.clear();
    },
    [queryClient],
  );

  const value: TenantCtx = {
    activeTenant,
    availableTenants: configured.filter((t) => availableIds.includes(t.id)),
    configuredTenants: configured,
    switchTenant,
    supabase: getTenantClient(activeId),
    refreshAvailability,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTenant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTenant must be inside TenantProvider");
  return ctx;
}

/** Supabase client of the ACTIVE system. */
export function useSupabase() {
  return useTenant().supabase;
}
