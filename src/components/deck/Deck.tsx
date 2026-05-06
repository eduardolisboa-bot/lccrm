import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Snowflake } from "lucide-react";
import Slide01 from "./Slide01";
import Slide02 from "./Slide02";
import Slide03 from "./Slide03";
import Slide04 from "./Slide04";
import Slide05 from "./Slide05";
import Slide06 from "./Slide06";
import Slide07 from "./Slide07";
import Slide08 from "./Slide08";
import Slide09 from "./Slide09";
import Slide10 from "./Slide10";
import Slide11 from "./Slide11";
import Slide12 from "./Slide12";

const SECTIONS = [
  "CAPA",
  "INTRODUÇÃO DIGITAL", "INTRODUÇÃO DIGITAL",
  "ANÁLISE COMPETITIVA", "ANÁLISE COMPETITIVA", "ANÁLISE COMPETITIVA",
  "BENCHMARKING & PALAVRAS-CHAVE", "BENCHMARKING & PALAVRAS-CHAVE",
  "SWOT & ESTRATÉGIA", "SWOT & ESTRATÉGIA",
  "10 PROVOCAÇÕES",
  "FORECASTING",
];

const TOTAL = 12;
const STORAGE_KEY = "ingecold_e3_slide";

export default function Deck() {
  const [current, setCurrent] = useState(0);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);

  // Restore from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (!isNaN(n) && n >= 0 && n < TOTAL) setCurrent(n);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, String(current));
  }, [current]);

  const go = (n: number) => setCurrent(Math.max(0, Math.min(TOTAL - 1, n)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(current - 1);
      else if (e.key === "ArrowRight" || e.key === " ") go(current + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current]);

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
    startX.current = null;
  };
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a, [data-no-drag]")) return;
    dragging.current = true; startX.current = e.clientX;
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (!dragging.current || startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 80) go(current + (dx < 0 ? 1 : -1));
    dragging.current = false; startX.current = null;
  };

  const slides = [Slide01, Slide02, Slide03, Slide04, Slide05, Slide06, Slide07, Slide08, Slide09, Slide10, Slide11, Slide12];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[var(--navy)] select-none"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown} onMouseUp={onMouseUp}
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[100] bg-white/5">
        <div className="h-full bg-[var(--teal-mid)] transition-[width] duration-500 ease-out"
          style={{ width: `${((current + 1) / TOTAL) * 100}%` }} />
      </div>

      {/* Top bar */}
      <div className="fixed top-4 left-6 z-[60] flex items-center gap-2 pointer-events-none">
        <Snowflake size={20} className="text-[var(--teal-mid)]" />
        <span className="text-white font-bold tracking-widest text-sm">INGECOLD</span>
      </div>
      <div className="fixed top-4 right-6 z-[60] flex items-center gap-4 pointer-events-none">
        <span className="font-mono text-white/80 text-sm tracking-wider">
          {String(current + 1).padStart(2, "0")} / {TOTAL}
        </span>
        <span className="text-[var(--mint)] text-[11px] uppercase tracking-widest hidden md:inline">V4 Company</span>
      </div>

      {/* Slides wrapper */}
      <div
        className="flex h-full"
        style={{
          width: `${TOTAL * 100}vw`,
          transform: `translate3d(-${current * 100}vw, 0, 0)`,
          transition: "transform 600ms cubic-bezier(0.77, 0, 0.175, 1)",
        }}
      >
        {slides.map((S, i) => (
          <section key={i} role="region" aria-label={`Slide ${i + 1}`} className="w-screen h-screen shrink-0">
            <S active={current === i} />
          </section>
        ))}
      </div>

      {/* Side arrows */}
      <button
        aria-label="Anterior" onClick={() => go(current - 1)}
        disabled={current === 0}
        className="fixed left-3 top-1/2 -translate-y-1/2 z-[70] w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/8 hover:bg-white/15 backdrop-blur-md border border-white/15 text-white flex items-center justify-center disabled:opacity-20 transition"
      >
        <ChevronLeft size={26} />
      </button>
      <button
        aria-label="Próximo" onClick={() => go(current + 1)}
        disabled={current === TOTAL - 1}
        className="fixed right-3 top-1/2 -translate-y-1/2 z-[70] w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/8 hover:bg-white/15 backdrop-blur-md border border-white/15 text-white flex items-center justify-center disabled:opacity-20 transition"
      >
        <ChevronRight size={26} />
      </button>

      {/* Dot nav */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2" data-no-drag>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i} aria-label={`Ir para slide ${i + 1}`} onClick={() => go(i)}
            onKeyDown={(e) => { if (e.key === "Enter") go(i); }}
            className="rounded-full transition-all"
            style={{
              width: i === current ? 28 : 8,
              height: 8,
              background: i === current ? "var(--teal-mid)" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>

      {/* Section label bottom-left */}
      <div className="fixed bottom-6 left-6 z-[60] flex items-center gap-3 pointer-events-none">
        <div className="w-8 h-[2px] bg-[var(--teal-mid)]" />
        <span className="text-white/70 text-[10px] uppercase tracking-[0.2em] font-medium">{SECTIONS[current]}</span>
      </div>

      {/* Bottom-right */}
      <div className="fixed bottom-6 right-6 z-[60] text-white/40 text-[10px] uppercase tracking-widest font-mono pointer-events-none">
        V4 Company · 2025
      </div>
    </div>
  );
}
