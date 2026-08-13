import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-active";

interface Props {
  etapaId: string | null | undefined;
  updatedAt: string | null | undefined;
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / 86400000);
}

export function PipelineProgress({ etapaId, updatedAt }: Props) {
  const { data: stage } = useQuery({
    queryKey: ["pipeline-stage", etapaId],
    queryFn: async () => {
      if (!etapaId) return null;
      const { data } = await supabase
        .from("pipeline_stages")
        .select("nome, cor, percentual_progresso, sla_dias, funnel_id, ordem")
        .eq("id", etapaId)
        .maybeSingle();
      return data;
    },
    enabled: !!etapaId,
  });

  const { data: nextStage } = useQuery({
    queryKey: ["next-stage", stage?.funnel_id, stage?.ordem],
    queryFn: async () => {
      if (!stage) return null;
      const { data } = await supabase
        .from("pipeline_stages")
        .select("nome")
        .eq("funnel_id", stage.funnel_id)
        .gt("ordem", stage.ordem)
        .order("ordem", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!stage,
  });

  if (!stage) return null;

  const pct = stage.percentual_progresso ?? 0;
  const sla = stage.sla_dias ?? 30;
  const days = updatedAt ? daysBetween(new Date(), new Date(updatedAt)) : 0;
  const overdue = days > sla;
  const color = overdue ? "#EF4444" : stage.cor || "#C9A84C";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium" style={{ color }}>{stage.nome}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          ⏱ {days} dia{days !== 1 ? "s" : ""} nesta etapa · SLA: {sla} dias
        </span>
        <span style={{ color }}>
          {overdue ? "⚠️ Prazo excedido" : "✅ No prazo"}
        </span>
      </div>
      {nextStage && (
        <div className="text-xs text-muted-foreground italic">
          Próxima etapa: {nextStage.nome}
        </div>
      )}
    </div>
  );
}
