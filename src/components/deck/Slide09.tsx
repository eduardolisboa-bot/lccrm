import { SlideShell, FadeUp } from "./SlideShell";

const CARDS = [
  {
    label: "SO — EXPLORAR", labelBg: "var(--teal-mid)",
    name: "ATAQUE DIGITAL NO NICHO TÉCNICO",
    body: "Usar o ultra-congelador e câmara fermentação para capturar o boom de gelaterias e padarias artesanais — que hoje encontram a Prática no Google.",
    actions: ["Google Ads ultra-cong + câmara", "Case de gelateria antes/depois", "2 influenciadores de panificação"],
    bg: "linear-gradient(140deg, rgba(10,126,106,0.5), rgba(11,39,53,0.9))",
    glow: "var(--teal-mid)"
  },
  {
    label: "WO — CONVERTER", labelBg: "var(--ocean)",
    name: "ESTRUTURAR A MÁQUINA DE RECEITA",
    body: "Resolver as 3 travas críticas (leads, digital, CRM) antes que a janela das 26.854 novas padarias feche.",
    actions: ["Contratar SDR em 30 dias", "Google Ads R$10K/mês", "HubSpot CRM + WhatsApp Business"],
    bg: "linear-gradient(140deg, rgba(13,79,107,0.6), rgba(11,39,53,0.9))",
    glow: "var(--ocean)"
  },
  {
    label: "ST — DEFENDER", labelBg: "var(--amber)", labelDark: true,
    name: "CONSTRUIR MOAT DE QUALIDADE",
    body: "Planilha TCO mostra que inox Ingecold é mais barato em 5 anos. Transformar qualidade em argumento de venda.",
    actions: ["Material TCO vs produto chinês", "Vídeo cliente com produto de 8 anos", "Programa parceria arquitetos"],
    bg: "linear-gradient(140deg, rgba(245,166,35,0.15), rgba(11,39,53,0.95))",
    glow: "var(--amber)"
  },
  {
    label: "WT — URGÊNCIA", labelBg: "var(--coral)",
    name: "CORRER RÁPIDO NAS 3 URGÊNCIAS",
    body: "Instagram hoje. Reviews Google Maps hoje. Boleto parcelado hoje. Custo R$300. Impacto imediato.",
    actions: ["Google Maps: 20 fotos + 10 reviews", "Instagram: reativar esta semana", "Asaas: boleto parcelado hoje"],
    bg: "linear-gradient(140deg, rgba(224,91,58,0.2), rgba(11,39,53,0.95))",
    glow: "var(--coral)"
  },
];

export default function Slide09() {
  return (
    <SlideShell>
      <div className="relative z-10 flex-1 slide-pad flex flex-col gap-5 overflow-hidden">
        <FadeUp>
          <h2 className="text-white text-2xl md:text-[40px] font-semibold leading-tight">
            Quatro movimentos para <span className="text-[var(--amber)]">dobrar o faturamento.</span>
          </h2>
        </FadeUp>

        <div className="grid grid-cols-2 grid-rows-2 gap-5 flex-1">
          {CARDS.map((c, i) => (
            <FadeUp key={i} className="rounded-2xl p-5 flex flex-col gap-3 border border-white/10 overflow-hidden"
              style={{ background: c.bg, boxShadow: `0 0 80px -30px ${c.glow}` } as any}>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: c.labelBg, color: c.labelDark ? "#0B2735" : "#fff" }}>{c.label}</span>
              </div>
              <div className="text-white text-lg md:text-xl font-bold leading-tight">{c.name}</div>
              <p className="text-white/80 text-sm leading-relaxed">{c.body}</p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {c.actions.map((a, j) => (
                  <span key={j} className="px-3 py-1.5 rounded-full text-[11px] bg-white/10 text-white border border-white/15">→ {a}</span>
                ))}
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
