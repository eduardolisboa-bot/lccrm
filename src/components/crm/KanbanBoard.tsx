import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { supabase } from "@/lib/supabase-active";
import { OpportunityCard } from "./OpportunityCard";
import { fmtBRL } from "@/lib/format";
import { toast } from "sonner";

function Column({ stage, opps, onCardClick }: { stage: any; opps: any[]; onCardClick: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = opps.reduce((s, o) => s + Number(o.valor_estimado ?? 0), 0);
  return (
    <div ref={setNodeRef} className={`flex-1 min-w-[280px] flex flex-col bg-card border rounded-xl ${isOver ? "ring-2 ring-primary" : ""}`}>
      <div className="p-3 border-b" style={{ borderTopColor: stage.cor, borderTopWidth: 3, borderTopStyle: "solid", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm" style={{ color: stage.cor }}>{stage.nome}</span>
          <span className="text-xs text-muted-foreground">{opps.length}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{fmtBRL(total)}</div>
      </div>
      <div className="p-2 space-y-2 flex-1 overflow-y-auto scrollbar-slim min-h-[200px]">
        {opps.map((o) => <OpportunityCard key={o.id} opp={o} onClick={() => onCardClick(o.id)} />)}
      </div>
    </div>
  );
}

export function KanbanBoard({
  funnelId,
  filters,
  onCardClick,
}: {
  funnelId: string | null;
  filters?: { parceiroId?: string; origem?: "direto" | "parceiro" };
  onCardClick: (id: string) => void;
}) {
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const { data: stages = [] } = useQuery({
    queryKey: ["stages-active-kanban", funnelId],
    queryFn: async () => {
      if (!funnelId) return [];
      return (await supabase.from("pipeline_stages").select("*").eq("ativa", true).eq("funnel_id", funnelId).order("ordem")).data ?? [];
    },
    enabled: !!funnelId,
  });

  const { data: opps = [] } = useQuery({
    queryKey: ["opps", funnelId, filters],
    queryFn: async () => {
      if (!funnelId) return [];
      let q = supabase.from("opportunities").select("*, clients(nome), partners(nome)").eq("funnel_id", funnelId);
      if (filters?.parceiroId) q = q.eq("parceiro_id", filters.parceiroId);
      if (filters?.origem) q = q.eq("origem", filters.origem);
      const { data } = await q;
      return data ?? [];
    },
    enabled: !!funnelId,
  });

  const move = useMutation({
    mutationFn: async ({ id, etapa_id }: { id: string; etapa_id: string }) => {
      const { error } = await supabase.from("opportunities").update({ etapa_id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opps"] });
      qc.invalidateQueries({ queryKey: ["opps-all"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    stages.forEach((s: any) => (g[s.id] = []));
    opps.forEach((o: any) => { if (g[o.etapa_id]) g[o.etapa_id].push(o); });
    return g;
  }, [stages, opps]);

  const onDragEnd = (e: DragEndEvent) => {
    const oppId = e.active.id as string;
    const newStage = e.over?.id as string | undefined;
    if (!newStage) return;
    const opp = opps.find((o: any) => o.id === oppId);
    if (opp && opp.etapa_id !== newStage) move.mutate({ id: oppId, etapa_id: newStage });
  };

  if (!funnelId) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Selecione um funil para ver o Kanban.</div>;
  }
  if (!stages.length) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Este funil ainda não tem etapas. Configure em Configurações.</div>;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-slim">
        {stages.map((s: any) => (
          <Column key={s.id} stage={s} opps={grouped[s.id] ?? []} onCardClick={onCardClick} />
        ))}
      </div>
    </DndContext>
  );
}
