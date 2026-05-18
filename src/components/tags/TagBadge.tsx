import { X, Zap } from "lucide-react";

export interface Tag {
  id: string;
  nome: string;
  cor: string;
  tipo?: "manual" | "automatica";
  categoria?: string | null;
}

interface Props {
  tag: Tag;
  onRemove?: () => void;
}

// hex to rgba helper
function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function TagBadge({ tag, onRemove }: Props) {
  const auto = tag.tipo === "automatica";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs uppercase tracking-wide border"
      style={{
        backgroundColor: rgba(tag.cor, 0.15),
        borderColor: rgba(tag.cor, 0.4),
        color: tag.cor,
      }}
    >
      {auto && <Zap className="h-3 w-3" />}
      <span>{tag.nome}</span>
      {!auto && onRemove && (
        <button onClick={onRemove} className="hover:opacity-70" aria-label="Remover">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
