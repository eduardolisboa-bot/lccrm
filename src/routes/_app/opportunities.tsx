import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OpportunityDrawer } from "@/components/crm/OpportunityDrawer";
import { fmtBRL } from "@/lib/format";

export const Route = createFileRoute("/_app/opportunities")({
  component: OppList,
});

function OppList() {
  const [oppId, setOppId] = useState<string | null>(null);
  const { data: opps = [] } = useQuery({
    queryKey: ["opps-flat"],
    queryFn: async () => (await supabase.from("opportunities").select("*, clients(nome), partners(nome), pipeline_stages(nome,cor,tipo)").order("updated_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-serif">Oportunidades</h1>
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="px-5 py-3">Título</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Etapa</th>
              <th className="px-5 py-3">Origem</th>
              <th className="px-5 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {opps.map((o: any) => (
              <tr key={o.id} onClick={() => setOppId(o.id)} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer">
                <td className="px-5 py-3">{o.titulo}</td>
                <td className="px-5 py-3 text-muted-foreground">{o.clients?.nome ?? "—"}</td>
                <td className="px-5 py-3"><span style={{ color: o.pipeline_stages?.cor }}>{o.pipeline_stages?.nome}</span></td>
                <td className="px-5 py-3 text-muted-foreground capitalize">{o.origem}</td>
                <td className="px-5 py-3 text-primary">{fmtBRL(o.valor_estimado)}</td>
              </tr>
            ))}
            {opps.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-8">Sem oportunidades.</td></tr>}
          </tbody>
        </table>
      </div>
      <OpportunityDrawer oppId={oppId} open={!!oppId} onClose={() => setOppId(null)} />
    </div>
  );
}
