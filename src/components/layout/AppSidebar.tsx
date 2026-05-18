import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, KanbanSquare, Handshake, Users, Briefcase, ListChecks, UserCog, Settings, LogOut, Copy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/lisboa-capital-logo.png";

const main = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/crm", label: "CRM Kanban", icon: KanbanSquare },
  { to: "/partners", label: "Parceiros", icon: Handshake },
  { to: "/clients", label: "Clientes", icon: Users },
  { to: "/opportunities", label: "Oportunidades", icon: Briefcase },
  { to: "/activities", label: "Atividades", icon: ListChecks },
] as const;

const masterMain = [
  { to: "/clients/duplicates", label: "Duplicidades", icon: Copy },
] as const;

const masterOnly = [
  { to: "/users", label: "Usuários", icon: UserCog },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isMaster = profile?.tipo_usuario === "master";

  const itemCls = (active: boolean) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-colors ${
      active
        ? "bg-primary/10 text-primary border-l-2 border-primary -ml-[2px]"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }`;

  return (
    <aside className="w-60 shrink-0 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-border">
        <img src={logo} alt="LC" className="w-10 h-10 object-contain" />
        <div>
          <div className="font-serif text-base leading-tight">Lisboa Capital</div>
          <div className="text-[10px] tracking-widest text-primary/70">PRIVATE</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5 scrollbar-slim">
        {main.map((i) => {
          const Icon = i.icon;
          const active = path === i.to || path.startsWith(i.to + "/");
          return (
            <Link key={i.to} to={i.to} className={itemCls(active)}>
              <Icon className="w-4 h-4" />
              <span>{i.label}</span>
            </Link>
          );
        })}

        {isMaster && (
          <>
            <div className="mt-4 px-4 pb-1 pt-3 text-[10px] tracking-widest text-muted-foreground uppercase">
              Administração
            </div>
            {masterMain.map((i) => {
              const Icon = i.icon;
              const active = path === i.to;
              return (
                <Link key={i.to} to={i.to} className={itemCls(active)}>
                  <Icon className="w-4 h-4" />
                  <span>{i.label}</span>
                </Link>
              );
            })}
            {masterOnly.map((i) => {
              const Icon = i.icon;
              const active = path === i.to;
              return (
                <Link key={i.to} to={i.to} className={itemCls(active)}>
                  <Icon className="w-4 h-4" />
                  <span>{i.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
            {profile?.nome?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{profile?.nome ?? "—"}</div>
            <div className="text-[10px] uppercase tracking-wider text-primary/70">
              {profile?.tipo_usuario ?? ""}
            </div>
          </div>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
            className="text-muted-foreground hover:text-destructive p-1.5"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
