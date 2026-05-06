import { SlideShell, FadeUp } from "./SlideShell";

const F = ["Ultra-congelador exclusivo no segmento","50 anos de reputação e rede","Inox premium — qualidade objetivamente superior","Câmara de fermentação: nicho de alta margem","Fábrica 7.000m² com capacidade ociosa","Balcão sushi: produto sem concorrente direto","Gestão familiar: decisão ágil","Customização total como diferencial"];
const W = ["Score digital 1/12","Zero geração ativa de leads","Família presa na operação","Sem CRM — 60% das propostas perdidas","Sem representantes regionais ativos","Parcelamento só desde ago/2024","Instagram parado 2 anos","Sem linha entry-level no portfólio"];
const O = ["+26.854 padarias abertas em 2024","COP-30 Belém nov/2025","Gelaterias premium em boom","Mini-freezer gourmet: produto inexistente","Google Ads: 14 KWs sem disputa","América Latina 6,7% a.a.","MEPS valoriza produto técnico","Parceiro italiano disponível"];
const T = ["Produto chinês 40-60% mais barato","Prática expandindo p/ ultra-congelador","Cozinha industrial entrando em vitrines","Arquiteto sem programa de parceria","Inflation de insumos (inox, cobre)","Mercado pesquisa online: invisível = irrelevante","Clientes exigindo parcelamento agressivo","Janela competitiva fechando em 12-18 meses"];

export default function Slide08() {
  return (
    <SlideShell>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.5))" }} />
      <div className="relative z-10 flex-1 slide-pad flex flex-col gap-5 overflow-hidden">
        <FadeUp>
          <h2 className="text-3xl md:text-[44px] font-semibold">
            <span className="text-[var(--amber)]">Diagnóstico</span> <span className="text-white">completo.</span>
          </h2>
        </FadeUp>

        <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1">
          <Quadrant items={F} title="FORÇAS" color="var(--teal-mid)" icon="✓" />
          <Quadrant items={W} title="FRAQUEZAS" color="var(--coral)" icon="✕" />
          <Quadrant items={O} title="OPORTUNIDADES" color="var(--amber)" icon="↑" textDark />
          <Quadrant items={T} title="AMEAÇAS" color="var(--slate)" icon="!" />
        </div>
      </div>
    </SlideShell>
  );
}

function Quadrant({ items, title, color, icon, textDark = false }: any) {
  return (
    <FadeUp className="glass p-4 flex flex-col gap-2 overflow-hidden" style={{ borderTop: `3px solid ${color}`, boxShadow: `0 0 60px -20px ${color}` } as any}>
      <span className="self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
        style={{ background: color, color: textDark ? "#0B2735" : "#fff" }}>{title}</span>
      <div className="grid grid-cols-1 gap-1.5 mt-1">
        {items.map((it: string, i: number) => (
          <div key={i} className="flex items-start gap-2 text-[11.5px] text-white/90 leading-snug">
            <span className="font-bold mt-0.5 shrink-0" style={{ color }}>{icon}</span>
            <span>{it}</span>
          </div>
        ))}
      </div>
    </FadeUp>
  );
}
