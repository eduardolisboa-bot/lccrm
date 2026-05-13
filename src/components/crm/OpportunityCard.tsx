import { useDraggable } from "@dnd-kit/core";
import { fmtBRL, tempColor, tempIcon } from "@/lib/format";

export function OpportunityCard({ opp, onClick }: { opp: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opp.id,
    data: { opp },
  });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0.4 : 1 }}
      className="bg-background border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${tempColor(opp.temperatura)}`}>
          {tempIcon(opp.temperatura)} {opp.temperatura}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{opp.origem}</span>
      </div>
      <div onClick={onClick} className="space-y-1.5">
        <div className="font-medium text-sm leading-tight">{opp.clients?.nome ?? opp.titulo}</div>
        <div className="text-primary font-serif text-base">{fmtBRL(opp.valor_estimado)}</div>
        {opp.produto_interesse && <div className="text-xs text-muted-foreground">{opp.produto_interesse}</div>}
        {opp.partners?.nome && <div className="text-xs text-muted-foreground">↳ {opp.partners.nome}</div>}
        {opp.proxima_acao && (
          <div className="text-xs text-muted-foreground border-t border-border pt-1.5 mt-1.5">
            📋 {opp.proxima_acao}
            {opp.data_proxima_acao && <span className="ml-1 text-primary/70">· {new Date(opp.data_proxima_acao).toLocaleDateString("pt-BR")}</span>}
          </div>
        )}
      </div>
      <div {...attributes} {...listeners} className="absolute inset-0 -z-10" />
    </div>
  );
}
