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
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [newStage, setNewStage] = useState({ nome: "", cor: "#C9A84C", tipo: "aberta" });

  const { data: stages = [] } = useQuery({
    queryKey: ["stages-settings"],
    queryFn: async () => (await supabase.from("pipeline_stages").select("*").order("ordem")).data ?? [],
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("pipeline_stages").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stages-settings"] }),
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pipeline_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stages-settings"] }); toast.success("Removida"); },
    onError: (e: any) => toast.error(e.message),
  });
  const create = useMutation({
    mutationFn: async () => {
      const ordem = (stages[stages.length - 1]?.ordem ?? 0) + 1;
      const { error } = await supabase.from("pipeline_stages").insert({ ...newStage, tipo: newStage.tipo as any, ordem });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stages-settings"] });
      setNewStage({ nome: "", cor: "#C9A84C", tipo: "aberta" });
      toast.success("Etapa criada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (profile?.tipo_usuario !== "master") {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito ao Master.</div>;
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <h1 className="text-3xl font-serif">Configurações</h1>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-serif text-xl mb-4">Funil de Vendas</h3>
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
            <Select value={newStage.tipo} onValueChange={(v) => setNewStage({ ...newStage, tipo: v })}>
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
    </div>
  );
}
