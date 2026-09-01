import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type BackupTenant = "lisboa" | "epic" | "hope";
export const BACKUP_TENANTS: BackupTenant[] = ["lisboa", "epic", "hope"];

export const BACKUP_TABLES = [
  "funnels",
  "partners",
  "tags",
  "pipeline_stages",
  "user_profiles",
  "user_funnel_access",
  "user_calendar_settings",
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

export type BackupEnvelope = {
  checksum_sha256: string;
  payload: {
    version: number;
    generated_at: string;
    project: string;
    tenant: BackupTenant;
    counts: Record<string, number>;
    data: Record<string, unknown[]>;
  };
};

export function isBackupTenant(value: unknown): value is BackupTenant {
  return typeof value === "string" && (BACKUP_TENANTS as string[]).includes(value);
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scopeTenant(query: any, table: string, tenant: BackupTenant) {
  return table === "user_profiles" ? query.contains("tenants", [tenant]) : query.eq("tenant", tenant);
}

export async function assertInternalAccess(userId: string, tenant: BackupTenant) {
  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("tipo_usuario, tenants")
    .eq("auth_user_id", userId)
    .eq("status", "ativo")
    .maybeSingle();
  if (error) throw new Error("Falha ao verificar permissão: " + error.message);
  const internal = data?.tipo_usuario === "master" || data?.tipo_usuario === "interno";
  if (!internal || !data.tenants.includes(tenant)) throw new Error("Acesso negado a este sistema");
}

export function parseAndValidateEnvelope(bytes: Uint8Array): BackupEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("Arquivo inválido: o conteúdo não é um backup JSON válido");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("Estrutura de backup inválida");
  const envelope = parsed as Partial<BackupEnvelope>;
  const payload = envelope.payload;
  if (!envelope.checksum_sha256 || !payload || !isBackupTenant(payload.tenant) || !payload.data || !payload.counts) {
    throw new Error("Estrutura de backup inválida ou incompleta");
  }
  return envelope as BackupEnvelope;
}

export async function verifyEnvelope(envelope: BackupEnvelope) {
  const computedChecksum = await sha256Hex(new TextEncoder().encode(JSON.stringify(envelope.payload)));
  return { computedChecksum, checksumOk: computedChecksum === envelope.checksum_sha256 };
}

async function readTable(table: string, tenant: BackupTenant) {
  const rows: unknown[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = scopeTenant((supabaseAdmin.from(table as never) as any).select("*"), table, tenant);
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

export async function countTable(table: string, tenant: BackupTenant) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = scopeTenant((supabaseAdmin.from(table as never) as any).select("*", { count: "exact", head: true }), table, tenant);
  const { count, error } = await query;
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return (count as number | null) ?? 0;
}

function storagePath(tenant: BackupTenant, type: "automatico" | "manual" | "importado", date: Date) {
  const stamp = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const day = date.toISOString().slice(0, 10).replace(/-/g, "/");
  return `${tenant}/${day}/backup-${stamp}-${type}-${crypto.randomUUID().slice(0, 8)}.json`;
}

export async function createBackup(tenant: BackupTenant, type: "automatico" | "manual", initiatedBy: string | null) {
  const started = new Date();
  const data: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  for (const table of BACKUP_TABLES) {
    const rows = await readTable(table, tenant);
    data[table] = rows;
    counts[table] = rows.length;
  }

  const payload: BackupEnvelope["payload"] = {
    version: 2,
    generated_at: started.toISOString(),
    project: "lisboa-capital-crm",
    tenant,
    counts,
    data,
  };
  const checksum = await sha256Hex(new TextEncoder().encode(JSON.stringify(payload)));
  const envelope: BackupEnvelope = { checksum_sha256: checksum, payload };
  const bytes = new TextEncoder().encode(JSON.stringify(envelope));
  const path = storagePath(tenant, type, started);

  const { error: uploadError } = await supabaseAdmin.storage.from("backups").upload(path, bytes, {
    contentType: "application/json",
    upsert: false,
  });
  if (uploadError) throw new Error("Falha ao salvar arquivo: " + uploadError.message);

  try {
    const { data: downloaded, error: downloadError } = await supabaseAdmin.storage.from("backups").download(path);
    if (downloadError || !downloaded) throw new Error(downloadError?.message ?? "arquivo não encontrado");
    const downloadedBytes = new Uint8Array(await downloaded.arrayBuffer());
    const checked = parseAndValidateEnvelope(downloadedBytes);
    const { checksumOk } = await verifyEnvelope(checked);
    const liveCounts: Record<string, number> = {};
    const mismatches: { table: string; dump: number; live: number }[] = [];
    for (const table of BACKUP_TABLES) {
      const live = await countTable(table, tenant);
      liveCounts[table] = live;
      if (live !== counts[table]) mismatches.push({ table, dump: counts[table] ?? 0, live });
    }
    if (!checksumOk || downloadedBytes.byteLength !== bytes.byteLength) throw new Error("A validação do arquivo salvo falhou");

    const { error: historyError } = await supabaseAdmin.from("backup_history").insert({
      tenant,
      storage_path: path,
      tipo: type,
      status: "sucesso",
      tamanho_bytes: bytes.byteLength,
      tabelas: counts,
      checksum_sha256: checksum,
      validacao: {
        checksum_ok: checksumOk,
        parse_ok: true,
        file_size_ok: downloadedBytes.byteLength === bytes.byteLength,
        counts_match: mismatches.length === 0,
        mismatches,
        live_counts: liveCounts,
        checked_at: new Date().toISOString(),
      },
      iniciado_por: initiatedBy,
    });
    if (historyError) throw new Error("Falha ao registrar histórico: " + historyError.message);
    return { path, size: bytes.byteLength, counts, checksum_sha256: checksum };
  } catch (error) {
    await supabaseAdmin.storage.from("backups").remove([path]);
    throw error;
  }
}

export async function importBackupFile(bytes: Uint8Array, expectedTenant: BackupTenant, initiatedBy: string) {
  const envelope = parseAndValidateEnvelope(bytes);
  if (envelope.payload.tenant !== expectedTenant) {
    throw new Error(`Este arquivo pertence ao sistema ${envelope.payload.tenant}, não ao ${expectedTenant}`);
  }
  const { checksumOk } = await verifyEnvelope(envelope);
  if (!checksumOk) throw new Error("Checksum SHA-256 inválido: o arquivo pode estar corrompido");

  const path = storagePath(expectedTenant, "importado", new Date());
  const { error: uploadError } = await supabaseAdmin.storage.from("backups").upload(path, bytes, {
    contentType: "application/json",
    upsert: false,
  });
  if (uploadError) throw new Error("Falha ao salvar o arquivo importado: " + uploadError.message);

  const { error: historyError } = await supabaseAdmin.from("backup_history").insert({
    tenant: expectedTenant,
    storage_path: path,
    tipo: "importado",
    status: "sucesso",
    tamanho_bytes: bytes.byteLength,
    tabelas: envelope.payload.counts,
    checksum_sha256: envelope.checksum_sha256,
    validacao: { checksum_ok: true, parse_ok: true, file_size_ok: true, imported_at: new Date().toISOString() },
    iniciado_por: initiatedBy,
  });
  if (historyError) {
    await supabaseAdmin.storage.from("backups").remove([path]);
    throw new Error("Falha ao registrar o arquivo importado: " + historyError.message);
  }
  return { path, tenant: expectedTenant, checksum_sha256: envelope.checksum_sha256 };
}