import { SlideShell, FadeUp } from "./SlideShell";

const COLS = [
  {
    title: "SEMANA 1-2", sub: "Quick wins", cost: "Custo: R$300", color: "var(--teal-mid)",
    items: ["Fotografar 20+ projetos para GMN e Instagram","Pedir 10 reviews no Google esta semana","Habilitar boleto parcelado (Asaas)","Reativar Instagram: 2 posts/semana","Atualizar Google Meu Negócio completo","HubSpot CRM — cadastrar pipeline atual","WhatsApp Business com auto-resposta","Contatar 5 arquitetos para parceria"],
  },
  {
    title: "SEMANA 3-6", sub: "Estruturação", cost: "Custo: R$15-20K/mês", color: "var(--amber)",
    items: ["Contratar SDR — R$5-7K/mês","Reformular site com páginas por produto","Landing page ultra-congelador","Ativar Google Ads R$10K/mês","Criar planilha TCO inox vs chinês","Formalizar programa arquitetos","Calendário editorial Instagram"],
  },
  {
    title: "SEMANA 7-12", sub: "Escala", cost: "Custo: R$25-40K/mês", color: "var(--coral)",
    items: ["Contratar AE externo SP metro","Instagram Ads para arquitetos","2 cases de cliente publicados","Blog técnico: 2 artigos/mês","Contatar 20 redes de franquia","Review do funil com dados reais","Protótipo mini-freezer gourmet"],
  },
];

const KPIS = [
  { label: "Leads", from: "2", to: "25/mês" },
  { label: "Visitas", from: "500", to: "5K" },
  { label: "Propostas", from: "5", to: "30" },
  { label: "Reviews", from: "0", to: "30" },
  { label: "Instagram", from: "800", to: "3.5K" },
  { label: "Faturamento", from: "R$1M", to: "R$2M" },
];

export default function Slide10() {
  return (
    <SlideShell>
      <div className="relative z-10 flex-1 px-10 md:px-16 py-10 flex flex-col gap-5 overflow-hidden">
        <FadeUp>
          <h2 className="text-white text-2xl md:text-[40px] font-semibold leading-tight">
            <span className="text-[var(--amber)]">30 ações.</span> 90 dias. <span className="text-[var(--mint)]">1 empresa transformada.</span>
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1 overflow-hidden">
          {COLS.map((c, i) => (
            <FadeUp key={i} className="glass p-5 flex flex-col gap-3" style={{ borderTop: `3px solid ${c.color}` } as any}>
              <div>
                <div className="text-white text-lg font-bold">{c.title}</div>
                <div className="text-white/60 text-xs">{c.sub}</div>
              </div>
              <div className="text-[var(--amber)] text-xs font-mono">{c.cost}</div>
              <div className="flex flex-col gap-1.5 overflow-hidden">
                {c.items.map((it, j) => (
                  <div key={j} className="flex items-start gap-2 text-[12px] text-white/90 py-1 border-b border-white/5">
                    <span className="w-3.5 h-3.5 mt-0.5 border border-white/30 rounded shrink-0" />
                    <span>{it}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="rounded-2xl p-4 bg-white/5 border border-white/10 grid grid-cols-3 md:grid-cols-6 gap-3">
            {KPIS.map((k, i) => (
              <div key={i} className="text-center">
                <div className="text-white/60 text-[10px] uppercase tracking-wider">{k.label}</div>
                <div className="text-sm">
                  <span className="text-white/40">{k.from}</span>
                  <span className="text-white/40 mx-1">→</span>
                  <span className="text-[var(--amber)] font-bold">{k.to}</span>
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </SlideShell>
  );
}
