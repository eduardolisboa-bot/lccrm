import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { DollarSign, Eye, MousePointer, User, Star, Trophy } from "lucide-react";
import { SlideShell, FadeUp } from "./SlideShell";

const FUNNEL = [
  { Icon: DollarSign, color: "var(--ocean)", n: "R$10.000/mês", label: "investimento", arrow: "leads rate →" },
  { Icon: Eye, color: "var(--ocean)", n: "~95.000", label: "pessoas alcançadas", arrow: "CTR 2,6% →" },
  { Icon: MousePointer, color: "var(--teal-mid)", n: "~2.500", label: "cliques para o site", arrow: "conv. 1% →" },
  { Icon: User, color: "var(--amber)", n: "~28", label: "leads gerados", arrow: "qualif. 35% →" },
  { Icon: Star, color: "var(--coral)", n: "~10", label: "leads qualificados", arrow: "fech. 8% →" },
  { Icon: Trophy, color: "var(--green)", n: "~1/mês", label: "venda fechada", arrow: "= R$72.000" },
];

const SCEN = [
  { name: "R$3K", rec: 36, leads: 3 },
  { name: "R$6K", rec: 36, leads: 6 },
  { name: "R$10K", rec: 72, leads: 10, hl: true },
  { name: "R$15K", rec: 126, leads: 16 },
  { name: "R$20K", rec: 144, leads: 23 },
];

export default function Slide12() {
  return (
    <SlideShell>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 90%, rgba(245,166,35,0.08), transparent 50%)" }} />
      <div className="relative z-10 flex-1 px-8 md:px-14 py-8 flex flex-col gap-4 overflow-hidden">
        <FadeUp>
          <h2 className="text-xl md:text-[32px] font-semibold leading-tight">
            <span className="text-white">Se você investir R$10.000 em marketing digital,</span><br />
            <span className="text-[var(--amber)]">o que acontece?</span>
          </h2>
        </FadeUp>

        {/* FUNNEL */}
        <FadeUp className="rounded-2xl p-4 bg-white/[0.03] border border-white/10">
          <div className="grid grid-cols-6 gap-2 items-center">
            {FUNNEL.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1 relative">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: s.color, boxShadow: `0 0 30px -10px ${s.color}` }}>
                  <s.Icon size={22} className="text-white" />
                </div>
                <div className="text-white text-xs font-bold mt-1">{s.n}</div>
                <div className="text-white/60 text-[10px]">{s.label}</div>
                {i < FUNNEL.length - 1 && (
                  <div className="absolute top-7 -right-3 text-[9px] text-[var(--amber)] font-mono whitespace-nowrap">{s.arrow}</div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-[var(--mint)] text-xs mt-3 font-mono">
            Ciclo: 36 dias · CAC: R$15.000 · ROI: 380%
          </div>
        </FadeUp>

        {/* SCENARIOS */}
        <FadeUp className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 flex-1 min-h-0">
          <div className="text-white/70 text-xs uppercase tracking-widest mb-2">5 Cenários de investimento</div>
          <div className="h-32">
            <ResponsiveContainer>
              <BarChart data={SCEN} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "#0B2735", border: "1px solid #0D9E87", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="rec" name="Receita add (k)" radius={[6, 6, 0, 0]} label={{ position: "top", fill: "#fff", fontSize: 10, formatter: (v: any) => `R$${v}K` }}>
                  {SCEN.map((s, i) => <Cell key={i} fill={s.hl ? "var(--amber)" : "var(--teal-mid)"} stroke={s.hl ? "var(--amber)" : "none"} strokeWidth={s.hl ? 2 : 0} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-[var(--amber)] text-[11px] font-bold mt-1">↑ R$10K · ENTRADA IDEAL · leads ~10/mês</div>
        </FadeUp>

        {/* CLOSING */}
        <FadeUp>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 border-l-[3px] border-[var(--teal-mid)] bg-white/[0.04]">
              <div className="text-[var(--teal-mid)] text-[10px] font-bold uppercase tracking-widest mb-1">Início</div>
              <p className="text-white/85 text-[11px] leading-snug">7M de equipamentos no mercado. 26.854 padarias em 2024. Produto superior, demanda existe, fábrica existe.</p>
            </div>
            <div className="rounded-xl p-3 bg-[var(--teal)] text-white">
              <div className="text-white text-[10px] font-bold uppercase tracking-widest mb-1">Meio</div>
              <p className="text-white/95 text-[11px] leading-snug">Score 1/12. Invisível em 14/15 KWs. 60% propostas sem follow-up. Gaps mapeados. Plano pronto.</p>
            </div>
            <div className="rounded-xl p-3 bg-[var(--amber)] text-[var(--navy)]">
              <div className="text-[var(--navy)] text-[10px] font-bold uppercase tracking-widest mb-1">Fim</div>
              <p className="text-[var(--navy)] text-[11px] leading-snug font-medium">R$10K/mês → R$72K receita. ROI 380%. Payback 6 dias. R$1,47M em 12 meses.</p>
            </div>
          </div>
        </FadeUp>

        <FadeUp>
          <div className="text-center pt-2">
            <p className="text-white text-base md:text-lg font-light">
              R$10.000 investidos em marketing digital na Ingecold não são custo.
            </p>
            <p className="text-[var(--amber)] text-lg md:text-2xl font-bold mt-1">
              São a compra de R$72.000 em receita no mês seguinte.
            </p>
          </div>
        </FadeUp>
      </div>
    </SlideShell>
  );
}
