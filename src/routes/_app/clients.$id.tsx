import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { fmtBRL } from "@/lib/format";
import { OpportunityDrawer } from "@/components/crm/OpportunityDrawer";
import { EditClientActions } from "@/components/crm/EditClientDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagSelector } from "@/components/tags/TagSelector";
import { DocumentUpload } from "@/components/DocumentUpload";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PipelineProgress } from "@/components/PipelineProgress";
import { useAutoTags } from "@/hooks/useAutoTags";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
import { validateDocument, detectDocumentType } from "@/lib/documentValidation";
import { logAudit } from "@/lib/audit";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/clients/$id")({
  component: ClientDetail,
});

const STATUS_VALUES = ["ativo", "inativo", "em_analise", "aprovado", "perdido", "stand_by"] as const;

function ClientDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { profile } = useAuth();
  const perms = usePermissions();
  const [oppId, setOppId] = useState<string | null>(null);
  useAutoTags(id);

  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: async () =>
      (await supabase.from("clients").select("*, partners(nome,id)").eq("id", id).maybeSingle()).data,
  });
  const { data: opps = [] } = useQuery({
    queryKey: ["client-opps", id],
    queryFn: async () =>
      (await supabase
        .from("opportunities")
        .select("*, pipeline_stages(nome,cor,percentual_progresso,sla_dias)")
        .eq("cliente_id", id)).data ?? [],
  });
  const { data: activities = [] } = useQuery({
    queryKey: ["client-acts", id],
    queryFn: async () =>
      (await supabase
        .from("activities")
        .select("*, user_profiles(nome)")
        .eq("client_id", id)
        .order("data_atividade", { ascending: false })).data ?? [],
  });
  const { data: history = [] } = useQuery({
    queryKey: ["client-status-history", id],
    queryFn: async () =>
      (await supabase
        .from("client_status_history")
        .select("*, user_profiles(nome)")
        .eq("client_id", id)
        .order("created_at", { ascending: false })).data ?? [],
  });
  const { data: logs = [] } = useQuery({
    queryKey: ["client-audit", id],
    queryFn: async () =>
      (await supabase
        .from("audit_logs")
        .select("*, user_profiles(nome)")
        .eq("entidade", "clients")
        .eq("entidade_id", id)
        .order("created_at", { ascending: false })
        .limit(50)).data ?? [],
  });

  const statusMut = useMutation({
    mutationFn: async (newStatus: string) => {
      const oldStatus = client?.status ?? null;
      await supabase.from("clients").update({ status: newStatus }).eq("id", id);
      await supabase.from("client_status_history").insert({
        client_id: id,
        status_anterior: oldStatus,
        status_novo: newStatus,
        alterado_por: profile?.id ?? null,
      });
      await logAudit({
        userId: profile?.id,
        acao: "alteracao_status",
        entidade: "clients",
        entidadeId: id,
        anteriores: { status: oldStatus },
        novos: { status: newStatus },
      });
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["client", id] });
      qc.invalidateQueries({ queryKey: ["client-status-history", id] });
      qc.invalidateQueries({ queryKey: ["client-audit", id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const docType = client?.cpf_cnpj ? detectDocumentType(client.cpf_cnpj) : "unknown";
  const docValid = client?.cpf_cnpj ? validateDocument(client.cpf_cnpj) : null;

  const today = new Date().toISOString().slice(0, 10);
  const overdue = activities.filter((a: any) => a.data_agendada && a.data_agendada < today && a.status_atividade !== "concluida");
  const upcoming = activities.filter((a: any) => a.data_agendada && a.data_agendada >= today && a.status_atividade !== "concluida");
  const past = activities.filter((a: any) => a.status_atividade === "concluida" || (!a.data_agendada && !upcoming.includes(a) && !overdue.includes(a)));

  return (
    <div className="p-8 space-y-6">
      <Link to="/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif">{client?.nome ?? "—"}</h1>
          <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2 items-center">
            <span className="capitalize">{client?.tipo_cliente}</span>
            {client?.partners?.nome && (<><span>·</span><span>via {client.partners.nome}</span></>)}
            {client?.email && (<><span>·</span><span>{client.email}</span></>)}
            {client?.telefone && <WhatsAppButton telefone={client.telefone} variant="icon" />}
          </div>
        </div>
        {perms.canChangeStatus && <EditClientActions client={client} />}
      </div>

      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="opps">Oportunidades</TabsTrigger>
          <TabsTrigger value="acts">Atividades</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="hist">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border rounded-xl p-5 space-y-3 text-sm">
              <h3 className="font-serif text-lg">Dados</h3>
              <Row label="Nome" value={client?.nome} />
              <Row
                label="CPF/CNPJ"
                value={
                  <span className="flex items-center gap-2">
                    {client?.cpf_cnpj || "—"}
                    {client?.cpf_cnpj && docType !== "unknown" && (
                      docValid
                        ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                        : <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </span>
                }
              />
              <Row
                label="Telefone"
                value={
                  <span className="flex items-center gap-2">
                    {client?.telefone || "—"}
                    {client?.telefone && <WhatsAppButton telefone={client.telefone} variant="icon" />}
                  </span>
                }
              />
              <Row label="Email" value={client?.email ?? "—"} />
              <Row label="Patrimônio" value={fmtBRL(client?.patrimonio_estimado)} />
              {client?.razao_social && <Row label="Razão social" value={client.razao_social} />}
              {client?.cidade && <Row label="Cidade/UF" value={`${client.cidade}${client.estado ? "/" + client.estado : ""}`} />}
            </div>
            <div className="bg-card border rounded-xl p-5 space-y-4 text-sm">
              <h3 className="font-serif text-lg">Status & Etiquetas</h3>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Status:</span>
                {perms.canChangeStatus ? (
                  <Select value={client?.status ?? "ativo"} onValueChange={(v) => statusMut.mutate(v)}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_VALUES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="capitalize">{client?.status}</span>
                )}
              </div>
              <div>
                <div className="text-muted-foreground mb-2">Etiquetas</div>
                <TagSelector entityId={id} entityType="client" />
              </div>
              {history.length > 0 && (
                <div>
                  <div className="text-muted-foreground mb-2 text-xs uppercase tracking-wide">Histórico de status</div>
                  <ul className="space-y-1 text-xs max-h-32 overflow-y-auto">
                    {history.map((h: any) => (
                      <li key={h.id} className="flex justify-between border-b border-border/40 py-1">
                        <span>{h.status_anterior ?? "—"} → <strong>{h.status_novo}</strong></span>
                        <span className="text-muted-foreground">
                          {h.user_profiles?.nome ?? "—"} · {new Date(h.created_at).toLocaleString("pt-BR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="opps" className="space-y-3">
          {opps.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma oportunidade.</p>}
          {opps.map((o: any) => (
            <div key={o.id} className="bg-card border rounded-xl p-4 space-y-3">
              <button onClick={() => setOppId(o.id)} className="w-full text-left">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{o.titulo}</span>
                  <span className="text-primary font-serif">{fmtBRL(o.valor_estimado)}</span>
                </div>
              </button>
              <PipelineProgress etapaId={o.etapa_id} updatedAt={o.updated_at} />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="acts" className="space-y-4">
          <ActGroup title="🔴 Atrasadas" acts={overdue} />
          <ActGroup title="🟡 Próximas" acts={upcoming} />
          <ActGroup title="✅ Histórico" acts={past} collapsed />
        </TabsContent>

        <TabsContent value="docs">
          <DocumentUpload clientId={id} />
        </TabsContent>

        <TabsContent value="hist">
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-serif text-lg mb-3">Auditoria</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-slim text-sm">
              {logs.length === 0 && <p className="text-muted-foreground">Sem registros.</p>}
              {logs.map((l: any) => (
                <div key={l.id} className="border-l-2 border-primary/40 pl-3">
                  <div className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleString("pt-BR")} · {l.user_profiles?.nome ?? "—"}
                  </div>
                  <div className="capitalize">{l.acao.replace(/_/g, " ")}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <OpportunityDrawer oppId={oppId} open={!!oppId} onClose={() => setOppId(null)} />
    </div>
  );
}

function ActGroup({ title, acts, collapsed = false }: { title: string; acts: any[]; collapsed?: boolean }) {
  const [open, setOpen] = useState(!collapsed);
  return (
    <div className="bg-card border rounded-xl p-4">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{acts.length}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {acts.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          {acts.map((a: any) => (
            <div key={a.id} className="text-sm border-l-2 border-primary/40 pl-3">
              <div className="text-xs text-muted-foreground">
                {a.data_agendada ? new Date(a.data_agendada).toLocaleDateString("pt-BR") : new Date(a.data_atividade).toLocaleString("pt-BR")} · {a.tipo_atividade}
              </div>
              <div>{a.titulo || a.descricao || "—"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b border-border py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span>{typeof value === "string" || typeof value === "number" ? value : value}</span>
    </div>
  );
}
