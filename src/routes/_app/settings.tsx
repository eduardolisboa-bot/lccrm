import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { fmtBRL } from "@/lib/format";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function currentMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function SettingsPage() {
  const { profile } = useAuth();
  if (profile?.tipo_usuario !== "master") {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito ao Master.</div>;
  }
  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-serif">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Funis, etapas e metas</p>
      </div>
      <Tabs defaultValue="funis">
        <TabsList>
          <TabsTrigger value="funis">Funis & Etapas</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
        </TabsList>
        <TabsContent value="funis" className="mt-4 space-y-6"><FunisManager /></TabsContent>
        <TabsContent value="metas" className="mt-4 space-y-6"><MetasManager /></TabsContent>
      </Tabs>
    </div>
  );
}

function FunisManager() {
  const qc = useQueryClient();
  const [newFunnel, setNewFunnel] = useState({ nome: "", cor: "#C9A84C" });
  const [selectedFunnel, setSelectedFunnel] = useState<string | null>(null);

  const { data: funnels = [] } = useQuery({
    queryKey: ["funnels-settings"],
    queryFn: async () => (await supabase.from("funnels").select("*").order("ordem")).data ?? [],
  });

  const activeFunnel = selectedFunnel ?? funnels[0]?.id ?? null;

  const createFunnel = useMutation({
    mutationFn: async () => {
      const ordem = (funnels[funnels.length - 1]?.ordem ?? -1) + 1;
      const { error } = await supabase.from("funnels").insert({ nome: newFunnel.nome, cor: newFunnel.cor, ordem });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["funnels-settings"] }); qc.invalidateQueries({ queryKey: ["funnels-accessible"] }); setNewFunnel({ nome: "", cor: "#C9A84C" }); toast.success("Funil criado"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateFunnel = useMutation({
    mutationFn: async ({ id, patch }: any) => { const { error } = await supabase.from("funnels").update(patch).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["funnels-settings"] }); qc.invalidateQueries({ queryKey: ["funnels-accessible"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const removeFunnel = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("funnels").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["funnels-settings"] }); qc.invalidateQueries({ queryKey: ["funnels-accessible"] }); toast.success("Funil removido"); setSelectedFunnel(null); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-serif text-xl mb-4">Funis</h3>
        <div className="space-y-2">
          {funnels.map((f: any) => (
            <div key={f.id} className={`flex items-center gap-3 p-3 bg-background border rounded-lg cursor-pointer ${activeFunnel === f.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedFunnel(f.id)}>
              <input type="color" value={f.cor} onChange={(e) => updateFunnel.mutate({ id: f.id, patch: { cor: e.target.value } })} onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer" />
              <Input defaultValue={f.nome} onClick={(e) => e.stopPropagation()} onBlur={(e) => e.target.value !== f.nome && updateFunnel.mutate({ id: f.id, patch: { nome: e.target.value } })} className="flex-1" />
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Switch checked={f.ativo} onCheckedChange={(c) => updateFunnel.mutate({ id: f.id, patch: { ativo: c } })} />
                <span className="text-xs text-muted-foreground">Ativo</span>
              </div>
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); if (confirm("Remover funil e todas as suas etapas/oportunidades?")) removeFunnel.mutate(f.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <Label className="mb-2 block">Novo funil</Label>
          <div className="flex gap-2">
            <input type="color" value={newFunnel.cor} onChange={(e) => setNewFunnel({ ...newFunnel, cor: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
            <Input placeholder="Ex.: Investimentos, Câmbio, Captação" value={newFunnel.nome} onChange={(e) => setNewFunnel({ ...newFunnel, nome: e.target.value })} />
            <Button onClick={() => createFunnel.mutate()} disabled={!newFunnel.nome}><Plus className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      {activeFunnel && <StagesEditor funnelId={activeFunnel} />}
    </div>
  );
}

function StagesEditor({ funnelId }: { funnelId: string }) {
  const qc = useQueryClient();
  const [newStage, setNewStage] = useState({ nome: "", cor: "#C9A84C", tipo: "aberta" as "aberta" | "ganha" | "perdida" | "pausada" });

  const { data: stages = [] } = useQuery({
    queryKey: ["stages-settings", funnelId],
    queryFn: async () => (await supabase.from("pipeline_stages").select("*").eq("funnel_id", funnelId).order("ordem")).data ?? [],
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: any) => { const { error } = await supabase.from("pipeline_stages").update(patch).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stages-settings", funnelId] }),
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("pipeline_stages").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stages-settings", funnelId] }); toast.success("Etapa removida"); },
    onError: (e: any) => toast.error(e.message),
  });
  const create = useMutation({
    mutationFn: async () => {
      const ordem = (stages[stages.length - 1]?.ordem ?? 0) + 1;
      const { error } = await supabase.from("pipeline_stages").insert({ ...newStage, funnel_id: funnelId, ordem });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stages-settings", funnelId] }); setNewStage({ nome: "", cor: "#C9A84C", tipo: "aberta" }); toast.success("Etapa criada"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="bg-card border rounded-xl p-6">
      <h3 className="font-serif text-xl mb-4">Etapas do funil</h3>
      <div className="space-y-2">
        {stages.map((s: any) => (
          <div key={s.id} className="flex items-center gap-3 p-3 bg-background border rounded-lg">
            <span className="text-xs text-muted-foreground w-6">{s.ordem}</span>
            <input type="color" value={s.cor} onChange={(e) => update.mutate({ id: s.id, patch: { cor: e.target.value } })} className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer" />
            <Input defaultValue={s.nome} onBlur={(e) => e.target.value !== s.nome && update.mutate({ id: s.id, patch: { nome: e.target.value } })} className="flex-1" />
            <Select value={s.tipo} onValueChange={(v) => update.mutate({ id: s.id, patch: { tipo: v } })}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="ganha">Ganha</SelectItem>
                <SelectItem value="perdida">Perdida</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch checked={s.ativa} onCheckedChange={(c) => update.mutate({ id: s.id, patch: { ativa: c } })} />
              <span className="text-xs text-muted-foreground">Ativa</span>
            </div>
            <Button size="icon" variant="ghost" onClick={() => confirm("Remover etapa?") && remove.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <Label className="mb-2 block">Nova etapa</Label>
        <div className="flex gap-2">
          <input type="color" value={newStage.cor} onChange={(e) => setNewStage({ ...newStage, cor: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
          <Input placeholder="Nome" value={newStage.nome} onChange={(e) => setNewStage({ ...newStage, nome: e.target.value })} />
          <Select value={newStage.tipo} onValueChange={(v: any) => setNewStage({ ...newStage, tipo: v })}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="aberta">Aberta</SelectItem>
              <SelectItem value="ganha">Ganha</SelectItem>
              <SelectItem value="perdida">Perdida</SelectItem>
              <SelectItem value="pausada">Pausada</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => create.mutate()} disabled={!newStage.nome}><Plus className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function MetasManager() {
  const qc = useQueryClient();
  const [funnelId, setFunnelId] = useState<string | null>(null);
  const [mes, setMes] = useState(currentMonthStart());

  const { data: funnels = [] } = useQuery({
    queryKey: ["funnels-metas"],
    queryFn: async () => (await supabase.from("funnels").select("*").eq("ativo", true).order("ordem")).data ?? [],
  });
  const activeFunnel = funnelId ?? funnels[0]?.id ?? null;

  const { data: stages = [] } = useQuery({
    queryKey: ["stages-metas", activeFunnel],
    queryFn: async () => activeFunnel ? (await supabase.from("pipeline_stages").select("*").eq("funnel_id", activeFunnel).order("ordem")).data ?? [] : [],
    enabled: !!activeFunnel,
  });

  const { data: funnelGoal } = useQuery({
    queryKey: ["funnel-goal", activeFunnel, mes],
    queryFn: async () => activeFunnel ? (await supabase.from("funnel_goals").select("*").eq("funnel_id", activeFunnel).eq("mes", mes).maybeSingle()).data : null,
    enabled: !!activeFunnel,
  });

  const { data: stageGoals = [] } = useQuery({
    queryKey: ["stage-goals", activeFunnel, mes],
    queryFn: async () => activeFunnel ? (await supabase.from("stage_goals").select("*").in("stage_id", stages.map((s: any) => s.id)).eq("mes", mes)).data ?? [] : [],
    enabled: !!activeFunnel && stages.length > 0,
  });

  const { data: opps = [] } = useQuery({
    queryKey: ["opps-meta", activeFunnel, mes],
    queryFn: async () => activeFunnel ? (await supabase.from("opportunities").select("etapa_id,valor_estimado,created_at").eq("funnel_id", activeFunnel).gte("created_at", mes).lt("created_at", nextMonth(mes))).data ?? [] : [],
    enabled: !!activeFunnel,
  });

  const upsertFunnelGoal = useMutation({
    mutationFn: async (valor: number) => {
      const { error } = await supabase.from("funnel_goals").upsert({ funnel_id: activeFunnel!, mes, valor_meta: valor }, { onConflict: "funnel_id,mes" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["funnel-goal"] }); toast.success("Meta atualizada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const upsertStageGoal = useMutation({
    mutationFn: async ({ stageId, valor }: { stageId: string; valor: number }) => {
      const { error } = await supabase.from("stage_goals").upsert({ stage_id: stageId, mes, valor_meta: valor }, { onConflict: "stage_id,mes" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stage-goals"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const totalRealizado = opps.reduce((s: number, o: any) => s + Number(o.valor_estimado ?? 0), 0);
  const metaFunil = Number(funnelGoal?.valor_meta ?? 0);
  const pctFunil = metaFunil > 0 ? Math.min(100, (totalRealizado / metaFunil) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-xl p-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <Label>Funil</Label>
            <Select value={activeFunnel ?? undefined} onValueChange={setFunnelId}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {funnels.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mês</Label>
            <Input type="month" value={mes.slice(0, 7)} onChange={(e) => setMes(`${e.target.value}-01`)} />
          </div>
        </div>
      </div>

      {activeFunnel && (
        <>
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-serif text-xl mb-4">Meta do funil (mensal)</h3>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label>Meta R$</Label>
                <Input type="number" defaultValue={funnelGoal?.valor_meta ?? ""} onBlur={(e) => upsertFunnelGoal.mutate(Number(e.target.value) || 0)} key={`${activeFunnel}-${mes}-${funnelGoal?.valor_meta}`} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="text-xs text-muted-foreground mb-1">Realizado · {fmtBRL(totalRealizado)} de {fmtBRL(metaFunil)}</div>
                <Progress value={pctFunil} />
                <div className="text-xs text-muted-foreground mt-1">{pctFunil.toFixed(1)}% concluído</div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-serif text-xl mb-4">Metas por etapa</h3>
            <div className="space-y-3">
              {stages.map((s: any) => {
                const goal = stageGoals.find((g: any) => g.stage_id === s.id);
                const realizado = opps.filter((o: any) => o.etapa_id === s.id).reduce((sum: number, o: any) => sum + Number(o.valor_estimado ?? 0), 0);
                const meta = Number(goal?.valor_meta ?? 0);
                const pct = meta > 0 ? Math.min(100, (realizado / meta) * 100) : 0;
                return (
                  <div key={s.id} className="grid grid-cols-1 md:grid-cols-[1fr_180px_1fr] gap-3 items-center p-3 bg-background border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.cor }} />
                      <span className="font-medium text-sm">{s.nome}</span>
                    </div>
                    <Input type="number" placeholder="Meta R$" defaultValue={goal?.valor_meta ?? ""} onBlur={(e) => upsertStageGoal.mutate({ stageId: s.id, valor: Number(e.target.value) || 0 })} key={`${s.id}-${mes}-${goal?.valor_meta}`} />
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{fmtBRL(realizado)} de {fmtBRL(meta)} · {pct.toFixed(1)}%</div>
                      <Progress value={pct} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function nextMonth(mes: string) {
  const d = new Date(mes);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}
