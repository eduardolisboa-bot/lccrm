import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { useTenant } from "@/lib/tenant-context";
import { TenantLoginDialog } from "@/components/tenant/TenantLoginDialog";
import type { TenantId } from "@/tenants/config";

export function TenantSwitcher() {
  const { activeTenant, availableTenants, configuredTenants, switchTenant } = useTenant();
  const [open, setOpen] = useState(false);
  const [loginFor, setLoginFor] = useState<TenantId | null>(null);

  const others = configuredTenants.filter((t) => t.id !== activeTenant.id);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
      >
        <img src={activeTenant.branding.logoDark} alt="" className="h-5 w-5 rounded object-contain" />
        <span className="flex-1 truncate text-left">{activeTenant.name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-md border border-border bg-card p-1 shadow-lg">
          {others.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum outro sistema configurado</div>
          )}
          {others.map((t) => {
            const logged = availableTenants.some((a) => a.id === t.id);
            return (
              <button
                key={t.id}
                onClick={() => {
                  setOpen(false);
                  if (logged) switchTenant(t.id);
                  else setLoginFor(t.id);
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted/50"
              >
                <img src={t.branding.logoDark} alt="" className="h-5 w-5 rounded object-contain" />
                <span className="flex-1 truncate text-left">{t.name}</span>
                {!logged && <Lock className="h-3 w-3 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
      )}

      {loginFor && (
        <TenantLoginDialog
          tenantId={loginFor}
          onClose={() => setLoginFor(null)}
          onSuccess={(id) => {
            setLoginFor(null);
            switchTenant(id);
          }}
        />
      )}
    </div>
  );
}
