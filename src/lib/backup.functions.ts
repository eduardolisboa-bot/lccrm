import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Insert order (respects implicit dependencies). Delete uses reverse.
const RESTORE_ORDER = [
  "funnels",
  "partners",
  "tags",
  "pipeline_stages",
  "user_profiles",
  "user_funnel_access",
  "clients",
  "opportunities",
  "activities",
  "client_documents",
  "client_status_history",
  "client_tags",
  "partner_tags",
  "client_duplicates",
  "commission_rules",
  "funnel_goals",
  "stage_goals",
  "notifications",
  "audit_logs",
] as const;

type BackupEnvelope = {
  checksum_sha256: string;
  payload: {
    version: number;
    generated_at: string;
    project: string;
    counts: Record<string, number>;
    data: Record<string, unknown[]>;
  };
};

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const buf = await crypto.subtle.digest("SHA-256", ab);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function assertMaster(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("tipo_usuario")
    .eq("auth_user_id", userId)
    .eq("status", "ativo")
    .maybeSingle();
  if (error) throw new Error("Falha ao verificar permissão: " + error.message);
  if (!data || data.tipo_usuario !== "master") throw new Error("Acesso restrito ao Master");
}

async function loadBackup(storagePath: string): Promise<{
  envelope: BackupEnvelope;
  computedChecksum: string;
  fileSize: number;
}> {
  const { data, error } = await supabaseAdmin.storage.from("backups").download(storagePath);
  if (error || !data) throw new Error("Falha ao baixar backup: " + (error?.message ?? "no data"));
  const bytes = new Uint8Array(await data.arrayBuffer());
  let envelope: BackupEnvelope;
  try {
    envelope = JSON.parse(new TextDecoder().decode(bytes)) as BackupEnvelope;
  } catch (e) {
    throw new Error("Backup corrompido (JSON inválido): " + (e as Error).message);
  }
  if (!envelope?.checksum_sha256 || !envelope?.payload) {
    throw new Error("Envelope de backup inválido (faltando checksum_sha256 ou payload)");
  }
  const inner = JSON.stringify(envelope.payload);
  const computedChecksum = await sha256Hex(new TextEncoder().encode(inner));
  return { envelope, computedChecksum, fileSize: bytes.byteLength };
}

// ----- Verify (dry-run) -----
export const verifyBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storage_path: string }) => input)
  .handler(async ({ data, context }) => {
    await assertMaster(context.userId);
    const { envelope, computedChecksum, fileSize } = await loadBackup(data.storage_path);

    const checksumOk = computedChecksum === envelope.checksum_sha256;
    const dumpCounts = envelope.payload.counts ?? {};
    const liveCounts: Record<string, number> = {};
    const diffs: { table: string; backup: number; live: number; delta: number }[] = [];

    for (const t of RESTORE_ORDER) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error } = await (supabaseAdmin.from(t as never) as any)
        .select("*", { count: "exact", head: true });
      if (error) throw new Error(`count ${t}: ${error.message}`);
      const live = (count as number) ?? 0;
      const backup = dumpCounts[t] ?? 0;
      liveCounts[t] = live;
      if (live !== backup) diffs.push({ table: t, backup, live, delta: backup - live });
    }

    return {
      checksum_ok: checksumOk,
      expected_checksum: envelope.checksum_sha256,
      computed_checksum: computedChecksum,
      file_size: fileSize,
      generated_at: envelope.payload.generated_at,
      project: envelope.payload.project,
      version: envelope.payload.version,
      dump_counts: dumpCounts,
      live_counts: liveCounts,
      diffs,
      ready_to_restore: checksumOk,
    };
  });

// ----- Restore (destructive) -----
export const restoreBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storage_path: string; confirm: string }) => input)
  .handler(async ({ data, context }) => {
    await assertMaster(context.userId);
    if (data.confirm !== "RESTAURAR") {
      throw new Error("Confirmação inválida. Digite RESTAURAR para confirmar.");
    }

    const { envelope, computedChecksum } = await loadBackup(data.storage_path);
    if (computedChecksum !== envelope.checksum_sha256) {
      throw new Error(
        `Checksum inválido — backup corrompido. esperado=${envelope.checksum_sha256.slice(0, 16)}… obtido=${computedChecksum.slice(0, 16)}…`,
      );
    }

    const startedAt = new Date();
    const dump = envelope.payload.data ?? {};
    const restoredCounts: Record<string, number> = {};
    const errors: { table: string; phase: "delete" | "insert"; error: string }[] = [];

    // DELETE in reverse dependency order
    for (const t of [...RESTORE_ORDER].reverse()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabaseAdmin.from(t as never) as any)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) errors.push({ table: t, phase: "delete", error: error.message });
    }

    // INSERT in dependency order, chunked
    const CHUNK = 500;
    for (const t of RESTORE_ORDER) {
      const rows = (dump[t] ?? []) as unknown[];
      if (rows.length === 0) {
        restoredCounts[t] = 0;
        continue;
      }
      let inserted = 0;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin.from(t as never) as any).insert(slice);
        if (error) {
          errors.push({ table: t, phase: "insert", error: error.message });
          break;
        }
        inserted += slice.length;
      }
      restoredCounts[t] = inserted;
    }

    // Final verification: re-count and compare with dump counts
    const dumpCounts = envelope.payload.counts ?? {};
    const liveCounts: Record<string, number> = {};
    const mismatches: { table: string; backup: number; live: number }[] = [];
    for (const t of RESTORE_ORDER) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error } = await (supabaseAdmin.from(t as never) as any)
        .select("*", { count: "exact", head: true });
      if (error) throw new Error(`post-restore count ${t}: ${error.message}`);
      const live = (count as number) ?? 0;
      liveCounts[t] = live;
      const expected = dumpCounts[t] ?? 0;
      if (live !== expected) mismatches.push({ table: t, backup: expected, live });
    }

    const ok = errors.length === 0 && mismatches.length === 0;

    // Audit
    try {
      await supabaseAdmin.from("audit_logs").insert({
        entidade: "backup",
        acao: ok ? "restore_success" : "restore_partial",
        user_id: context.userId,
        dados_novos: {
          storage_path: data.storage_path,
          generated_at: envelope.payload.generated_at,
          duration_ms: Date.now() - startedAt.getTime(),
          restored_counts: restoredCounts,
          live_counts: liveCounts,
          mismatches,
          errors,
        } as unknown as Record<string, unknown>,
      });
    } catch {}

    return {
      success: ok,
      storage_path: data.storage_path,
      duration_ms: Date.now() - startedAt.getTime(),
      restored_counts: restoredCounts,
      live_counts: liveCounts,
      mismatches,
      errors,
    };
  });
