export const fmtBRL = (n: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(
    Number(n ?? 0),
  );

export const fmtNum = (n: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR").format(Number(n ?? 0));

export const tempColor = (t: string) =>
  t === "quente" ? "bg-red-500/15 text-red-400 border-red-500/30"
  : t === "morno" ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
  : "bg-blue-500/15 text-blue-400 border-blue-500/30";

export const tempIcon = (t: string) => (t === "quente" ? "🔥" : t === "morno" ? "🌡️" : "❄️");
