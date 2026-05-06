import { motion } from "framer-motion";
import { SlideShell, FadeUp } from "./SlideShell";

const CRITERIA = [
  { name: "Google Ads ativos", ing: "0", prat: "32", ingPct: 0, pratPct: 100 },
  { name: "Google Maps completo", ing: "2/5", prat: "5/5", ingPct: 40, pratPct: 100 },
  { name: "Posição Google (KWs)", ing: "0/15", prat: "12/15", ingPct: 0, pratPct: 80 },
  { name: "SEO / palavras orgânicas", ing: "<50", prat: "3.200", ingPct: 2, pratPct: 100 },
  { name: "Instagram seguidores", ing: "800", prat: "47.000", ingPct: 2, pratPct: 100 },
  { name: "Instagram ativo", ing: "0 posts/mês", prat: "12 posts/mês", ingPct: 0, pratPct: 100 },
  { name: "Instagram Ads", ing: "Não", prat: "Ativo", ingPct: 0, pratPct: 100 },
  { name: "YouTube", ing: "0 vídeos", prat: "50+ vídeos", ingPct: 0, pratPct: 100 },
  { name: "LinkedIn empresa", ing: "Básico", prat: "3.000 seg.", ingPct: 15, pratPct: 100 },
  { name: "Site portfolio", ing: "Desatualizado", prat: "Completo + e-comm", ingPct: 25, pratPct: 100 },
  { name: "Blog técnico", ing: "Nenhum", prat: "8 artigos/mês", ingPct: 0, pratPct: 100 },
  { name: "Reviews Google", ing: "0-2", prat: "120+ · 4.8★", ingPct: 1, pratPct: 100 },
];

export default function Slide06({ active }: { active: boolean }) {
  return (
    <SlideShell>
      <div className="relative z-10 flex-1 slide-pad flex flex-col gap-4 overflow-hidden">
        <FadeUp>
          <h2 className="text-white text-2xl md:text-[36px] font-semibold leading-tight">
            Onde a Ingecold está no digital.
          </h2>
          <p className="text-white text-xl md:text-3xl mt-1">
            Score: <span className="text-[var(--coral)] font-bold">1 de 12.</span>
          </p>
        </FadeUp>

        <div className="grid grid-cols-[1fr_60px_60px] md:grid-cols-[200px_1fr_60px_1fr_60px] gap-x-3 gap-y-1.5 text-[10px] uppercase text-white/50 tracking-widest px-1 mt-2">
          <div>Critério</div>
          <div className="hidden md:block">Ingecold</div>
          <div className="text-right">Ing.</div>
          <div className="hidden md:block">Prática</div>
          <div className="text-right">Prát.</div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
          {CRITERIA.map((c, i) => (
            <Row key={c.name} c={c} active={active} delay={i * 0.04} />
          ))}
        </div>

        <FadeUp>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <ScoreLine label="INGECOLD" score={1} color="var(--coral)" />
            <ScoreLine label="PRÁTICA" score={11} color="var(--teal-mid)" />
          </div>
        </FadeUp>
      </div>
    </SlideShell>
  );
}

function Row({ c, active, delay }: any) {
  return (
    <div className="grid grid-cols-[200px_1fr_60px_1fr_60px] gap-3 items-center text-xs">
      <div className="text-white/90 truncate">{c.name}</div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--teal-mid)" }}
          initial={{ width: 0 }}
          animate={{ width: active ? `${c.ingPct}%` : 0 }}
          transition={{ duration: 0.9, delay, ease: "easeOut" }}
        />
      </div>
      <div className="text-[var(--coral)] font-mono text-[11px] text-right">{c.ing}</div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--mint)" }}
          initial={{ width: 0 }}
          animate={{ width: active ? `${c.pratPct}%` : 0 }}
          transition={{ duration: 0.9, delay: delay + 0.15, ease: "easeOut" }}
        />
      </div>
      <div className="text-white/80 font-mono text-[11px] text-right">{c.prat}</div>
    </div>
  );
}

function ScoreLine({ label, score, color }: any) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white text-sm font-bold w-24">{label}</span>
      <div className="flex gap-1 flex-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-3 h-3 rounded-full" style={{ background: i < score ? color : "rgba(255,255,255,0.15)" }} />
        ))}
      </div>
      <span className="text-[var(--amber)] font-bold text-base font-mono">{score}/12</span>
    </div>
  );
}
