import { useEffect, useRef, useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { useTenant } from "@/lib/tenant-context";
import { TenantLoginDialog } from "@/components/tenant/TenantLoginDialog";
import { TENANTS, type TenantId } from "@/tenants/config";

export function TenantSwitcher({ variant = "compact" }: { variant?: "compact" | "brand" }) {
  const { activeTenant, availableTenants, switchTenant } = useTenant();
  const [open, setOpen] = useState(false);
  const [loginFor, setLoginFor] = useState<TenantId | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const others = TENANTS.filter((t) => t.id !== activeTenant.id);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className={
          variant === "brand"
            ? "flex w-full items-center gap-3 rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/50"
            : "flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
        }
      >
        {variant === "brand" ? (
          <>
            <div className="logo-plate">
              <img src={activeTenant.branding.logoDark} alt={activeTenant.name} className="h-10 w-10 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-serif text-base leading-tight">{activeTenant.name}</div>
              <div className="text-[10px] tracking-widest text-primary/70">PRIVATE</div>
            </div>
          </>
        ) : (
          <>
            <img src={activeTenant.branding.logoDark} alt="" className="h-5 w-5 rounded object-contain" />
            <span className="flex-1 truncate text-left">{activeTenant.name}</span>
          </>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-md border border-border bg-card p-1 shadow-lg">
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
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
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
          onSuccess={(id: TenantId) => {
            setLoginFor(null);
            switchTenant(id);
          }}
        />
      )}
    </div>
  );
}
