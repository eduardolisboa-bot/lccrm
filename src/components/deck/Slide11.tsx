import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SlideShell, FadeUp } from "./SlideShell";

const PROVOS = [
  { n: "01", border: "var(--coral)", title: "Produto não é o problema.", body: "Visibilidade é. Prática fatura R$600M com produto equivalente.", pill: "Parar de refinar. Começar campanha." },
  { n: "02", border: "var(--ocean)", title: "Você perde o ultra-cong. para quem não o inventou.", body: "Prática está no Top 3 Google para 'ultra congelador'. Você aparece na Pág 3.", pill: "Landing page em 15 dias." },
  { n: "03", border: "var(--teal-mid)", title: "A família não pode mais ser o comercial.", body: "60% das propostas ficam sem follow-up. Teto físico de crescimento atingido.", pill: "SDR em 30 dias. ROI 10-20x." },
  { n: "04", border: "var(--amber)", title: "O arquiteto é seu maior canal não ativado.", body: "Decide 60%+ das compras premium. Hoje tratado como obstáculo.", pill: "Programa parceria. Comissão documentada." },
  { n: "05", border: "var(--purp)", title: "Preço caro sem TCO = perda evitável.", body: "Perde R$50K de diferença sem mostrar que inox dura 3x mais em 5 anos.", pill: "Planilha TCO esta semana." },
  { n: "06", border: "var(--ocean)", title: "Instagram parado é declaração de abandono.", body: "100% dos indicados pesquisam no Instagram. Última post: 2023.", pill: "Reativar hoje. Foto de celular. Agora." },
  { n: "07", border: "var(--teal-mid)", title: "Sem CRM você tem uma rotina de esquecimento.", body: "60% das propostas enviadas sem follow-up. HubSpot free resolve isso em 2 horas.", pill: "+15-25% faturamento sem novo lead." },
  { n: "08", border: "var(--coral)", title: "Fábrica ociosa é ativo, não custo.", body: "Mini-freezer gourmet: produto inexistente no Brasil. R$5-15K de protótipo.", pill: "Primeiro a entrar vence." },
  { n: "09", border: "var(--amber)", title: "O mercado foi para o digital. A empresa não foi.", body: "Score 1/12. Em 11 critérios digitais, a empresa simplesmente não existe.", pill: "Sair de 1/12 para 5/12 em 30 dias." },
  { n: "10", border: "var(--amber)", big: true, title: "A maior ameaça é a inação.", body: "Cada mês sem SDR = propostas perdidas. Cada mês sem Google = Prática ganha posição que custará R$50-100K para recuperar.", highlight: "A Ingecold tem produto, história e fábrica que a maioria levaria 20 anos para construir. O que falta é a decisão.", pill: "Assinar o plano de 90 dias. Hoje." },
];

export default function Slide11() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };
  return (
    <SlideShell>
      <div className="relative z-10 flex-1 px-10 md:px-16 py-10 flex flex-col gap-5 overflow-hidden">
        <FadeUp>
          <h2 className="text-3xl md:text-[42px] font-semibold leading-tight">
            <span className="text-[var(--amber)]">10 verdades</span>{" "}
            <span className="text-white">que ninguém disse ainda.</span>
          </h2>
        </FadeUp>

        <div className="relative flex-1 flex items-center">
          <button onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/20">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/20">
            <ChevronRight size={20} />
          </button>
          <div ref={ref}
            className="flex gap-4 overflow-x-auto scrollbar-none px-12 py-4 snap-x w-full"
            onWheel={(e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.currentTarget.scrollLeft += e.deltaY; }}}>
            {PROVOS.map((p, i) => (
              <div key={i} className="snap-start shrink-0 w-[260px] glass glass-hover p-5 flex flex-col gap-3 border-l-[3px]"
                style={{ borderLeftColor: p.border, minHeight: "100%" }}>
                <div className="text-[var(--amber)] font-bold leading-none" style={{ fontSize: p.big ? 64 : 48 }}>{p.n}</div>
                <div className="text-white font-bold text-base leading-tight">{p.title}</div>
                <div className="text-white/75 text-xs leading-relaxed">{p.body}</div>
                {p.highlight && (
                  <div className="text-[var(--amber)] text-xs font-medium italic border-l-2 border-[var(--amber)] pl-3">
                    {p.highlight}
                  </div>
                )}
                <div className="mt-auto pt-2">
                  <span className="inline-block px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/10 text-[var(--mint)] border border-white/15">
                    → {p.pill}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
