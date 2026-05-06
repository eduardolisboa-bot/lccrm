import { SlideShell, FadeUp } from "./SlideShell";

const LEFT = [
  { name: "PRÁTICA", pill: "AMEAÇA ALTA", pillColor: "var(--coral)", line1: "R$600M/ano · 1.500 func.", line2: "Investe R$45K/mês digital", score: 11, body: "Produto equivalente. Marketing incomparável." },
  { name: "GELOPAR", pill: "AMEAÇA ALTA", pillColor: "var(--coral)", line1: "Médio-grande · RS", line2: "Investe R$15K/mês", score: 6, body: "Produto inferior ao Ingecold. Vence por distribuição." },
  { name: "METALFRIO", pill: "PARCEIRO POTENCIAL", pillColor: "var(--teal-mid)", line1: "R$1-2B/ano · Institucional", line2: "Bebidas corporativas", score: 10, body: "Segmento diferente. Oportunidade white label." },
];
const RIGHT = [
  { name: "PRODUTO CHINÊS", pill: "RISCO CRESCENTE", pillColor: "var(--amber)", body: "Preço 40-60% menor. Sem assistência técnica.", note: "Argumento: TCO. Inox dura 3x mais." },
  { name: "COZINHA INDUSTRIAL", pill: "ENTRANTE NOVO", pillColor: "var(--muted)", body: "Começa a vender vitrines junto com cozinha.", note: "Captura cliente que compra solução completa." },
  { name: "PRODUTO USADO (OLX/ML)", pill: "SAZONAL", pillColor: "var(--muted)", body: "Adiamento de compra. Retrofit.", note: "Ciclo de venda mais longo pós-pandemia." },
];

export default function Slide04() {
  return (
    <SlideShell>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(13,158,135,0.08), transparent 60%)" }} />
      <div className="relative z-10 flex-1 slide-pad grid grid-cols-1 lg:grid-cols-[28%_1fr] gap-8 items-start overflow-hidden">
        <FadeUp>
          <h2 className="font-bold leading-[1.05]" style={{ fontSize: "clamp(1.75rem, 3.2vw, 3rem)" }}>
            <span className="text-[var(--amber)] block">6 Concorrentes.</span>
            <span className="text-white block">1 Oportunidade.</span>
          </h2>
          <p className="text-[var(--mint)] text-sm mt-5 max-w-xs">
            Mapa estratégico do tabuleiro competitivo da refrigeração premium.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-4">
            {LEFT.map((c, i) => (
              <FadeUp key={i}>
                <div className="glass glass-hover p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-bold text-lg">{c.name}</div>
                    <Pill className="text-white" style={{ background: c.pillColor }}>{c.pill}</Pill>
                  </div>
                  <div className="text-white/70 text-xs mb-2">{c.line1} · {c.line2}</div>
                  <ScoreBar score={c.score} />
                  <div className="text-[var(--mint)] text-sm mt-3 italic">"{c.body}"</div>
                </div>
              </FadeUp>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {RIGHT.map((c, i) => (
              <FadeUp key={i}>
                <div className="rounded-2xl p-5 bg-white/[0.07] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-bold text-base">{c.name}</div>
                    <Pill className="text-white" style={{ background: c.pillColor }}>{c.pill}</Pill>
                  </div>
                  <div className="text-white/80 text-sm mb-2">{c.body}</div>
                  <div className="text-[var(--mint)] text-xs italic">→ {c.note}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

function Pill({ children, className = "", style }: any) {
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${className}`} style={style}>{children}</span>;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/60 text-[10px] uppercase">Score digital</span>
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-sm" style={{ background: i < score ? "var(--teal-mid)" : "rgba(255,255,255,0.1)" }} />
        ))}
      </div>
      <span className="text-[var(--amber)] text-xs font-mono font-bold">{score}/12</span>
    </div>
  );
}
