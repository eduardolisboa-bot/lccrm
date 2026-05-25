import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fmtBRL } from "@/lib/format";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  oppId: string | null;
  open: boolean;
  onClose: () => void;
}

export function OpportunityDrawer({ oppId, open, onClose }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [activityText, setActivityText] = useState("");

  const { data: opp } = useQuery({
    queryKey: ["opp", oppId],
    enabled: !!oppId,
    queryFn: async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("*, clients(nome,id), partners(nome,id), pipeline_stages(nome,cor,id), user_profiles!opportunities_responsavel_id_fkey(nome)")
        .eq("id", oppId!)
        .maybeSingle();
      return data;
    },
  });
  const { data: stages = [] } = useQuery({
    queryKey: ["stages-all"],
    queryFn: async () => (await supabase.from("pipeline_stages").select("*").eq("ativa", true).order("ordem")).data ?? [],
  });
  const { data: clientsList = [] } = useQuery({
    queryKey: ["clients-lookup"],
    queryFn: async () => (await supabase.from("clients").select("id,nome").order("nome")).data ?? [],
  });
  const { data: partnersList = [] } = useQuery({
    queryKey: ["partners-lookup"],
    queryFn: async () => (await supabase.from("partners").select("id,nome").order("nome")).data ?? [],
  });
  const { data: profilesList = [] } = useQuery({
    queryKey: ["profiles-lookup"],
    queryFn: async () => (await supabase.from("user_profiles").select("id,nome").eq("status", "ativo").order("nome")).data ?? [],
  });
  const { data: funnelsList = [] } = useQuery({
    queryKey: ["funnels-lookup"],
    queryFn: async () => (await supabase.from("funnels").select("id,nome").eq("ativo", true).order("ordem")).data ?? [],
  });
  const stagesForFunnel = (fid: string | null | undefined) =>
    stages.filter((s: any) => !fid || s.funnel_id === fid);
  const { data: activities = [] } = useQuery({
    queryKey: ["activities", oppId],
    enabled: !!oppId,
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("*, user_profiles(nome)")
        .eq("opportunity_id", oppId!)
        .order("data_atividade", { ascending: false });
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async (patch: any) => {
      const { error } = await supabase.from("opportunities").update(patch).eq("id", oppId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opp", oppId] });
      qc.invalidateQueries({ queryKey: ["opps"] });
      qc.invalidateQueries({ queryKey: ["opps-all"] });
      toast.success("Atualizado");
      setEditing(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addActivity = useMutation({
    mutationFn: async () => {
      if (!activityText.trim()) return;
      const { data: u } = await supabase.auth.getUser();
      const { data: prof } = await supabase.from("user_profiles").select("id").eq("auth_user_id", u.user!.id).maybeSingle();
      const { error } = await supabase.from("activities").insert({
        opportunity_id: oppId,
        client_id: opp?.cliente_id,
        user_id: prof?.id,
        tipo_atividade: "nota",
        descricao: activityText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setActivityText("");
      qc.invalidateQueries({ queryKey: ["activities", oppId] });
      toast.success("Atividade adicionada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("opportunities").delete().eq("id", oppId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opps"] });
      qc.invalidateQueries({ queryKey: ["opps-all"] });
      toast.success("Oportunidade removida");
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-card border-l">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">{opp?.titulo ?? "Carregando…"}</SheetTitle>
        </SheetHeader>

        {opp && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded border" style={{ borderColor: opp.pipeline_stages?.cor, color: opp.pipeline_stages?.cor }}>
                {opp.pipeline_stages?.nome}
              </span>
              <span className="px-2 py-1 rounded bg-muted/50 capitalize">{opp.temperatura}</span>
              <span className="px-2 py-1 rounded bg-muted/50 capitalize">{opp.origem}</span>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Etapa</Label>
                <Select value={opp.etapa_id ?? ""} onValueChange={(v) => update.mutate({ etapa_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stagesForFunnel(opp.funnel_id).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Temperatura</Label>
                  <Select value={opp.temperatura} onValueChange={(v) => update.mutate({ temperatura: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frio">Frio</SelectItem>
                      <SelectItem value="morno">Morno</SelectItem>
                      <SelectItem value="quente">Quente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status doc.</Label>
                  <Select value={opp.status_documentacao} onValueChange={(v) => update.mutate({ status_documentacao: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["nao_solicitado","solicitado","parcial","recebido","em_analise","aprovado","reprovado","pendente_correcao"].map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editing ? (
                <EditForm
                  opp={opp}
                  clientsList={clientsList}
                  partnersList={partnersList}
                  profilesList={profilesList}
                  funnelsList={funnelsList}
                  stagesForFunnel={stagesForFunnel}
                  onSave={(p) => update.mutate(p)}
                  onCancel={() => setEditing(false)}
                />
              ) : (
                <div className="space-y-2 text-sm">
                  <Field label="Cliente" value={opp.clients?.nome ?? "—"} />
                  <Field label="Parceiro" value={opp.partners?.nome ?? "Direto"} />
                  <Field label="Responsável" value={(opp as any).user_profiles?.nome ?? "—"} />
                  <Field label="Valor" value={fmtBRL(opp.valor_estimado)} />
                  <Field label="Produto" value={opp.produto_interesse ?? "—"} />
                  <Field label="Próxima ação" value={opp.proxima_acao ?? "—"} />
                  <Field label="Data" value={opp.data_proxima_acao ?? "—"} />
                  {opp.observacoes && <div className="pt-2 text-muted-foreground italic">"{opp.observacoes}"</div>}
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="mt-3">Editar</Button>
                </div>
              )}
            </div>

            <div className="border-t pt-5">
              <h3 className="font-serif text-lg mb-3">Atividades</h3>
              <div className="flex gap-2 mb-4">
                <Textarea
                  value={activityText}
                  onChange={(e) => setActivityText(e.target.value)}
                  placeholder="Adicionar nota / atividade…"
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={() => addActivity.mutate()} disabled={!activityText.trim()}>+</Button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-slim">
                {activities.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>}
                {activities.map((a: any) => (
                  <div key={a.id} className="border-l-2 border-primary/40 pl-3 py-1 text-sm">
                    <div className="text-muted-foreground text-xs">
                      {new Date(a.data_atividade).toLocaleString("pt-BR")} · {a.user_profiles?.nome ?? ""}
                    </div>
                    <div>{a.descricao}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-5">
              <Button variant="destructive" size="sm" onClick={() => confirm("Excluir oportunidade?") && remove.mutate()}>
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b border-border py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span>{String(value)}</span>
    </div>
  );
}

function EditForm({
  opp,
  clientsList,
  partnersList,
  profilesList,
  funnelsList,
  stagesForFunnel,
  onSave,
  onCancel,
}: {
  opp: any;
  clientsList: any[];
  partnersList: any[];
  profilesList: any[];
  funnelsList: any[];
  stagesForFunnel: (fid: string | null | undefined) => any[];
  onSave: (p: any) => void;
  onCancel: () => void;
}) {
  const [titulo, setTitulo] = useState(opp.titulo);
  const [valor, setValor] = useState(opp.valor_estimado ?? "");
  const [produto, setProduto] = useState(opp.produto_interesse ?? "");
  const [proxAcao, setProxAcao] = useState(opp.proxima_acao ?? "");
  const [data, setData] = useState(opp.data_proxima_acao ?? "");
  const [obs, setObs] = useState(opp.observacoes ?? "");
  const [clienteId, setClienteId] = useState<string>(opp.cliente_id ?? "__none");
  const [parceiroId, setParceiroId] = useState<string>(opp.parceiro_id ?? "__none");
  const [responsavelId, setResponsavelId] = useState<string>(opp.responsavel_id ?? "__none");
  const [origem, setOrigem] = useState<string>(opp.origem);
  const [funnelId, setFunnelId] = useState<string>(opp.funnel_id);
  const [etapaId, setEtapaId] = useState<string>(opp.etapa_id ?? "");
  const [temperatura, setTemperatura] = useState<string>(opp.temperatura);
  const [statusDoc, setStatusDoc] = useState<string>(opp.status_documentacao);

  const availableStages = stagesForFunnel(funnelId);

  const handleSave = () => {
    const patch: any = {
      titulo,
      valor_estimado: Number(valor) || 0,
      produto_interesse: produto || null,
      proxima_acao: proxAcao || null,
      data_proxima_acao: data || null,
      observacoes: obs || null,
      cliente_id: clienteId === "__none" ? null : clienteId,
      parceiro_id: parceiroId === "__none" ? null : parceiroId,
      responsavel_id: responsavelId === "__none" ? null : responsavelId,
      origem,
      funnel_id: funnelId,
      etapa_id: etapaId || null,
      temperatura,
      status_documentacao: statusDoc,
    };
    onSave(patch);
  };

  return (
    <div className="space-y-3">
      <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Valor</Label><Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
        <div><Label>Produto</Label><Input value={produto} onChange={(e) => setProduto(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Cliente</Label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— Sem cliente —</SelectItem>
              {clientsList.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Parceiro</Label>
          <Select value={parceiroId} onValueChange={setParceiroId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Direto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Direto</SelectItem>
              {partnersList.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Responsável</Label>
          <Select value={responsavelId} onValueChange={setResponsavelId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— Sem responsável —</SelectItem>
              {profilesList.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Origem</Label>
          <Select value={origem} onValueChange={setOrigem}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="direto">Direto</SelectItem>
              <SelectItem value="parceiro">Parceiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Funil</Label>
          <Select value={funnelId} onValueChange={(v) => { setFunnelId(v); setEtapaId(""); }}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {funnelsList.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Etapa</Label>
          <Select value={etapaId} onValueChange={setEtapaId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>
              {availableStages.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Temperatura</Label>
          <Select value={temperatura} onValueChange={setTemperatura}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="frio">Frio</SelectItem>
              <SelectItem value="morno">Morno</SelectItem>
              <SelectItem value="quente">Quente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status doc.</Label>
          <Select value={statusDoc} onValueChange={setStatusDoc}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["nao_solicitado","solicitado","parcial","recebido","em_analise","aprovado","reprovado","pendente_correcao"].map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Próx. ação</Label><Input value={proxAcao} onChange={(e) => setProxAcao(e.target.value)} /></div>
        <div><Label>Data</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
      </div>
      <div><Label>Observações</Label><Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} /></div>
      <div className="flex gap-2">
        <Button onClick={handleSave}>Salvar</Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}
