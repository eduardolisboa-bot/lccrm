import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Tenant = "lisboa" | "epic" | "hope";

function validateTenant(input: { tenant: Tenant }) {
  if (!input || !["lisboa", "epic", "hope"].includes(input.tenant)) throw new Error("Sistema inválido");
  return input;
}

export const createManualBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateTenant)
  .handler(async ({ data, context }) => {
    const { assertInternalAccess, createBackup } = await import("@/lib/backup.server");
    await assertInternalAccess(context.userId, data.tenant);
    return createBackup(data.tenant, "manual", context.userId);
  });

export const importBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { tenant: Tenant; content: string }) => {
    validateTenant(input);
    if (typeof input.content !== "string" || input.content.length === 0) throw new Error("Arquivo vazio");
    if (input.content.length > 50 * 1024 * 1024) throw new Error("O arquivo excede o limite de 50 MB");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { assertInternalAccess, importBackupFile } = await import("@/lib/backup.server");
    await assertInternalAccess(context.userId, data.tenant);
    return importBackupFile(new TextEncoder().encode(data.content), data.tenant, context.userId);
  });

export const getBackupDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storage_path: string; tenant: Tenant }) => ({ ...input, ...validateTenant(input) }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertInternalAccess, assertRegisteredBackupPath } = await import("@/lib/backup.server");
    await assertInternalAccess(context.userId, data.tenant);
    await assertRegisteredBackupPath(data.storage_path, data.tenant);
    const { data: signed, error } = await supabaseAdmin.storage.from("backups").createSignedUrl(data.storage_path, 300, {
      download: data.storage_path.split("/").at(-1) ?? "backup.json",
    });
    if (error || !signed?.signedUrl) throw new Error("Falha ao preparar download: " + (error?.message ?? "link indisponível"));
    return { url: signed.signedUrl };
  });

export const verifyBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storage_path: string; tenant: Tenant }) => ({ ...input, ...validateTenant(input) }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { BACKUP_TABLES, assertInternalAccess, assertRegisteredBackupPath, countTable, parseAndValidateEnvelope, verifyEnvelope } = await import("@/lib/backup.server");
    await assertInternalAccess(context.userId, data.tenant);
    await assertRegisteredBackupPath(data.storage_path, data.tenant);

    const { data: file, error } = await supabaseAdmin.storage.from("backups").download(data.storage_path);
    if (error || !file) throw new Error("Falha ao baixar backup: " + (error?.message ?? "arquivo não encontrado"));
    const bytes = new Uint8Array(await file.arrayBuffer());
    const envelope = parseAndValidateEnvelope(bytes);
    if (envelope.payload.tenant !== data.tenant) throw new Error("O conteúdo do backup pertence a outro sistema");
    const { computedChecksum, checksumOk } = await verifyEnvelope(envelope);

    const liveCounts: Record<string, number> = {};
    const diffs: { table: string; backup: number; live: number; delta: number }[] = [];
    for (const table of BACKUP_TABLES) {
      const live = await countTable(table, data.tenant);
      const backup = envelope.payload.counts[table] ?? 0;
      liveCounts[table] = live;
      if (live !== backup) diffs.push({ table, backup, live, delta: backup - live });
    }
    return {
      checksum_ok: checksumOk,
      expected_checksum: envelope.checksum_sha256,
      computed_checksum: computedChecksum,
      file_size: bytes.byteLength,
      generated_at: envelope.payload.generated_at,
      dump_counts: envelope.payload.counts,
      live_counts: liveCounts,
      diffs,
      ready_to_restore: checksumOk,
    };
  });

export const restoreBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storage_path: string; confirm: string; tenant: Tenant }) => ({ ...input, ...validateTenant(input) }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { BACKUP_TABLES, assertInternalAccess, assertRegisteredBackupPath, countTable, parseAndValidateEnvelope, scopeTenant, verifyEnvelope } = await import("@/lib/backup.server");
    await assertInternalAccess(context.userId, data.tenant);
    if (data.confirm !== "RESTAURAR") throw new Error("Confirmação inválida. Digite RESTAURAR para confirmar.");
    await assertRegisteredBackupPath(data.storage_path, data.tenant);

    const { data: file, error } = await supabaseAdmin.storage.from("backups").download(data.storage_path);
    if (error || !file) throw new Error("Falha ao baixar backup: " + (error?.message ?? "arquivo não encontrado"));
    const envelope = parseAndValidateEnvelope(new Uint8Array(await file.arrayBuffer()));
    if (envelope.payload.tenant !== data.tenant) throw new Error("O conteúdo do backup pertence a outro sistema");
    const { checksumOk } = await verifyEnvelope(envelope);
    if (!checksumOk) throw new Error("Checksum inválido — backup corrompido");

    const startedAt = Date.now();
    const restoredCounts: Record<string, number> = {};
    const errors: { table: string; phase: "delete" | "insert"; error: string }[] = [];
    for (const table of [...BACKUP_TABLES].reverse()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = scopeTenant((supabaseAdmin.from(table as never) as any).delete().neq("id", "00000000-0000-0000-0000-000000000000"), table, data.tenant);
      const { error: deleteError } = await query;
      if (deleteError) errors.push({ table, phase: "delete", error: deleteError.message });
    }
    for (const table of BACKUP_TABLES) {
      const rows = envelope.payload.data[table] ?? [];
      let inserted = 0;
      for (let index = 0; index < rows.length; index += 500) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabaseAdmin.from(table as never) as any).insert(rows.slice(index, index + 500));
        if (insertError) {
          errors.push({ table, phase: "insert", error: insertError.message });
          break;
        }
        inserted += Math.min(500, rows.length - index);
      }
      restoredCounts[table] = inserted;
    }

    const liveCounts: Record<string, number> = {};
    const mismatches: { table: string; backup: number; live: number }[] = [];
    for (const table of BACKUP_TABLES) {
      const live = await countTable(table, data.tenant);
      const backup = envelope.payload.counts[table] ?? 0;
      liveCounts[table] = live;
      if (live !== backup) mismatches.push({ table, backup, live });
    }
    const success = errors.length === 0 && mismatches.length === 0;
    await supabaseAdmin.from("audit_logs").insert({
      tenant: data.tenant,
      entidade: "backup",
      acao: success ? "restore_success" : "restore_partial",
      user_id: context.userId,
      dados_novos: { storage_path: data.storage_path, restored_counts: restoredCounts, live_counts: liveCounts, mismatches, errors },
    });
    return { success, storage_path: data.storage_path, duration_ms: Date.now() - startedAt, restored_counts: restoredCounts, live_counts: liveCounts, mismatches, errors };
  });