import { Search, Instagram, MapPin, Play, Users, Linkedin } from "lucide-react";
import { SlideShell, FadeUp } from "./SlideShell";
import { useCountUp } from "./useCountUp";

const CARDS = [
  { Icon: Search, color: "var(--teal-mid)", n: 93, sub: "pesquisam no Google antes de ligar", note: "Se não aparecer, não é considerado" },
  { Icon: Instagram, color: "var(--coral)", n: 78, sub: "buscam fotos e cases no Instagram", note: "Perfil parado = empresa morta aos olhos do cliente" },
  { Icon: MapPin, color: "var(--ocean)", n: 71, sub: "verificam Google Maps e reviews", note: "Zero reviews = desconfiança na decisão" },
  { Icon: Play, color: "var(--purp)", n: 54, sub: "assistem vídeo do produto no YouTube", note: "Concorrente com vídeo vence sem negociar" },
  { Icon: Users, color: "var(--green)", n: 87, sub: "comparam 3+ fornecedores online", note: "Sem presença = não está na comparação" },
  { Icon: Linkedin, color: "var(--teal-mid)", n: 61, sub: "consultam LinkedIn de fornecedores B2B", note: "Invisível no LinkedIn = invisível para redes" },
];

export default function Slide02({ active }: { active: boolean }) {
  return (
    <SlideShell>
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 24px)" }} />
      <div className="relative z-10 flex-1 px-10 md:px-20 py-14 flex flex-col gap-6 overflow-hidden">
        <FadeUp>
          <div className="text-[var(--amber)] text-sm font-bold uppercase tracking-widest">
            Para empresas no início da jornada digital
          </div>
        </FadeUp>
        <FadeUp>
          <h2 className="text-white text-2xl md:text-[38px] font-semibold leading-tight max-w-4xl">
            O comportamento do comprador B2B mudou radicalmente
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1 mt-2">
          {CARDS.map((c, i) => (
            <FadeUp key={i}>
              <Card {...c} active={active} />
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="rounded-xl px-7 py-5 bg-[var(--coral)] text-white shadow-2xl">
            <p className="text-[15px] md:text-base font-medium leading-relaxed">
              <span className="font-bold">A Ingecold tem score digital de 1/12.</span>{" "}
              Em 11 dos 12 critérios digitais relevantes, a empresa simplesmente não existe para o comprador de 2025.
            </p>
          </div>
        </FadeUp>
      </div>
    </SlideShell>
  );
}

function Card({ Icon, color, n, sub, note, active }: any) {
  const v = useCountUp(n, active);
  return (
    <div className="glass glass-hover p-5 h-full flex flex-col gap-2 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />
      <Icon size={22} style={{ color }} />
      <div className="text-[var(--amber)] text-3xl md:text-4xl font-bold">{Math.round(v)}%</div>
      <div className="text-white text-sm font-medium">{sub}</div>
      <div className="text-white/60 text-xs mt-auto pt-2">{note}</div>
    </div>
  );
}
