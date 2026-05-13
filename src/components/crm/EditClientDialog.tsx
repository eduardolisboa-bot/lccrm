import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export function EditClientActions({ client }: { client: any }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "", tipo_cliente: "direto", parceiro_id: "",
    email: "", telefone: "", cpf_cnpj: "", patrimonio_estimado: "",
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["partners-select"],
    queryFn: async () => (await supabase.from("partners").select("id,nome").eq("status", "ativo")).data ?? [],
    enabled: open,
  });

  useEffect(() => {
    if (client) setForm({
      nome: client.nome ?? "",
      tipo_cliente: client.tipo_cliente ?? "direto",
      parceiro_id: client.parceiro_id ?? "",
      email: client.email ?? "",
      telefone: client.telefone ?? "",
      cpf_cnpj: client.cpf_cnpj ?? "",
      patrimonio_estimado: client.patrimonio_estimado?.toString() ?? "",
    });
  }, [client]);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").update({
        nome: form.nome,
        tipo_cliente: form.tipo_cliente as any,
        parceiro_id: form.tipo_cliente === "parceiro" ? form.parceiro_id || null : null,
        email: form.email || null, telefone: form.telefone || null, cpf_cnpj: form.cpf_cnpj || null,
        patrimonio_estimado: form.patrimonio_estimado ? Number(form.patrimonio_estimado) : null,
      }).eq("id", client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", client.id] });
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      toast.success("Cliente atualizado");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").delete().eq("id", client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      toast.success("Cliente excluído");
      navigate({ to: "/clients" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!client) return null;

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar</Button>
      <Button variant="destructive" size="sm" onClick={() => confirm(`Excluir cliente "${client.nome}"?`) && remove.mutate()}><Trash2 className="w-3.5 h-3.5" /></Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Editar Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo_cliente} onValueChange={(v) => setForm({ ...form, tipo_cliente: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direto">Direto</SelectItem>
                  <SelectItem value="parceiro">Via Parceiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.tipo_cliente === "parceiro" && (
              <div>
                <Label>Parceiro</Label>
                <Select value={form.parceiro_id} onValueChange={(v) => setForm({ ...form, parceiro_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>{partners.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} /></div>
              <div><Label>Patrimônio (R$)</Label><Input type="number" value={form.patrimonio_estimado} onChange={(e) => setForm({ ...form, patrimonio_estimado: e.target.value })} /></div>
            </div>
            <Button onClick={() => update.mutate()} disabled={!form.nome} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
