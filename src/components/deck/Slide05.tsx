import { SlideShell, FadeUp } from "./SlideShell";

const ROWS = [
  { dim: "PRODUTO", left: "Linha padrão forno+ultra-cong. ISO certificada. Fácil cotar e comparar.", right: "Premium customizado. Inox. Design italiano. Ultra-cong exclusivo. Superior em qualidade.", pill: "✓ INGECOLD SUPERIOR", pillBg: "var(--green)" },
  { dim: "PREÇO", left: "~R$28K ultra-cong. 10-24x cartão. Boleto.", right: "+20-30% premium. Parcelamento desde ago/2024.", pill: "⚠ Falta argumento TCO", pillBg: "var(--amber)" },
  { dim: "PRAÇA", left: "Site + e-comm + representantes nacionais + feiras", right: "SP metro. Só indicação. Zero canal digital.", pill: "🔴 GAP CRÍTICO", pillBg: "var(--coral)" },
  { dim: "PROMOÇÃO", left: "30+ anúncios Google. Instagram 47K. YouTube.", right: "Zero campanha. Instagram parado desde 2023.", pill: "🔴 GAP ABSOLUTO", pillBg: "var(--coral)" },
  { dim: "DIGITAL", left: "55K visitas/mês. 3.200 palavras orgânicas. App.", right: "<300 visitas/mês. <50 palavras orgânicas.", pill: "🔴 INVISÍVEL", pillBg: "var(--coral)" },
];

export default function Slide05() {
  return (
    <SlideShell>
      <div className="relative z-10 flex-1 slide-pad flex flex-col gap-4 overflow-hidden">
        <FadeUp>
          <h2 className="text-white text-3xl md:text-[44px] font-semibold leading-tight">
            Por que a Prática fatura <span className="text-[var(--amber)]">50x mais?</span>
          </h2>
        </FadeUp>
        <FadeUp>
          <p className="text-[var(--amber)] text-base md:text-lg">
            Fabricam o mesmo produto. A diferença é 100% comercial.
          </p>
        </FadeUp>

        <div className="flex flex-col gap-2 mt-2 flex-1">
          <div className="grid grid-cols-[110px_1fr_140px_1fr] gap-3 text-[10px] uppercase tracking-widest text-white/50 px-3">
            <div></div>
            <div>Prática</div>
            <div className="text-center">vs</div>
            <div>Ingecold</div>
          </div>
          {ROWS.map((r, i) => (
            <FadeUp key={i}>
              <div className="grid grid-cols-[110px_1fr_140px_1fr] gap-3 items-stretch rounded-lg overflow-hidden">
                <div className="flex items-center justify-center bg-white/5 text-[var(--amber)] font-bold text-xs tracking-widest">
                  {r.dim}
                </div>
                <div className="p-3 text-white/90 text-[13px]" style={{ background: "rgba(13,79,107,0.5)" }}>
                  {r.left}
                </div>
                <div className="flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white text-center"
                    style={{ background: r.pillBg, color: r.pillBg === "var(--amber)" ? "#0B2735" : "#fff" }}>
                    {r.pill}
                  </span>
                </div>
                <div className="p-3 text-white text-[13px]" style={{ background: "rgba(13,158,135,0.3)" }}>
                  {r.right}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="rounded-xl px-5 py-4 bg-[var(--amber-lt)] border-2 border-[var(--amber)] text-[var(--navy)]">
            <p className="text-sm md:text-[15px] font-medium leading-relaxed">
              <span className="font-bold">⚡ A Prática fatura R$600M/ano com produto equivalente.</span>{" "}
              A diferença inteira está em distribuição e marketing. O produto Ingecold JÁ É bom o suficiente para crescer 5-10x.
            </p>
          </div>
        </FadeUp>
      </div>
    </SlideShell>
  );
}
