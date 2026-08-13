import { supabase } from "@/lib/supabase-active";

export async function logAudit(params: {
  userId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  anteriores?: any;
  novos?: any;
}) {
  try {
    await supabase.from("audit_logs").insert({
      user_id: params.userId ?? null,
      acao: params.acao,
      entidade: params.entidade,
      entidade_id: params.entidadeId ?? null,
      dados_anteriores: params.anteriores ?? null,
      dados_novos: params.novos ?? null,
    });
  } catch (e) {
    console.error("[audit] failed to log", e);
  }
}
