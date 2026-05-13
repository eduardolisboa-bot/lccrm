import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtBRL } from "@/lib/format";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/clients")({
  component: Clients,
});

function Clients() {
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => (await supabase.from("clients").select("*, partners(nome)")).data ?? [],
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{clients.length} clientes</p>
        </div>
        <NewClient />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3">Parceiro</th>
              <th className="px-5 py-3">Patrimônio</th>
              <th className="px-5 py-3">Email</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c: any) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-3"><Link to="/clients/$id" params={{ id: c.id }} className="hover:text-primary">{c.nome}</Link></td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${c.tipo_cliente === "direto" ? "bg-primary/15 text-primary" : "bg-info/15 text-info"}`}>
                    {c.tipo_cliente}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{c.partners?.nome ?? "—"}</td>
                <td className="px-5 py-3">{fmtBRL(c.patrimonio_estimado)}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.email ?? "—"}</td>
              </tr>
            ))}
            {clients.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-8">Nenhum cliente.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewClient() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo_cliente: "direto", parceiro_id: "", email: "", telefone: "", cpf_cnpj: "", patrimonio_estimado: "" });
  const { data: partners = [] } = useQuery({
    queryKey: ["partners-select"],
    queryFn: async () => (await supabase.from("partners").select("id,nome").eq("status", "ativo")).data ?? [],
    enabled: open,
  });
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").insert({
        nome: form.nome,
        tipo_cliente: form.tipo_cliente as any,
        parceiro_id: form.tipo_cliente === "parceiro" ? form.parceiro_id || null : null,
        email: form.email || null, telefone: form.telefone || null, cpf_cnpj: form.cpf_cnpj || null,
        patrimonio_estimado: form.patrimonio_estimado ? Number(form.patrimonio_estimado) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      qc.invalidateQueries({ queryKey: ["clients-all"] });
      setOpen(false);
      setForm({ nome: "", tipo_cliente: "direto", parceiro_id: "", email: "", telefone: "", cpf_cnpj: "", patrimonio_estimado: "" });
      toast.success("Cliente criado");
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Novo Cliente</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-serif">Novo Cliente</DialogTitle></DialogHeader>
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
          <Button onClick={() => create.mutate()} disabled={!form.nome} className="w-full">Criar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
