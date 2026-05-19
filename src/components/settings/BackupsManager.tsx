import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Loader2, Play, ShieldCheck, AlertCircle, Clock } from "lucide-react";

function fmtSize(b: number | null | undefined) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("pt-BR");
}

type Row = {
  id: string;
  created_at: string;
  storage_path: string;
  tipo: string;
  status: string;
  tamanho_bytes: number | null;
  tabelas: Record<string, number> | null;
  erro: string | null;
  checksum_sha256: string | null;
  validacao: {
    checksum_ok?: boolean;
    counts_match?: boolean;
    mismatches?: { table: string; dump: number; live: number }[];
  } | null;
};

export function BackupsManager() {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["backup_history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backup_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const runManual = useMutation({
    mutationFn: async () => {
      setRunning(true);
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch("/api/public/hooks/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "manual", iniciado_por: sess.session?.user?.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Falha no backup");
      return json;
    },
    onSuccess: () => {
      toast.success("Backup gerado com sucesso");
      qc.invalidateQueries({ queryKey: ["backup_history"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setRunning(false),
  });

  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from("backups").createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      toast.error(error?.message || "Falha ao gerar link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const lastOk = rows.find((r) => r.status === "sucesso");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" /> Agendamento</div>
          <div className="mt-1 text-sm">Diário · 03:00 UTC</div>
          <div className="text-[11px] text-muted-foreground mt-1">Bucket privado <code>backups</code></div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="w-3.5 h-3.5" /> Último sucesso</div>
          <div className="mt-1 text-sm">{lastOk ? fmtDate(lastOk.created_at) : "—"}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{lastOk ? fmtSize(lastOk.tamanho_bytes) : "Sem backups ainda"}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Backup manual</div>
            <div className="text-sm mt-1">Gere uma cópia agora</div>
          </div>
          <Button onClick={() => runManual.mutate()} disabled={running}>
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
            {running ? "Gerando…" : "Executar"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-medium">Histórico</div>
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Nenhum backup ainda. Clique em “Executar” para gerar o primeiro.</div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                <div className={`h-2 w-2 rounded-full ${r.status === "sucesso" ? "bg-green-500" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="truncate flex items-center gap-2">
                    <span>{fmtDate(r.created_at)} · <span className="text-muted-foreground">{r.tipo}</span></span>
                    {r.validacao?.checksum_ok && (
                      <span className="text-[10px] uppercase tracking-wider text-green-500 border border-green-500/30 bg-green-500/10 rounded px-1.5 py-0.5">checksum ok</span>
                    )}
                    {r.validacao && r.validacao.counts_match === false && (
                      <span className="text-[10px] uppercase tracking-wider text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded px-1.5 py-0.5" title={JSON.stringify(r.validacao.mismatches)}>
                        contagens divergentes
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{r.storage_path}</div>
                  {r.checksum_sha256 && (
                    <div className="text-[10px] text-muted-foreground/70 font-mono truncate" title={r.checksum_sha256}>
                      sha256: {r.checksum_sha256.slice(0, 16)}…{r.checksum_sha256.slice(-8)}
                    </div>
                  )}
                  {r.erro && (
                    <div className="text-[11px] text-red-400 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" /> {r.erro}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{fmtSize(r.tamanho_bytes)}</div>
                {r.status === "sucesso" && (
                  <Button size="sm" variant="ghost" onClick={() => download(r.storage_path)}>
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] text-muted-foreground">
        Os arquivos JSON ficam no bucket privado <code>backups</code> (acesso restrito a Master). Recomenda-se baixar periodicamente para arquivamento externo.
      </div>
    </div>
  );
}
