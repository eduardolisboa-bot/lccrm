import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function isMasterAuthRequest(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization");
  const token = header?.replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return false;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("tipo_usuario")
    .eq("auth_user_id", userData.user.id)
    .eq("status", "ativo")
    .maybeSingle();

  if (profileError) throw new Error("Falha ao verificar permissão: " + profileError.message);
  return profile?.tipo_usuario === "master";
}

function hasCronApiKey(request: Request): boolean {
  const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
  return Boolean(expected && request.headers.get("apikey") === expected);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const buf = await crypto.subtle.digest("SHA-256", ab);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function countRow(table: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabaseAdmin.from(table as never) as any)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return (count as number) ?? 0;
}

const TABLES = [
  "clients",
  "partners",
  "opportunities",
  "activities",
  "user_profiles",
  "user_funnel_access",
  "funnels",
  "funnel_goals",
  "pipeline_stages",
  "stage_goals",
  "client_documents",
  "client_status_history",
  "client_duplicates",
  "tags",
  "client_tags",
  "partner_tags",
  "commission_rules",
  "notifications",
  "audit_logs",
] as const;

async function dumpAll(tipo: "automatico" | "manual", iniciadoPor: string | null) {
  const started = new Date();
  const dump: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  for (const t of TABLES) {
    const all: unknown[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabaseAdmin
        .from(t)
        .select("*")
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`${t}: ${error.message}`);
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    dump[t] = all;
    counts[t] = all.length;
  }

  // Pre-checksum payload (without the checksum field itself)
  const innerPayload = {
    version: 1,
    generated_at: started.toISOString(),
    project: "lisboa-capital-crm",
    counts,
    data: dump,
  };
  const inner = JSON.stringify(innerPayload);
  const innerBytes = new TextEncoder().encode(inner);
  const checksum = await sha256Hex(innerBytes);

  // Final envelope embeds the checksum that covers innerPayload
  const envelope = { checksum_sha256: checksum, payload: innerPayload };
  const body = JSON.stringify(envelope);
  const buf = new TextEncoder().encode(body);

  const yyyy = started.getUTCFullYear();
  const mm = String(started.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(started.getUTCDate()).padStart(2, "0");
  const hh = String(started.getUTCHours()).padStart(2, "0");
  const mi = String(started.getUTCMinutes()).padStart(2, "0");
  const path = `${yyyy}/${mm}/${dd}/backup-${yyyy}${mm}${dd}-${hh}${mi}-${tipo}.json`;

  const { error: upErr } = await supabaseAdmin.storage
    .from("backups")
    .upload(path, buf, { contentType: "application/json", upsert: false });
  if (upErr) throw new Error(`upload: ${upErr.message}`);

  // ---- Post-backup validation ----
  // 1) Re-download the uploaded file and re-hash it
  const { data: dl, error: dlErr } = await supabaseAdmin.storage.from("backups").download(path);
  if (dlErr || !dl) throw new Error(`download check: ${dlErr?.message ?? "no data"}`);
  const downloadedBytes = new Uint8Array(await dl.arrayBuffer());
  let parsedOk = true;
  let reChecksum = "";
  let innerReHash = "";
  try {
    const parsed = JSON.parse(new TextDecoder().decode(downloadedBytes)) as {
      checksum_sha256: string;
      payload: unknown;
    };
    reChecksum = parsed.checksum_sha256;
    innerReHash = await sha256Hex(new TextEncoder().encode(JSON.stringify(parsed.payload)));
  } catch {
    parsedOk = false;
  }
  const checksumOk = parsedOk && reChecksum === checksum && innerReHash === checksum;

  // 2) Re-count each table and compare with dump counts
  const liveCounts: Record<string, number> = {};
  const mismatches: { table: string; dump: number; live: number }[] = [];
  for (const t of TABLES) {
    const live = await countRow(t);
    liveCounts[t] = live;
    if (live !== counts[t]) mismatches.push({ table: t, dump: counts[t], live });
  }

  const validacao = {
    checksum_ok: checksumOk,
    parse_ok: parsedOk,
    file_size_ok: downloadedBytes.byteLength === buf.byteLength,
    counts_match: mismatches.length === 0,
    mismatches,
    live_counts: liveCounts,
    checked_at: new Date().toISOString(),
  };

  const valid = checksumOk && validacao.file_size_ok; // count mismatches are warnings, not failures

  await supabaseAdmin.from("backup_history").insert({
    storage_path: path,
    tipo,
    status: valid ? "sucesso" : "erro",
    tamanho_bytes: buf.byteLength,
    tabelas: counts,
    checksum_sha256: checksum,
    validacao,
    erro: valid ? null : "Validação pós-backup falhou (ver campo validacao)",
    iniciado_por: iniciadoPor,
  });

  if (!valid) throw new Error("Validação pós-backup falhou: " + JSON.stringify(validacao));

  return { path, size: buf.byteLength, counts, checksum_sha256: checksum, validacao };
}

export const Route = createFileRoute("/api/public/hooks/backup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let tipo: "automatico" | "manual" = "automatico";
        let iniciadoPor: string | null = null;
        try {
          const body = (await request.json()) as { tipo?: string; iniciado_por?: string };
          if (body?.tipo === "manual") tipo = "manual";
          if (body?.iniciado_por) iniciadoPor = body.iniciado_por;
        } catch {}

        try {
          if (tipo === "manual" && !(await isMasterAuthRequest(request))) {
            return new Response(JSON.stringify({ success: false, error: "Acesso restrito ao Master" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (tipo === "automatico" && !hasCronApiKey(request)) {
            return new Response(JSON.stringify({ success: false, error: "Chave de agendamento inválida" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const res = await dumpAll(tipo, iniciadoPor);
          return new Response(JSON.stringify({ success: true, ...res }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          try {
            await supabaseAdmin.from("backup_history").insert({
              storage_path: "(falhou)",
              tipo,
              status: "erro",
              erro: msg,
              iniciado_por: iniciadoPor,
            });
          } catch {}
          return new Response(JSON.stringify({ success: false, error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
