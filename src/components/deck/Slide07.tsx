import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { SlideShell, FadeUp } from "./SlideShell";

type Status = "exclusive" | "priority" | "losing";

const KW: { kw: string; vol: string; prat: string; ing: string; status: Status }[] = [
  { kw: "vitrine refrigerada padaria", vol: "8.1K", prat: "TOP 1-3", ing: "NÃO APARECE", status: "losing" },
  { kw: "balcão refrigerado inox", vol: "4.4K", prat: "TOP 1-3", ing: "NÃO APARECE", status: "losing" },
  { kw: "ultra congelador abatedor", vol: "2.9K", prat: "TOP 1-3", ing: "Pág 3-4", status: "losing" },
  { kw: "câmara de fermentação", vol: "1.6K", prat: "Não aparece", ing: "NÃO APARECE", status: "exclusive" },
  { kw: "vitrine confeitaria", vol: "3.6K", prat: "TOP 1-3", ing: "NÃO APARECE", status: "losing" },
  { kw: "balcão sushi inox", vol: "880", prat: "Não aparece", ing: "NÃO APARECE", status: "exclusive" },
  { kw: "vitrine gelateria", vol: "1.2K", prat: "Pág 2", ing: "NÃO APARECE", status: "priority" },
  { kw: "abatedor de temperatura", vol: "2.4K", prat: "TOP 1-3", ing: "NÃO APARECE", status: "losing" },
  { kw: "refrigeração padaria", vol: "1.9K", prat: "Pág 2", ing: "NÃO APARECE", status: "priority" },
  { kw: "fabricante vitrine SP", vol: "720", prat: "TOP 1-3", ing: "NÃO APARECE", status: "priority" },
  { kw: "vitrine sob medida", vol: "2.1K", prat: "TOP 1-3", ing: "NÃO APARECE", status: "losing" },
  { kw: "projeto refrigeração", vol: "1.4K", prat: "Pág 2", ing: "NÃO APARECE", status: "priority" },
  { kw: "Ingecold", vol: "390", prat: "—", ing: "TOP 1", status: "priority" },
  { kw: "freezer espaço gourmet", vol: "590", prat: "Não aparece", ing: "NÃO APARECE", status: "exclusive" },
  { kw: "montagem padaria", vol: "1.1K", prat: "Pág 2", ing: "NÃO APARECE", status: "priority" },
];

const SHARE = [
  { name: "Prática", v: 68, c: "var(--coral)" },
  { name: "Gelopar", v: 18, c: "var(--ocean)" },
  { name: "Outros", v: 10, c: "var(--muted)" },
  { name: "Ingecold", v: 4, c: "var(--teal-mid)" },
];

export default function Slide07() {
  return (
    <SlideShell>
      <div className="relative z-10 flex-1 slide-pad flex flex-col gap-4 overflow-hidden">
        <FadeUp>
          <h2 className="text-2xl md:text-[36px] font-semibold leading-tight">
            <span className="text-white">Em 14 das 15 palavras estratégicas,</span><br />
            <span className="text-[var(--coral)]">a Ingecold não aparece no Google.</span>
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 flex-1 overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 overflow-hidden content-start">
            {KW.map((k, i) => (
              <FadeUp key={i}>
                <KWCard {...k} />
              </FadeUp>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <FadeUp>
              <div className="rounded-2xl p-5 glass" style={{ borderColor: "var(--coral)" }}>
                <div className="text-[var(--amber)] text-5xl md:text-[64px] font-bold leading-none">14/15</div>
                <div className="text-white text-sm mt-2">palavras estratégicas sem presença Ingecold</div>
              </div>
            </FadeUp>
            <FadeUp>
              <div className="rounded-2xl p-5" style={{ background: "rgba(10,126,106,0.25)", border: "1px solid var(--teal-mid)" }}>
                <div className="text-white text-xl font-bold">3 nichos EXCLUSIVOS</div>
                <div className="text-[var(--mint)] text-xs mt-2">balcão sushi · câmara fermentação · freezer gourmet</div>
                <div className="text-white/70 text-xs mt-2 italic">Zero concorrente nestas buscas — janela aberta</div>
              </div>
            </FadeUp>
            <FadeUp>
              <div className="rounded-2xl p-4 bg-[var(--amber-lt)] flex items-center gap-3">
                <div className="w-24 h-24 shrink-0">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={SHARE} dataKey="v" innerRadius={26} outerRadius={42} paddingAngle={2}>
                        {SHARE.map((s, i) => <Cell key={i} fill={s.c} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                  <div className="text-[var(--navy)] text-xs font-bold uppercase tracking-wider mb-2">Share of search</div>
                  {SHARE.map((s) => (
                    <div key={s.name} className="flex items-center gap-2 text-[11px] text-[var(--navy)]">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.c }} />
                      <span className="font-semibold">{s.name}</span>
                      <span className="font-mono ml-auto">{s.v}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

function KWCard({ kw, vol, prat, ing, status }: any) {
  const border = status === "exclusive" ? "var(--green)" : status === "priority" ? "var(--amber)" : "var(--coral)";
  return (
    <div className="rounded-lg p-2.5 bg-white/5 border-l-[3px] flex flex-col gap-1" style={{ borderLeftColor: border }}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-white text-[11px] font-semibold leading-tight">{kw}</div>
        <span className="text-[9px] text-[var(--amber)] font-mono shrink-0">{vol}</span>
      </div>
      <div className="text-[9px] text-white/60">P: <span className="text-white/80">{prat}</span></div>
      <div className="text-[9px]">I: <span className={ing === "NÃO APARECE" ? "text-[var(--coral)] font-bold" : "text-[var(--mint)]"}>{ing}</span></div>
    </div>
  );
}
