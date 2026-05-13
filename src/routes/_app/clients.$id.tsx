import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { fmtBRL } from "@/lib/format";
import { OpportunityDrawer } from "@/components/crm/OpportunityDrawer";
import { EditClientActions } from "@/components/crm/EditClientDialog";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/clients/$id")({
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();
  const { profile } = useAuth();
  const canEdit = profile?.tipo_usuario === "master" || profile?.tipo_usuario === "interno";
  const [oppId, setOppId] = useState<string | null>(null);

  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => (await supabase.from("clients").select("*, partners(nome,id)").eq("id", id).maybeSingle()).data,
  });
  const { data: opps = [] } = useQuery({
    queryKey: ["client-opps", id],
    queryFn: async () => (await supabase.from("opportunities").select("*, pipeline_stages(nome,cor)").eq("cliente_id", id)).data ?? [],
  });
  const { data: activities = [] } = useQuery({
    queryKey: ["client-acts", id],
    queryFn: async () => (await supabase.from("activities").select("*, user_profiles(nome)").eq("client_id", id).order("data_atividade", { ascending: false })).data ?? [],
  });

  return (
    <div className="p-8 space-y-6">
      <Link to="/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif">{client?.nome ?? "—"}</h1>
          <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
            <span className="capitalize">{client?.tipo_cliente}</span>
            {client?.partners?.nome && (<><span>·</span><span>via {client.partners.nome}</span></>)}
            {client?.email && (<><span>·</span><span>{client.email}</span></>)}
          </div>
        </div>
        {canEdit && <EditClientActions client={client} />}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-5 md:col-span-1 space-y-3 text-sm">
          <h3 className="font-serif text-lg">Dados</h3>
          <Row label="CPF/CNPJ" value={client?.cpf_cnpj ?? "—"} />
          <Row label="Telefone" value={client?.telefone ?? "—"} />
          <Row label="Patrimônio" value={fmtBRL(client?.patrimonio_estimado)} />
        </div>

        <div className="bg-card border rounded-xl p-5 md:col-span-2">
          <h3 className="font-serif text-lg mb-3">Oportunidades</h3>
          <div className="space-y-2">
            {opps.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma oportunidade.</p>}
            {opps.map((o: any) => (
              <button key={o.id} onClick={() => setOppId(o.id)} className="w-full text-left bg-background border rounded-lg p-3 hover:border-primary/40">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{o.titulo}</span>
                  <span className="text-primary text-sm font-serif">{fmtBRL(o.valor_estimado)}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: o.pipeline_stages?.cor }}>{o.pipeline_stages?.nome}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-serif text-lg mb-3">Timeline</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-slim">
          {activities.length === 0 && <p className="text-sm text-muted-foreground">Sem atividades.</p>}
          {activities.map((a: any) => (
            <div key={a.id} className="border-l-2 border-primary/40 pl-3 text-sm">
              <div className="text-xs text-muted-foreground">{new Date(a.data_atividade).toLocaleString("pt-BR")} · {a.user_profiles?.nome}</div>
              <div>{a.descricao}</div>
            </div>
          ))}
        </div>
      </div>

      <OpportunityDrawer oppId={oppId} open={!!oppId} onClose={() => setOppId(null)} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b border-border py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span>{String(value)}</span>
    </div>
  );
}
