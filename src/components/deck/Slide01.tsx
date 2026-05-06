import { motion } from "framer-motion";
import { Snowflake } from "lucide-react";
import { SlideShell, FadeUp, Pill } from "./SlideShell";
import { useCountUp, formatNum } from "./useCountUp";

const KPIS = [
  { from: "R$12M", to: "R$24M", label: "Faturamento Alvo" },
  { from: "1/12", to: "8/12", label: "Score Digital" },
  { from: "0", to: "20 KWs", label: "Presença Google" },
  { from: "R$0", to: "R$10K", label: "Invest. Marketing" },
];

const METRICS = [
  { n: 7, label: "módulos" },
  { n: 6, label: "concorrentes" },
  { n: 20, label: "KWs" },
  { n: 60, label: "min" },
];

export default function Slide01({ active }: { active: boolean }) {
  return (
    <SlideShell>
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(13,158,135,0.18), transparent 70%)" }} />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[55%_45%] flex-1 slide-pad gap-12 items-center">
        <div className="flex flex-col gap-7">
          <FadeUp>
            <Pill className="bg-[var(--teal-mid)] text-white">E3 · Análise Competitiva Estratégica</Pill>
          </FadeUp>
          <FadeUp>
            <h1 className="leading-[1.05]">
              <span className="block text-white text-4xl md:text-[56px] font-light">Tornando a</span>
              <span className="block text-[var(--amber)] text-5xl md:text-[72px] font-bold tracking-tight">Ingecold</span>
              <span className="block text-white text-4xl md:text-[56px] font-light">Visível.</span>
            </h1>
          </FadeUp>
          <FadeUp>
            <p className="text-[var(--mint)] text-base leading-[1.7] max-w-md">
              Análise competitiva · Marketing digital · Palavras-chave · Forecasting de mídia
            </p>
          </FadeUp>
          <FadeUp>
            <div className="h-[3px] w-20 bg-[var(--teal-mid)]" />
          </FadeUp>
          <FadeUp>
            <p className="text-[var(--muted)] text-[13px] font-mono">
              V4 Company + Ingecold · Encontro 3 · 2026
            </p>
          </FadeUp>
          <FadeUp>
            <div className="flex flex-wrap gap-3">
              {METRICS.map((m, i) => (
                <CountPill key={i} n={m.n} label={m.label} active={active} />
              ))}
            </div>
          </FadeUp>
        </div>

        <FadeUp className="relative">
          <motion.div
            className="glass glass-hover p-8"
            initial={{ rotate: 2 }}
            animate={{ rotate: 2 }}
          >
            <div className="grid grid-cols-2 gap-5">
              {KPIS.map((k, i) => (
                <div key={i} className="rounded-xl p-5 bg-white/5 border border-white/10">
                  <div className="text-[var(--amber)] text-[26px] font-bold leading-tight">
                    {k.from} <span className="text-white/40">→</span> {k.to}
                  </div>
                  <div className="text-white/80 text-[11px] mt-2 uppercase tracking-wider">{k.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 pt-5 border-t border-white/10">
              <Snowflake size={18} className="text-[var(--teal-mid)]" />
              <span className="text-white text-sm font-mono tracking-widest">INGECOLD · 1979 → 2026</span>
            </div>
          </motion.div>
        </FadeUp>
      </div>
    </SlideShell>
  );
}

function CountPill({ n, label, active }: { n: number; label: string; active: boolean }) {
  const v = useCountUp(n, active);
  return (
    <div className="px-4 py-2 rounded-full bg-white/5 border border-[var(--teal)]/60 flex items-center gap-2">
      <span className="text-[var(--amber)] font-bold text-lg">{formatNum(v)}</span>
      <span className="text-white text-xs">{label}</span>
    </div>
  );
}
