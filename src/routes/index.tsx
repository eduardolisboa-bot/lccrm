import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { TENANTS, isTenantConfigured, type TenantId } from "@/tenants/config";
import { useTenant } from "@/lib/tenant-context";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Selecionar sistema — CRM Lisboa Capital" },
      { name: "description", content: "Escolha o sistema que deseja acessar: Lisboa Capital, Epic ou Hope Capital." },
      { property: "og:title", content: "Selecionar sistema — CRM" },
      { property: "og:description", content: "Acesso unificado aos CRMs Lisboa Capital, Epic e Hope Capital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SystemSelect,
});

function SystemSelect() {
  const navigate = useNavigate();
  const { availableTenants, switchTenant, refreshAvailability } = useTenant();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void refreshAvailability().finally(() => setReady(true));
  }, [refreshAvailability]);

  const go = (id: TenantId) => {
    switchTenant(id);
    const logged = availableTenants.some((t) => t.id === id);
    navigate({ to: logged ? "/dashboard" : "/login", search: logged ? undefined : { system: id } });
  };

  return (
    <div className="min-h-screen bg-noise px-4 py-16">
      <ThemeToggle floating />
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="font-serif text-4xl">Escolha o sistema</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cada sistema possui base de dados e usuários totalmente independentes.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-3">
          {TENANTS.map((t) => {
            const configured = isTenantConfigured(t);
            const logged = ready && availableTenants.some((a) => a.id === t.id);
            return (
              <button
                key={t.id}
                disabled={!configured}
                onClick={() => go(t.id)}
                className="group flex flex-col items-center gap-4 rounded-xl border border-border bg-card/80 p-8 text-center shadow-lg backdrop-blur transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <img src={t.branding.logoDark} alt={t.name} className="h-20 w-20 object-contain" />
                <div>
                  <div className="font-serif text-lg">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.domain}</div>
                </div>
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {!configured ? (
                    <span className="inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Em breve
                    </span>
                  ) : logged ? (
                    "Sessão ativa"
                  ) : (
                    "Entrar"
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
