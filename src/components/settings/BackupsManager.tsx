import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase, getActiveTenantId } from "@/lib/supabase-active";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Loader2, Play, ShieldCheck, AlertCircle, Clock, ShieldAlert, RotateCcw, Upload } from "lucide-react";
import { createManualBackup, importBackup, verifyBackup, restoreBackup } from "@/lib/backup.functions";
import { useTenant } from "@/lib/tenant-context";

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
  const { activeTenant } = useTenant();
  const createBackupFn = useServerFn(createManualBackup);
  const importBackupFn = useServerFn(importBackup);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [running, setRunning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Row | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["backup_history", activeTenant.id],
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
      return createBackupFn({ data: { tenant: activeTenant.id } });
    },
    onSuccess: () => {
      toast.success("Backup gerado com sucesso");
      qc.invalidateQueries({ queryKey: ["backup_history"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setRunning(false),
  });

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    try {
      if (!file.name.toLowerCase().endsWith(".json")) throw new Error("Selecione um arquivo de backup JSON");
      const content = await file.text();
      await importBackupFn({ data: { tenant: activeTenant.id, content } });
      await qc.invalidateQueries({ queryKey: ["backup_history"] });
      toast.success("Backup importado, validado e salvo com sucesso");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao importar backup");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" /> Agendamento</div>
          <div className="mt-1 text-sm">Automático · a cada 15 horas</div>
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
        <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Arquivo externo</div>
            <div className="text-sm mt-1">Importar backup JSON</div>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void handleImport(event.target.files?.[0])} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
            Importar
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
                  <>
                    <Button size="sm" variant="ghost" onClick={() => download(r.storage_path)} title="Baixar">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRestoreTarget(r)} title="Restaurar backup anterior" className="text-amber-500 hover:text-amber-400">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restaurar
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] text-muted-foreground">
        Os arquivos JSON ficam no bucket privado <code>backups</code> (acesso restrito a usuários internos). Recomenda-se baixar periodicamente para arquivamento externo.
      </div>

      <RestoreDialog target={restoreTarget} tenant={activeTenant.id} onClose={() => setRestoreTarget(null)} onDone={() => { setRestoreTarget(null); qc.invalidateQueries({ queryKey: ["backup_history"] }); }} />
    </div>
  );
}

// ---------- Restore dialog ----------

type VerifyResult = {
  checksum_ok: boolean;
  expected_checksum: string;
  computed_checksum: string;
  file_size: number;
  generated_at: string;
  dump_counts: Record<string, number>;
  live_counts: Record<string, number>;
  diffs: { table: string; backup: number; live: number; delta: number }[];
  ready_to_restore: boolean;
};

function RestoreDialog({ target, tenant, onClose, onDone }: { target: Row | null; tenant: "lisboa" | "epic" | "hope"; onClose: () => void; onDone: () => void }) {
  const verifyFn = useServerFn(verifyBackup);
  const restoreFn = useServerFn(restoreBackup);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState<"verify" | "restore" | null>(null);

  const runVerify = async () => {
    if (!target) return;
    setBusy("verify");
    try {
      const r = (await verifyFn({ data: { storage_path: target.storage_path, tenant } })) as VerifyResult;
      setVerify(r);
      if (!r.checksum_ok) toast.error("Checksum inválido — backup corrompido");
      else toast.success("Backup íntegro e pronto para restauração");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const runRestore = async () => {
    if (!target) return;
    if (confirmText !== "RESTAURAR") {
      toast.error("Digite RESTAURAR para confirmar");
      return;
    }
    setBusy("restore");
    try {
      const r = await restoreFn({ data: { storage_path: target.storage_path, confirm: "RESTAURAR", tenant } });
      if (r.success) toast.success(`Restauração concluída em ${(r.duration_ms / 1000).toFixed(1)}s`);
      else toast.warning(`Restauração concluída com avisos (${r.mismatches.length} divergências, ${r.errors.length} erros)`);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => { if (!o) { onClose(); setVerify(null); setConfirmText(""); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" /> Restaurar backup</DialogTitle>
          <DialogDescription className="text-xs">
            Esta operação <strong>sobrescreve todos os dados atuais</strong> com o conteúdo deste backup. Recomenda-se gerar um backup manual antes.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="space-y-3 text-sm">
            <div className="rounded border border-border bg-card p-3 space-y-1">
              <div className="text-xs text-muted-foreground">Arquivo</div>
              <div className="font-mono text-[11px] break-all">{target.storage_path}</div>
              <div className="text-xs text-muted-foreground mt-1">Gerado em {fmtDate(target.created_at)} · {fmtSize(target.tamanho_bytes)}</div>
            </div>

            {!verify ? (
              <Button onClick={runVerify} disabled={busy === "verify"} variant="outline" className="w-full">
                {busy === "verify" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Verificar checksum e contagens
              </Button>
            ) : (
              <div className="rounded border border-border p-3 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={verify.checksum_ok ? "text-green-500" : "text-red-500"}>●</span>
                  <span>Checksum SHA-256: {verify.checksum_ok ? "VÁLIDO" : "INVÁLIDO"}</span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground break-all">
                  esperado: {verify.expected_checksum}<br />obtido:   {verify.computed_checksum}
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="font-medium mb-1">Contagens (backup → atual)</div>
                  {verify.diffs.length === 0 ? (
                    <div className="text-green-500">Nenhuma divergência — banco atual coincide com o backup.</div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-0.5">
                      {verify.diffs.map((d) => (
                        <div key={d.table} className="flex justify-between gap-3">
                          <span className="text-muted-foreground">{d.table}</span>
                          <span className={d.delta > 0 ? "text-blue-400" : "text-amber-400"}>
                            {d.backup} → {d.live} ({d.delta > 0 ? "+" : ""}{d.delta * -1})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {verify?.ready_to_restore && (
              <div className="space-y-2">
                <div className="text-xs text-amber-500 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Digite <code className="font-mono">RESTAURAR</code> abaixo para confirmar a sobrescrita de todos os dados.</span>
                </div>
                <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="RESTAURAR" autoComplete="off" />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy !== null}>Cancelar</Button>
          <Button
            onClick={runRestore}
            disabled={busy !== null || !verify?.ready_to_restore || confirmText !== "RESTAURAR"}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {busy === "restore" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
            Restaurar agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
