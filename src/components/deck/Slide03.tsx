import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";
import { SlideShell, FadeUp } from "./SlideShell";

const GOOGLE = [
  { i: "⚡", t: "Search Ads", d: "captura quem busca agora", p: "R$3-8/clique" },
  { i: "📍", t: "Google Maps", d: "buscas locais", p: "GRATUITO" },
  { i: "🌱", t: "SEO Orgânico", d: "presença duradoura", p: "R$2-4K/mês" },
  { i: "▶", t: "YouTube", d: "vídeo de produto 24h/dia", p: "R$0,10/view" },
];
const META = [
  { i: "📸", t: "Instagram Orgânico", d: "portfólio visual", p: "GRATUITO" },
  { i: "🎯", t: "Instagram Ads", d: "segmenta arquitetos/chefs", p: "R$0,30/CPM" },
  { i: "👔", t: "LinkedIn Ads", d: "decisores de redes", p: "R$8-15/clique" },
  { i: "📣", t: "Facebook Ads", d: "dono de negócio 35-55 anos", p: "R$0,50/CPM" },
];
const BUDGET = [
  { name: "Google", v: 65, c: "var(--teal-mid)" },
  { name: "Meta", v: 20, c: "var(--coral)" },
  { name: "LinkedIn", v: 15, c: "var(--purp)" },
];

export default function Slide03() {
  return (
    <SlideShell>
      <div className="relative z-10 flex-1 px-10 md:px-20 py-14 flex flex-col gap-6 overflow-hidden">
        <FadeUp>
          <h2 className="text-2xl md:text-[40px] font-semibold leading-tight max-w-5xl">
            <span className="text-white">Google captura quem já quer comprar.</span>{" "}
            <span className="text-[var(--amber)]">Meta cria quem ainda não quer.</span>
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          <FadeUp>
            <Panel
              header="🔍 GOOGLE"
              headerColor="var(--teal-mid)"
              sub="Demanda ATIVA"
              subBg="var(--amber)"
              borderColor="var(--teal-mid)"
              gradient="linear-gradient(160deg, var(--ocean), var(--navy))"
              rows={GOOGLE}
              footer="Resultado em 7 dias"
              footerBg="var(--green)"
              chart
            />
          </FadeUp>
          <FadeUp>
            <Panel
              header="📱 META (Instagram + Facebook)"
              headerColor="var(--amber)"
              sub="Demanda LATENTE"
              subBg="var(--teal-mid)"
              borderColor="var(--amber)"
              gradient="linear-gradient(160deg, var(--teal), var(--navy))"
              rows={META}
              footer="Resultado em 4-8 semanas"
              footerBg="var(--amber)"
            />
          </FadeUp>
        </div>

        <FadeUp>
          <div className="rounded-xl px-6 py-4 bg-[var(--amber)] text-[var(--navy)] flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <p className="text-sm md:text-[15px] font-medium leading-relaxed">
              <span className="font-bold">Google = ROI rápido. Meta = Expansão de mercado. LinkedIn = redes e franquias.</span>{" "}
              Use os três. Budget recomendado Fase 1: <span className="font-bold">R$16.500/mês total.</span>
            </p>
          </div>
        </FadeUp>
      </div>
    </SlideShell>
  );
}

function Panel({ header, headerColor, sub, subBg, borderColor, gradient, rows, footer, footerBg, chart = false }: any) {
  return (
    <div className="rounded-2xl p-6 h-full flex flex-col gap-4 border-t-2"
      style={{ background: gradient, borderTopColor: borderColor }}>
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold" style={{ color: headerColor }}>{header}</div>
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: subBg, color: "#0B2735" }}>{sub}</span>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {rows.map((r: any, i: number) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5">
            <span className="text-base">{r.i}</span>
            <div className="flex-1">
              <div className="text-white font-semibold text-sm">{r.t}</div>
              <div className="text-white/60 text-xs">{r.d}</div>
            </div>
            <span className="text-[var(--mint)] text-xs font-mono">{r.p}</span>
          </div>
        ))}
      </div>
      {chart && (
        <div className="h-20">
          <ResponsiveContainer>
            <BarChart data={BUDGET} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
              <XAxis type="number" hide domain={[0, 70]} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} width={60} axisLine={false} tickLine={false} />
              <Bar dataKey="v" radius={[0, 4, 4, 0]} label={{ fill: "#fff", fontSize: 10, position: "right", formatter: (v: any) => `${v}%` }}>
                {BUDGET.map((b, i) => <Cell key={i} fill={b.c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="flex justify-end">
        <span className="px-3 py-1 rounded-full text-[11px] font-bold text-white" style={{ background: footerBg }}>
          {footer}
        </span>
      </div>
    </div>
  );
}
