import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase-active";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

const TIPOS = ["assessor", "advogado", "contador", "empresario", "influenciador", "family_office", "outro"];

export function EditPartnerActions({ partner }: { partner: any }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "", tipo: "outro", email: "", telefone: "", empresa: "", comissao: "", status: "ativo",
  });

  useEffect(() => {
    if (partner) setForm({
      nome: partner.nome ?? "",
      tipo: partner.tipo ?? "outro",
      email: partner.email ?? "",
      telefone: partner.telefone ?? "",
      empresa: partner.empresa ?? "",
      comissao: partner.comissao?.toString() ?? "",
      status: partner.status ?? "ativo",
    });
  }, [partner]);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("partners").update({
        nome: form.nome, tipo: form.tipo as any,
        email: form.email || null, telefone: form.telefone || null,
        empresa: form.empresa || null,
        comissao: form.comissao ? Number(form.comissao) : null,
        status: form.status as any,
      }).eq("id", partner.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner", partner.id] });
      qc.invalidateQueries({ queryKey: ["partners-list"] });
      toast.success("Parceiro atualizado");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("partners").delete().eq("id", partner.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners-list"] });
      toast.success("Parceiro excluído");
      navigate({ to: "/partners" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!partner) return null;

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar</Button>
      <Button variant="destructive" size="sm" onClick={() => confirm(`Excluir parceiro "${partner.nome}"?`) && remove.mutate()}><Trash2 className="w-3.5 h-3.5" /></Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Editar Parceiro</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Empresa</Label><Input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} /></div>
              <div><Label>Comissão (%)</Label><Input type="number" step="0.01" value={form.comissao} onChange={(e) => setForm({ ...form, comissao: e.target.value })} /></div>
            </div>
            <Button onClick={() => update.mutate()} disabled={!form.nome} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
