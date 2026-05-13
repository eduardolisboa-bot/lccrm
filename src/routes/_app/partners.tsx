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
import { fmtBRL, fmtNum } from "@/lib/format";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/partners")({
  component: Partners,
});

const PARTNER_TIPOS = ["assessor","advogado","contador","empresario","influenciador","family_office","outro"];

function Partners() {
  const { profile } = useAuth();
  const isMaster = profile?.tipo_usuario === "master";
  const { data: partners = [] } = useQuery({
    queryKey: ["partners-list"],
    queryFn: async () => {
      const { data } = await supabase.from("partners").select("*, opportunities(valor_estimado, pipeline_stages(tipo)), clients(id)");
      return data ?? [];
    },
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif">Parceiros</h1>
          <p className="text-sm text-muted-foreground mt-1">{partners.length} parceiros cadastrados</p>
        </div>
        {isMaster && <NewPartner />}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((p: any) => {
          const opps = p.opportunities ?? [];
          const pipeline = opps.reduce((s: number, o: any) => s + Number(o.valor_estimado ?? 0), 0);
          const ganhas = opps.filter((o: any) => o.pipeline_stages?.tipo === "ganha").length;
          const conv = opps.length > 0 ? (ganhas / opps.length) * 100 : 0;
          return (
            <Link key={p.id} to="/partners/$id" params={{ id: p.id }} className="bg-card border rounded-xl p-5 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-serif text-lg">{p.nome}</div>
                  <div className="text-xs text-muted-foreground capitalize">{p.tipo?.replace(/_/g," ")}</div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${p.status === "ativo" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Clientes</div>
                  <div className="text-sm mt-0.5">{fmtNum(p.clients?.length ?? 0)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Pipeline</div>
                  <div className="text-sm mt-0.5 text-primary">{fmtBRL(pipeline)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Conv.</div>
                  <div className="text-sm mt-0.5">{conv.toFixed(0)}%</div>
                </div>
              </div>
            </Link>
          );
        })}
        {partners.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12">Nenhum parceiro ainda.</div>}
      </div>
    </div>
  );
}

function NewPartner() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "assessor", email: "", telefone: "", empresa: "", comissao: "" });
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("partners").insert({
        nome: form.nome, tipo: form.tipo as any, email: form.email || null, telefone: form.telefone || null,
        empresa: form.empresa || null, comissao: form.comissao ? Number(form.comissao) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners-list"] });
      qc.invalidateQueries({ queryKey: ["partners-all"] });
      setOpen(false); setForm({ nome: "", tipo: "assessor", email: "", telefone: "", empresa: "", comissao: "" });
      toast.success("Parceiro criado");
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Novo Parceiro</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-serif">Novo Parceiro</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PARTNER_TIPOS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Empresa</Label><Input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} /></div>
            <div><Label>Comissão (%)</Label><Input type="number" step="0.01" value={form.comissao} onChange={(e) => setForm({ ...form, comissao: e.target.value })} /></div>
          </div>
          <Button onClick={() => create.mutate()} disabled={!form.nome} className="w-full">Criar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
