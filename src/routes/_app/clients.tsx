import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { SortableTh } from "@/components/crm/SortableTh";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtBRL } from "@/lib/format";
import { Plus, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_app/clients")({
  component: Clients,
});

function Clients() {
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => (await supabase.from("clients").select("*, partners(nome)")).data ?? [],
  });

  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<string>("all");
  const [parceiro, setParceiro] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"nome" | "tipo_cliente" | "patrimonio_estimado">("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const PAGE_SIZE = 20;

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
    setPage(1);
  };

  const partnerOptions = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((c: any) => { if (c.parceiro_id && c.partners?.nome) map.set(c.parceiro_id, c.partners.nome); });
    return Array.from(map.entries());
  }, [clients]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = clients.filter((c: any) => {
      if (tipo !== "all" && c.tipo_cliente !== tipo) return false;
      if (parceiro !== "all" && c.parceiro_id !== parceiro) return false;
      if (!term) return true;
      return [c.nome, c.email, c.telefone, c.cpf_cnpj].some((v: any) => v?.toLowerCase().includes(term));
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...out].sort((a: any, b: any) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "pt-BR") * dir;
    });
  }, [clients, q, tipo, parceiro, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} de {clients.length} clientes</p>
        </div>
        <div className="flex gap-2">
          <ImportClients />
          <NewClient />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, email, telefone, CPF/CNPJ…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <Select value={tipo} onValueChange={resetPage(setTipo)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="direto">Direto</SelectItem>
            <SelectItem value="parceiro">Via Parceiro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={parceiro} onValueChange={resetPage(setParceiro)}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Parceiro" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os parceiros</SelectItem>
            {partnerOptions.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <SortableTh label="Nome" k="nome" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Tipo" k="tipo_cliente" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <th className="px-5 py-3">Parceiro</th>
              <SortableTh label="Patrimônio" k="patrimonio_estimado" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <th className="px-5 py-3">Email</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c: any) => (
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
            {filtered.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">Página {currentPage} de {totalPages}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
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
