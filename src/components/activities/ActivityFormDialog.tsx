import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase-active";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { logAudit } from "@/lib/audit";

export type ActivityRecord = {
  id?: string;
  titulo?: string | null;
  descricao?: string | null;
  tipo_atividade?: string | null;
  prioridade?: string | null;
  status_atividade?: string | null;
  data_agendada?: string | null;
  horario_agendado?: string | null;
  duracao_minutos?: number | null;
  lembrete_minutos?: number | null;
  recorrencia?: string | null;
  responsavel_id?: string | null;
  client_id?: string | null;
  opportunity_id?: string | null;
  parceiro_id?: string | null;
};

const TIPOS = ["ligacao", "reuniao", "email", "whatsapp", "visita", "tarefa", "outro"];
const PRIORIDADES = ["baixa", "media", "alta"];
const STATUS = ["pendente", "em_andamento", "concluida", "cancelada"];
const RECORRENCIA = ["nenhuma", "diaria", "semanal", "mensal"];

export function ActivityFormDialog({
  open,
  onOpenChange,
  initial,
  defaultClientId,
  defaultOpportunityId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ActivityRecord | null;
  defaultClientId?: string;
  defaultOpportunityId?: string;
}) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ActivityRecord>({});

  useEffect(() => {
    if (!open) return;
    setForm(
      initial ?? {
        titulo: "",
        tipo_atividade: "tarefa",
        prioridade: "media",
        status_atividade: "pendente",
        duracao_minutos: 30,
        recorrencia: "nenhuma",
        client_id: defaultClientId ?? null,
        opportunity_id: defaultOpportunityId ?? null,
        responsavel_id: profile?.id ?? null,
      },
    );
  }, [open, initial, defaultClientId, defaultOpportunityId, profile?.id]);

  const { data: users = [] } = useQuery({
    queryKey: ["users-min"],
    queryFn: async () => (await supabase.from("user_profiles").select("id,nome").eq("status", "ativo").order("nome")).data ?? [],
    enabled: open,
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-min"],
    queryFn: async () => (await supabase.from("clients").select("id,nome").order("nome").limit(500)).data ?? [],
    enabled: open,
  });
  const { data: opps = [] } = useQuery({
    queryKey: ["opps-min"],
    queryFn: async () => (await supabase.from("opportunities").select("id,titulo").order("created_at", { ascending: false }).limit(500)).data ?? [],
    enabled: open,
  });

  const set = <K extends keyof ActivityRecord>(k: K, v: ActivityRecord[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.titulo?.trim()) {
      toast.error("Informe um título");
      return;
    }
    setSaving(true);
    const payload: any = {
      titulo: form.titulo,
      descricao: form.descricao || null,
      tipo_atividade: form.tipo_atividade,
      prioridade: form.prioridade,
      status_atividade: form.status_atividade,
      data_agendada: form.data_agendada || null,
      horario_agendado: form.horario_agendado || null,
      duracao_minutos: form.duracao_minutos ?? 30,
      lembrete_minutos: form.lembrete_minutos ?? null,
      recorrencia: form.recorrencia ?? "nenhuma",
      responsavel_id: form.responsavel_id || null,
      client_id: form.client_id || null,
      opportunity_id: form.opportunity_id || null,
      data_atividade: form.data_agendada
        ? new Date(`${form.data_agendada}T${form.horario_agendado || "09:00"}`).toISOString()
        : new Date().toISOString(),
    };

    let error;
    if (initial?.id) {
      ({ error } = await supabase.from("activities").update(payload).eq("id", initial.id));
      if (!error) await logAudit({ userId: profile?.id, acao: "update", entidade: "activity", entidadeId: initial.id, novos: payload });
    } else {
      const { data, error: insErr } = await supabase.from("activities").insert(payload).select("id").single();
      error = insErr;
      if (!error && data) {
        await logAudit({ userId: profile?.id, acao: "create", entidade: "activity", entidadeId: data.id, novos: payload });
        // Notify the responsible user (if different from creator)
        if (form.responsavel_id && form.responsavel_id !== profile?.id) {
          await supabase.from("notifications").insert({
            user_id: form.responsavel_id,
            titulo: "Nova atividade atribuída",
            mensagem: `${form.titulo}${form.data_agendada ? " · " + new Date(form.data_agendada).toLocaleDateString("pt-BR") : ""}`,
            tipo: "atividade",
            link: "/activities",
            entidade: "activity",
            entidade_id: data.id,
          });
        }
      }
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(initial?.id ? "Atividade atualizada" : "Atividade criada");
    qc.invalidateQueries({ queryKey: ["activities"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {initial?.id ? "Editar atividade" : "Nova atividade"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Título *</Label>
            <Input value={form.titulo ?? ""} onChange={(e) => set("titulo", e.target.value)} />
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo_atividade ?? "tarefa"} onValueChange={(v) => set("tipo_atividade", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Prioridade</Label>
            <Select value={form.prioridade ?? "media"} onValueChange={(v) => set("prioridade", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORIDADES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status_atividade ?? "pendente"} onValueChange={(v) => set("status_atividade", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Responsável</Label>
            <Select value={form.responsavel_id ?? ""} onValueChange={(v) => set("responsavel_id", v || null)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{users.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data</Label>
            <Input type="date" value={form.data_agendada ?? ""} onChange={(e) => set("data_agendada", e.target.value)} />
          </div>

          <div>
            <Label>Horário</Label>
            <Input type="time" value={form.horario_agendado ?? ""} onChange={(e) => set("horario_agendado", e.target.value)} />
          </div>

          <div>
            <Label>Duração (min)</Label>
            <Input type="number" min={5} step={5} value={form.duracao_minutos ?? 30} onChange={(e) => set("duracao_minutos", Number(e.target.value))} />
          </div>

          <div>
            <Label>Lembrete (min antes)</Label>
            <Input type="number" min={0} step={5} value={form.lembrete_minutos ?? ""} onChange={(e) => set("lembrete_minutos", e.target.value ? Number(e.target.value) : null)} />
          </div>

          <div>
            <Label>Recorrência</Label>
            <Select value={form.recorrencia ?? "nenhuma"} onValueChange={(v) => set("recorrencia", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RECORRENCIA.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Cliente</Label>
            <Select value={form.client_id ?? ""} onValueChange={(v) => set("client_id", v || null)}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Oportunidade</Label>
            <Select value={form.opportunity_id ?? ""} onValueChange={(v) => set("opportunity_id", v || null)}>
              <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
              <SelectContent>{opps.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.titulo}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Descrição</Label>
            <Textarea rows={3} value={form.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
