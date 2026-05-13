import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { FunnelSwitcher } from "@/components/crm/FunnelSwitcher";
import { useFunnel } from "@/lib/funnel-context";
import { OpportunityDrawer } from "@/components/crm/OpportunityDrawer";
import { EditPartnerActions } from "@/components/crm/EditPartnerDialog";
import { fmtBRL, fmtNum } from "@/lib/format";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/partners/$id")({
  component: PartnerDetail,
});

function PartnerDetail() {
  const { id } = Route.useParams();
  const { profile } = useAuth();
  const isMaster = profile?.tipo_usuario === "master";
  const [oppId, setOppId] = useState<string | null>(null);

  const { data: partner } = useQuery({
    queryKey: ["partner", id],
    queryFn: async () => (await supabase.from("partners").select("*, user_profiles(nome)").eq("id", id).maybeSingle()).data,
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["partner-clients", id],
    queryFn: async () => (await supabase.from("clients").select("*").eq("parceiro_id", id)).data ?? [],
  });
  const { data: opps = [] } = useQuery({
    queryKey: ["partner-opps", id],
    queryFn: async () => (await supabase.from("opportunities").select("*, pipeline_stages(tipo)").eq("parceiro_id", id)).data ?? [],
  });

  const pipeline = opps.reduce((s: number, o: any) => s + Number(o.valor_estimado ?? 0), 0);
  const aprov = opps.filter((o: any) => o.pipeline_stages?.tipo === "ganha").length;
  const conv = opps.length > 0 ? (aprov / opps.length) * 100 : 0;

  return (
    <div className="p-8 space-y-6">
      <Link to="/partners" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif">{partner?.nome ?? "—"}</h1>
          <div className="flex gap-2 text-xs text-muted-foreground mt-2">
            <span className="capitalize">{partner?.tipo?.replace(/_/g," ")}</span>
            <span>·</span>
            <span>Resp: {(partner as any)?.user_profiles?.nome ?? "—"}</span>
            <span>·</span>
            <span>Comissão: {partner?.comissao ?? 0}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs uppercase tracking-wider px-3 py-1 rounded ${partner?.status === "ativo" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{partner?.status}</span>
          {isMaster && <EditPartnerActions partner={partner} />}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Clientes" value={fmtNum(clients.length)} />
        <Kpi label="Pipeline" value={fmtBRL(pipeline)} accent="gold-gradient-text" />
        <Kpi label="Aprovados" value={fmtNum(aprov)} />
        <Kpi label="Conversão" value={`${conv.toFixed(1)}%`} />
      </div>

      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-serif text-lg mb-3">Clientes vinculados</h3>
        <div className="divide-y divide-border">
          {clients.length === 0 && <p className="text-sm text-muted-foreground py-3">Nenhum cliente.</p>}
          {clients.map((c: any) => (
            <Link key={c.id} to="/clients/$id" params={{ id: c.id }} className="flex items-center justify-between py-2.5 hover:bg-muted/30 px-2 -mx-2 rounded">
              <span>{c.nome}</span>
              <span className="text-xs text-muted-foreground">{fmtBRL(c.patrimonio_estimado)}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg">Pipeline do parceiro</h3>
          <FunnelSwitcher />
        </div>
        <PartnerKanbanWrapper partnerId={id} onCardClick={setOppId} />
      </div>

      <OpportunityDrawer oppId={oppId} open={!!oppId} onClose={() => setOppId(null)} />
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-serif mt-1 ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
