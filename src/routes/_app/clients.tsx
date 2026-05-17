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
import { Plus, Upload, Download, Trash2, Pencil } from "lucide-react";
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
              <th className="px-5 py-3 w-24"></th>
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
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <EditClientButton client={c} />
                    <DeleteClientButton id={c.id} nome={c.nome} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado.</td></tr>}
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

function parseNum(v: any): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(s);
  return isNaN(n) ? null : n;
}

function normalizeTipo(v: any): "direto" | "parceiro" {
  const s = String(v ?? "").trim().toLowerCase();
  return s.startsWith("parc") || s.includes("via") ? "parceiro" : "direto";
}

function ImportClients() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  const onFile = async (file: File) => {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
    const mapped = raw.map((r) => {
      const get = (...keys: string[]) => {
        for (const k of Object.keys(r)) {
          const nk = k.trim().toLowerCase();
          if (keys.some((x) => nk === x || nk.startsWith(x))) return r[k];
        }
        return "";
      };
      return {
        nome: String(get("nome") ?? "").trim(),
        tipo_cliente: normalizeTipo(get("tipo")),
        email: String(get("email", "e-mail") ?? "").trim() || null,
        telefone: String(get("telefone", "fone", "celular") ?? "").trim() || null,
        cpf_cnpj: String(get("cpf/cnpj", "cpf", "cnpj", "documento") ?? "").trim() || null,
        patrimonio_estimado: parseNum(get("patrimônio", "patrimonio")),
      };
    }).filter((r) => r.nome);
    setRows(mapped);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Nome: "João Silva", Tipo: "Direto", Email: "joao@email.com", Telefone: "11999999999", "CPF/CNPJ": "000.000.000-00", "Patrimônio (R$)": 100000 },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "modelo-clientes.xlsx");
  };

  const doImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    const { error } = await supabase.from("clients").insert(rows as any);
    setImporting(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["clients-list"] });
    qc.invalidateQueries({ queryKey: ["clients-all"] });
    toast.success(`${rows.length} clientes importados`);
    setOpen(false); setRows([]); setFileName("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setRows([]); setFileName(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="w-4 h-4 mr-1" /> Importar</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="font-serif">Importar Clientes</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envie um arquivo Excel (.xlsx) com as colunas: <b>Nome</b>, <b>Tipo</b> (Direto ou Via Parceiro), <b>Email</b>, <b>Telefone</b>, <b>CPF/CNPJ</b>, <b>Patrimônio (R$)</b>.
          </p>
          <Button variant="ghost" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-1" /> Baixar modelo
          </Button>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          {fileName && <div className="text-xs text-muted-foreground">{fileName} — {rows.length} linhas válidas</div>}
          {rows.length > 0 && (
            <div className="max-h-64 overflow-auto border rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr><th className="px-2 py-1 text-left">Nome</th><th className="px-2 py-1 text-left">Tipo</th><th className="px-2 py-1 text-left">Email</th><th className="px-2 py-1 text-left">Telefone</th><th className="px-2 py-1 text-left">CPF/CNPJ</th><th className="px-2 py-1 text-right">Patrimônio</th></tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-2 py-1">{r.nome}</td><td className="px-2 py-1">{r.tipo_cliente}</td><td className="px-2 py-1">{r.email ?? "—"}</td><td className="px-2 py-1">{r.telefone ?? "—"}</td><td className="px-2 py-1">{r.cpf_cnpj ?? "—"}</td><td className="px-2 py-1 text-right">{r.patrimonio_estimado != null ? fmtBRL(r.patrimonio_estimado) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 50 && <div className="text-xs text-muted-foreground p-2">…e mais {rows.length - 50} linhas</div>}
            </div>
          )}
          <Button onClick={doImport} disabled={!rows.length || importing} className="w-full">
            {importing ? "Importando…" : `Importar ${rows.length} clientes`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteClientButton({ id, nome }: { id: string; nome: string }) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      qc.invalidateQueries({ queryKey: ["clients-all"] });
      toast.success("Cliente excluído");
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive"
      disabled={del.isPending}
      onClick={(e) => {
        e.stopPropagation();
        if (confirm(`Excluir cliente "${nome}"? Esta ação não pode ser desfeita.`)) del.mutate();
      }}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
