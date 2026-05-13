import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export function SortableTh<K extends string>({
  label, k, sortKey, sortDir, onClick,
}: {
  label: string;
  k: K;
  sortKey: K;
  sortDir: "asc" | "desc";
  onClick: (k: K) => void;
}) {
  const active = sortKey === k;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className="px-5 py-3">
      <button
        type="button"
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${active ? "text-foreground" : ""}`}
      >
        {label}
        <Icon className="w-3 h-3" />
      </button>
    </th>
  );
}
