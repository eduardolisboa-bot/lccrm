import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-active";

/**
 * Aplica/remove tags automáticas para um cliente com base em regras de negócio.
 * Roda em background, sem bloquear a UI.
 */
export function useAutoTags(clientId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    (async () => {
      // Buscar tags automáticas relevantes
      const { data: tagsData } = await supabase
        .from("tags")
        .select("id, nome")
        .eq("tipo", "automatica")
        .eq("categoria", "cliente");
      if (cancelled || !tagsData) return;
      const tagByName = new Map(tagsData.map((t: any) => [t.nome, t.id as string]));

      // Buscar dados auxiliares em paralelo
      const [actsRes, oppsRes, dupsRes, tagLinkRes] = await Promise.all([
        supabase
          .from("activities")
          .select("created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("opportunities")
          .select("status_documentacao")
          .eq("cliente_id", clientId),
        supabase
          .from("client_duplicates")
          .select("id")
          .or(`client_a_id.eq.${clientId},client_b_id.eq.${clientId}`)
          .eq("status", "pendente")
          .limit(1),
        supabase.from("client_tags").select("tag_id").eq("client_id", clientId),
      ]);

      const lastActivity = actsRes.data?.[0]?.created_at as string | undefined;
      const daysSince = lastActivity
        ? (Date.now() - new Date(lastActivity).getTime()) / 86400000
        : Infinity;
      const pendingDocs = (oppsRes.data ?? []).some((o: any) =>
        ["nao_solicitado", "solicitado", "parcialmente_recebido"].includes(o.status_documentacao),
      );
      const hasDup = (dupsRes.data ?? []).length > 0;
      const existing = new Set((tagLinkRes.data ?? []).map((r: any) => r.tag_id as string));

      const desired: Record<string, boolean> = {
        "Sem contato há 30 dias": daysSince > 30,
        "Documentação pendente": pendingDocs,
        "Possível duplicado": hasDup,
      };

      const toAdd: string[] = [];
      const toRemove: string[] = [];
      for (const [name, shouldHave] of Object.entries(desired)) {
        const tid = tagByName.get(name);
        if (!tid) continue;
        const has = existing.has(tid);
        if (shouldHave && !has) toAdd.push(tid);
        else if (!shouldHave && has) toRemove.push(tid);
      }

      if (cancelled) return;
      if (toAdd.length) {
        await supabase
          .from("client_tags")
          .insert(toAdd.map((tag_id) => ({ client_id: clientId, tag_id })));
      }
      if (toRemove.length) {
        await supabase
          .from("client_tags")
          .delete()
          .eq("client_id", clientId)
          .in("tag_id", toRemove);
      }
      if (toAdd.length || toRemove.length) {
        qc.invalidateQueries({ queryKey: ["entity-tags", "client", clientId] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, qc]);
}
