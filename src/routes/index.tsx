import { createFileRoute } from "@tanstack/react-router";
import Deck from "@/components/deck/Deck";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ingecold E3 — Análise Competitiva Estratégica · V4 Company" },
      { name: "description", content: "Tornando a Ingecold visível. Análise competitiva, marketing digital, palavras-chave e forecasting de mídia." },
      { property: "og:title", content: "Ingecold E3 — Análise Competitiva Estratégica" },
      { property: "og:description", content: "Tornando a Ingecold visível. V4 Company, 2026." },
    ],
  }),
  component: Index,
});

function Index() {
  return <Deck />;
}
