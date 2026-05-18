import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, RefreshCw, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runDuplicateAnalysis } from "@/lib/duplicates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { logAudit } from "@/lib/audit";
import { usePermissions } from "@/hooks/usePermissions";

export const Route = createFileRoute("/_app/clients/duplicates")({
  component: DuplicatesPage,
});

const FIELDS = [
  "nome",
  "email",
  "telefone",
  "cpf_cnpj",
  "razao_social",
  "patrimonio_estimado",
  "endereco",
  "cidade",
  "estado",
] as const;

function DuplicatesPage() {
  const perms = usePermissions();
  const qc = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);
  const [mergeDup, setMergeDup] = useState<any | null>(null);

  const { data: dups = [] } = useQuery({
    queryKey: ["duplicates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("client_duplicates")
        .select("*, a:clients!client_duplicates_client_a_id_fkey(*), b:clients!client_duplicates_client_b_id_fkey(*)")
        .order("similaridade", { ascending: false });
      return data ?? [];
    },
    enabled: perms.canMergeClients,
  });

  const pendingCount = dups.filter((d: any) => d.status === "pendente").length;

  const updateMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from("client_duplicates").update({ status }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["duplicates"] }),
  });

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const n = await runDuplicateAnalysis();
      toast.success(`Análise concluída · ${n} par(es) detectado(s)`);
      qc.invalidateQueries({ queryKey: ["duplicates"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!perms.canMergeClients) {
    return <div className="p-8 text-muted-foreground">Acesso restrito a Master.</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <Link to="/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif flex items-center gap-3">
            <Copy className="w-7 h-7 text-primary" />
            Possíveis Duplicidades
            <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detecta pares de clientes com dados similares.
          </p>
        </div>
        <Button onClick={analyze} disabled={analyzing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`} />
          {analyzing ? "Analisando..." : "Analisar agora"}
        </Button>
      </div>

      {dups.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg">
          <Copy className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Nenhum par detectado. Clique em "Analisar agora" para verificar.
        </div>
      ) : (
        <div className="space-y-4">
          {dups.map((d: any) => (
            <DupCard
              key={d.id}
              dup={d}
              onIgnore={() => updateMut.mutate({ id: d.id, status: "ignorado" })}
              onReview={() => updateMut.mutate({ id: d.id, status: "revisado" })}
              onMerge={() => setMergeDup(d)}
            />
          ))}
        </div>
      )}

      <MergeDialog dup={mergeDup} onClose={() => setMergeDup(null)} />
    </div>
  );
}

function DupCard({ dup, onIgnore, onReview, onMerge }: any) {
  const a = dup.a, b = dup.b;
  const statusColor: Record<string, string> = {
    pendente: "text-yellow-500",
    ignorado: "text-muted-foreground",
    revisado: "text-blue-500",
    fundido: "text-green-500",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span>
          Similaridade: <strong className="text-primary">{dup.similaridade}%</strong> · Motivo: {dup.motivo}
        </span>
        <span className={`uppercase ${statusColor[dup.status]}`}>{dup.status}</span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <ClientPanel c={a} title="Cliente A" />
        <ClientPanel c={b} title="Cliente B" />
      </div>
      {dup.campos_conflitantes && Object.keys(dup.campos_conflitantes).length > 0 && (
        <div className="text-xs text-yellow-500">
          ⚠️ Conflitos: {Object.keys(dup.campos_conflitantes).join(", ")}
        </div>
      )}
      {dup.status === "pendente" && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onIgnore}>Ignorar</Button>
          <Button variant="ghost" size="sm" onClick={onReview}>Marcar revisão</Button>
          <Button size="sm" onClick={onMerge} className="ml-auto">Fundir →</Button>
        </div>
      )}
    </div>
  );
}

function ClientPanel({ c, title }: { c: any; title: string }) {
  if (!c) return <div className="text-muted-foreground">{title}: removido</div>;
  return (
    <div className="space-y-1 p-3 rounded border border-border bg-background/50">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{title}</div>
      <Link to="/clients/$id" params={{ id: c.id }} className="font-medium text-primary hover:underline">
        {c.nome}
      </Link>
      <div>📞 {c.telefone || "—"}</div>
      <div>✉ {c.email || "—"}</div>
      <div>🆔 {c.cpf_cnpj || "—"}</div>
    </div>
  );
}

function MergeDialog({ dup, onClose }: { dup: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [choices, setChoices] = useState<Record<string, "a" | "b">>({});

  if (!dup) return null;
  const a = dup.a, b = dup.b;

  const merge = async () => {
    if (!a || !b) return;
    try {
      // Build merged data — A is the survivor
      const merged: Record<string, any> = {};
      for (const f of FIELDS) {
        const src = (choices[f] ?? "a") === "a" ? a : b;
        merged[f] = src[f];
      }
      // 1. update A with chosen fields
      await supabase.from("clients").update(merged).eq("id", a.id);
      // 2. move relations from B to A
      await supabase.from("activities").update({ client_id: a.id }).eq("client_id", b.id);
      await supabase.from("client_documents").update({ client_id: a.id }).eq("client_id", b.id);
      await supabase.from("opportunities").update({ cliente_id: a.id }).eq("cliente_id", b.id);
      // tags (ignore unique-violation errors)
      const { data: tlinks } = await supabase
        .from("client_tags")
        .select("tag_id")
        .eq("client_id", b.id);
      if (tlinks?.length) {
        for (const t of tlinks) {
          await supabase
            .from("client_tags")
            .insert({ client_id: a.id, tag_id: t.tag_id });
        }
        await supabase.from("client_tags").delete().eq("client_id", b.id);
      }
      // 3. mark B inactive
      await supabase.from("clients").update({ status: "inativo" }).eq("id", b.id);
      // 4. mark duplicate as fundido
      await supabase
        .from("client_duplicates")
        .update({ status: "fundido", fundido_por: profile?.id ?? null, log_fusao: { choices, merged } })
        .eq("id", dup.id);
      // 5. audit
      await logAudit({
        userId: profile?.id,
        acao: "fusao_clientes",
        entidade: "clients",
        entidadeId: a.id,
        anteriores: { a, b },
        novos: { merged, b_inativado: b.id },
      });
      toast.success("Clientes fundidos com sucesso");
      qc.invalidateQueries({ queryKey: ["duplicates"] });
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao fundir");
    }
  };

  return (
    <Dialog open={!!dup} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Fundir clientes</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Cliente A será mantido e receberá os dados escolhidos. Cliente B será inativado.
        </p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-xs uppercase tracking-wide text-muted-foreground border-b border-border pb-2">
            <div>Campo · A</div>
            <div className="px-3">Manter</div>
            <div>Campo · B</div>
          </div>
          {FIELDS.map((f) => {
            const cur = choices[f] ?? "a";
            return (
              <div key={f} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-sm py-1.5 border-b border-border/40">
                <label className={`cursor-pointer p-2 rounded ${cur === "a" ? "bg-primary/10 border border-primary/40" : "border border-transparent"}`}>
                  <div className="text-[10px] text-muted-foreground uppercase">{f}</div>
                  <div className="truncate">{String(a?.[f] ?? "—")}</div>
                </label>
                <div className="flex flex-col gap-1">
                  <input type="radio" name={f} checked={cur === "a"} onChange={() => setChoices((c) => ({ ...c, [f]: "a" }))} />
                  <input type="radio" name={f} checked={cur === "b"} onChange={() => setChoices((c) => ({ ...c, [f]: "b" }))} />
                </div>
                <label className={`cursor-pointer p-2 rounded ${cur === "b" ? "bg-primary/10 border border-primary/40" : "border border-transparent"}`}>
                  <div className="text-[10px] text-muted-foreground uppercase">{f}</div>
                  <div className="truncate">{String(b?.[f] ?? "—")}</div>
                </label>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={merge}>Confirmar fusão</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
