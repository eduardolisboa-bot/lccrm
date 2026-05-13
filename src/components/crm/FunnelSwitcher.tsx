import { useFunnel } from "@/lib/funnel-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Network } from "lucide-react";

export function FunnelSwitcher({ className }: { className?: string }) {
  const { funnels, selectedId, setSelectedId, loading } = useFunnel();

  if (loading) return null;
  if (!funnels.length)
    return <div className="text-xs text-muted-foreground">Nenhum funil disponível</div>;

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Network className="w-4 h-4 text-muted-foreground" />
      <Select value={selectedId ?? undefined} onValueChange={setSelectedId}>
        <SelectTrigger className="h-9 min-w-[180px] bg-card">
          <SelectValue placeholder="Funil" />
        </SelectTrigger>
        <SelectContent>
          {funnels.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: f.cor }} />
                {f.nome}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
