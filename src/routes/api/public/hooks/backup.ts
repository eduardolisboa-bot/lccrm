import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

  const payload = {
    version: 1,
    generated_at: started.toISOString(),
    project: "lisboa-capital-crm",
    counts,
    data: dump,
  };
  const body = JSON.stringify(payload);
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

  await supabaseAdmin.from("backup_history").insert({
    storage_path: path,
    tipo,
    status: "sucesso",
    tamanho_bytes: buf.byteLength,
    tabelas: counts,
    iniciado_por: iniciadoPor,
  });

  return { path, size: buf.byteLength, counts };
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
