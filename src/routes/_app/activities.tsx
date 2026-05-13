import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/activities")({
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const { data: acts = [] } = useQuery({
    queryKey: ["acts-all"],
    queryFn: async () => (await supabase.from("activities").select("*, user_profiles(nome), opportunities(titulo,id), clients(nome)").order("data_atividade", { ascending: false }).limit(200)).data ?? [],
  });
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-serif">Atividades</h1>
      <div className="space-y-3">
        {acts.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma atividade.</p>}
        {acts.map((a: any) => (
          <div key={a.id} className="bg-card border rounded-xl p-4 border-l-2 border-l-primary">
            <div className="text-xs text-muted-foreground">{new Date(a.data_atividade).toLocaleString("pt-BR")} · {a.user_profiles?.nome ?? "—"}</div>
            <div className="mt-1 text-sm">{a.descricao}</div>
            <div className="mt-1 text-xs text-primary/70">
              {a.opportunities?.titulo && `Oportunidade: ${a.opportunities.titulo}`}
              {a.clients?.nome && ` · Cliente: ${a.clients.nome}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
