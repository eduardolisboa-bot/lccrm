# CRM Lisboa

Build a world-class, full-screen slide deck web application for Ingecold — 

a 46-year-old premium stainless steel refrigeration manufacturer from 

Taubaté SP. This is a strategic presentation called "E3 — Análise 

Competitiva Estratégica" delivered by V4 Company.

═══════════════════════════════════════════════

CORE INTERACTION — SLIDE NAVIGATION

═══════════════════════════════════════════════

- Full viewport (100vw × 100vh) per slide — no scrolling

- Horizontal swipe navigation (touch + mouse drag)

- Left/right arrow keyboard navigation

- Dot navigation bar fixed at bottom center (12 dots)

- Large prev/next arrow buttons on left and right edges

- Slide counter: "03 / 12" top right, elegant mono font

- Current slide index persisted in localStorage — on refresh,

  returns to the last viewed slide

- Smooth slide transitions: CSS translate3d with 600ms 

  cubic-bezier(0.77,0,0.175,1) — no fade, only lateral slide

- Each slide has a subtle entrance animation for its content 

  (staggered fade-up, 80ms delay per element)

- Progress bar 2px height at very top, fills left to right as 

  slides advance, color: #0D9E87

═══════════════════════════════════════════════

DESIGN SYSTEM

═══════════════════════════════════════════════

Font: Inter from Google Fonts (weights 300, 400, 500, 600, 700)

Icon library: Lucide React

Color tokens (CSS vars):

  --navy:     #0B2735   (primary bg — dark slides)

  --ocean:    #0D4F6B   (secondary bg)

  --teal:     #0A7E6A   (accent primary)

  --teal-mid: #0D9E87   (accent secondary / glow)

  --mint:     #C8EDE7   (soft accent text)

  --amber:    #F5A623   (highlight / numbers)

  --amber-lt: #FEF0D0   (amber tint bg)

  --coral:    #E05B3A   (warning / alert)

  --coral-lt: #FADCD4   (coral tint)

  --slate:    #4A6070   (body text)

  --light:    #E5F1F7   (light bg)

  --off-wh:   #F0F7FA   (card bg light)

  --white:    #FFFFFF

  --muted:    #8CA4B0

  --green:    #2E8B57

  --green-lt: #D4EDDA

  --purp:     #4C3D8F

  --purp-lt:  #EEEDFE

  --border:   rgba(255,255,255,0.08)

Glass card style (use across all slides):

  background: rgba(255,255,255,0.04)

  border: 1px solid rgba(255,255,255,0.10)

  backdrop-filter: blur(12px)

  border-radius: 16px

  box-shadow: 0 20px 60px rgba(0,0,0,0.35), 

              0 4px 16px rgba(0,0,0,0.2)

Floating card depth effect:

  transform: translateY(0) rotate(-1deg to +1deg alternating)

  transition: transform 300ms ease, box-shadow 300ms ease

  hover: translateY(-8px) rotate(0deg) 

         box-shadow: 0 32px 80px rgba(0,0,0,0.45)

Number count-up animation: use IntersectionObserver — 

each big number counts from 0 on slide entry, 

duration 1200ms, easeOutExpo timing.

Ingecold Logo: fetch from https://www.ingecold.com.br/

  Use <img src="https://www.ingecold.com.br/wp-content/uploads/

  2020/05/Ingecold_Logo_branco.png" /> for dark slides.

  Fallback text logo: "INGECOLD" in Inter 700, color #F5A623,

  letter-spacing: 0.1em, with a small ❄️ before it or a custom

  SVG snowflake icon in teal.

═══════════════════════════════════════════════

GLOBAL LAYOUT — EVERY SLIDE

═══════════════════════════════════════════════

Fixed elements (always visible):

  Top-left: Ingecold logo (28px height, white version)

  Top-right: Slide counter "XX / 12" + V4 Company label

  Bottom: dot navigation (12 dots, active dot = filled teal, 

          inactive = white 30% opacity)

  Bottom-left: teal 2px line label: current section name

  Bottom-right: "V4 Company · 2025"

Slide section labels (shown bottom-left):

  Slides 1: CAPA

  Slides 2-3: INTRODUÇÃO DIGITAL

  Slides 4-6: ANÁLISE COMPETITIVA

  Slides 7-8: BENCHMARKING & PALAVRAS-CHAVE

  Slides 9-10: SWOT & ESTRATÉGIA

  Slides 11: 10 PROVOCAÇÕES

  Slide 12: FORECASTING

═══════════════════════════════════════════════

SLIDE 01 — CAPA

═══════════════════════════════════════════════

Background: Full navy (#0B2735) with subtle animated 

grid pattern (CSS grid lines, opacity 0.04, moving slowly 

top-right like floating geometric lines).

Layout: Two columns, 55% / 45%

LEFT COLUMN:

  - Tag pill: "E3 · ANÁLISE COMPETITIVA ESTRATÉGICA" 

    pill shape, bg teal-mid, white text, 11px bold, letter-spacing

  - Giant heading: "Tornando a" (white, 56px, light weight)

    next line: "Ingecold" (amber, 72px, 700 weight)

    next line: "Visível." (white, 56px, light weight)

  - Subtitle: "Análise competitiva · Marketing digital · 

    Palavras-chave · Forecasting de mídia"

    color: mint, 16px, 400 weight, leading 1.7

  - Horizontal rule: teal, 80px wide, 3px height

  - Two-line meta: "V4 Company + Ingecold · Encontro 3 · 2025"

    muted, 13px

  - Below: 4 horizontal metric pills in a row:

    [7 módulos] [6 concorrentes] [20 KWs] [60 min]

    Each pill: bg rgba(255,255,255,0.06), border teal,

    number in amber bold, label in white 12px

RIGHT COLUMN:

  - Large glass card (floating, rotate: 2deg) showing:

    - Top: 4 KPI boxes 2×2 grid:

      [R$12M → R$24M · Faturamento Alvo]

      [1/12 → 8/12 · Score Digital]

      [0 → 20 KWs · Presença Google]  

      [R$0 → R$10K · Invest. Marketing]

    Each box: number in amber 28px, label in white 11px

  - Ambient glow behind the card: radial gradient teal 

    rgba(13,158,135,0.15), 300px radius

═══════════════════════════════════════════════

SLIDE 02 — INTRODUÇÃO: O CANAL DIGITAL OBRIGATÓRIO

═══════════════════════════════════════════════

Background: navy with subtle diagonal stripe texture (CSS)

Layout: Full width, content stacked

TOP SECTION — large section label in amber:

  "Para empresas no início da jornada digital"

  Below: "O comportamento do comprador B2B mudou radicalmente"

  — white, 38px, 600 weight

MAIN CONTENT — 2 × 3 grid of glass cards 

(each with icon top-left, stat, description):

  Card 1 [Search icon, teal border-left]:

    "93%" amber bold 36px

    "pesquisam no Google antes de ligar"

    "Se não aparecer, não é considerado"

  Card 2 [Instagram icon, coral border-left]:

    "78%" amber bold 36px

    "buscam fotos e cases no Instagram"

    "Perfil parado = empresa morta aos olhos do cliente"

  Card 3 [Map icon, ocean border-left]:

    "71%" amber bold 36px

    "verificam Google Maps e reviews"

    "Zero reviews = desconfiança na decisão"

  Card 4 [Play icon, purp border-left]:

    "54%" amber bold 36px

    "assistem vídeo do produto no YouTube"

    "Concorrente com vídeo vence sem negociar"

  Card 5 [Users icon, green border-left]:

    "87%" amber bold 36px

    "comparam 3+ fornecedores online"

    "Sem presença = não está na comparação"

  Card 6 [Linkedin icon, teal border-left]:

    "61%" amber bold 36px

    "consultam LinkedIn de fornecedores B2B"

    "Invisível no LinkedIn = invisível para redes"

BOTTOM HIGHLIGHT BAR (coral bg, full width):

  "A Ingecold tem score digital de 1/12.

   Em 11 dos 12 critérios digitais relevantes, a empresa 

   simplesmente não existe para o comprador de 2025."

═══════════════════════════════════════════════

SLIDE 03 — GOOGLE vs META: DOIS ECOSSISTEMAS, UMA DECISÃO

═══════════════════════════════════════════════

Background: navy

TITLE: "Google captura quem já quer comprar.

         Meta cria quem ainda não quer." — 40px, white+amber split

Two large floating glass panels side by side:

LEFT PANEL — bg gradient ocean to navy, border teal 2px top:

  Header: "🔍 GOOGLE" — teal, 22px bold

  Sub: "Demanda ATIVA" — amber pill

  

  4 rows (icon + text):

  ⚡ Search Ads → captura quem busca agora · R$3-8/clique

  📍 Google Maps → buscas locais · GRATUITO

  🌱 SEO Orgânico → presença duradoura · R$2-4K/mês

  ▶ YouTube → vídeo de produto 24h/dia · R$0,10/view

  

  Bottom stat: "Resultado em 7 dias" — green pill

  

  Bar chart (mini, inline Recharts BarChart):

  Shows: [Google 65%, Meta 20%, LinkedIn 15%] budget allocation

  Bar colors: teal, coral, purp

RIGHT PANEL — bg gradient teal to navy, border amber 2px top:

  Header: "📱 META (Instagram + Facebook)" — amber, 22px bold

  Sub: "Demanda LATENTE" — teal pill

  4 rows (icon + text):

  📸 Instagram Orgânico → portfólio visual · GRATUITO

  🎯 Instagram Ads → segmenta arquitetos/chefs · R$0,30/CPM

  👔 LinkedIn Ads → decisores de redes · R$8-15/clique

  📣 Facebook Ads → dono de negócio 35-55 anos · R$0,50/CPM

  

  Bottom stat: "Resultado em 4-8 semanas" — amber pill

BOTTOM INSIGHT (amber bg, rounded):

  ⚡ "Google = ROI rápido. Meta = Expansão de mercado. 

     LinkedIn = redes e franquias. Use os três. 

     Budget recomendado Fase 1: R$16.500/mês total."

═══════════════════════════════════════════════

SLIDE 04 — MAPA COMPETITIVO

═══════════════════════════════════════════════

Background: navy with very subtle radial glow in center (teal 8%)

TITLE LEFT: "6 Concorrentes." new line "1 Oportunidade." 

  — first line: amber, second: white. 52px, 700.

CONTENT: Bubble/card layout (não tabela) —

3 cards LEFT (concorrentes diretos, bg glass dark):

  PRÁTICA

    Pill: "AMEAÇA ALTA" coral

    R$600M/ano · 1.500 func. · Investe R$45K/mês digital

    Score digital: ████████████ 11/12

    "Produto equivalente. Marketing incomparável."

  GELOPAR  

    Pill: "AMEAÇA ALTA" coral

    Médio-grande · RS · Investe R$15K/mês

    Score digital: ██████░░░░░░ 6/12

    "Produto inferior ao Ingecold. Vence por distribuição."

  METALFRIO

    Pill: "PARCEIRO POTENCIAL" teal

    R$1-2B/ano · Institucional · Bebidas corporativas

    Score digital: ██████████░░ 10/12

    "Segmento diferente. Oportunidade white label."

3 cards RIGHT (laterais/indiretos, bg slightly lighter):

  PRODUTO CHINÊS

    Pill: "RISCO CRESCENTE" amber

    Preço 40-60% menor. Sem assistência técnica.

    "Argumento: TCO. Inox dura 3x mais."

  COZINHA INDUSTRIAL

    Pill: "ENTRANTE NOVO" muted

    Começa a vender vitrines junto com cozinha.

    "Captura cliente que compra solução completa."

  PRODUTO USADO (OLX/ML)

    Pill: "SAZONAL" muted

    Adiamento de compra. Retrofit.

    "Ciclo de venda mais longo pós-pandemia."

═══════════════════════════════════════════════

SLIDE 05 — 4Ps: PRÁTICA vs INGECOLD

═══════════════════════════════════════════════

Background: dark navy

TITLE: "Por que a Prática fatura 50x mais?" — 44px, white

SUB: "Fabricam o mesmo produto. A diferença é 100% comercial." 

— amber, 18px

LAYOUT: 5 rows (PRODUTO, PREÇO, PRAÇA, PROMOÇÃO, DIGITAL)

each row = full width horizontal comparison bar

Each row:

  [Dimensão label — 120px] | [Prática side — 45%] | [VS pill] 

  | [Ingecold side — 45%]

Row styling:

  Left side (Prática): bg rgba(13,79,107,0.5) 

  Right side (Ingecold): bg rgba(13,158,135,0.3)

  

  PRODUTO:

    Prática: "Linha padrão forno+ultra-cong. ISO certificada. 

              Fácil cotar e comparar."

    Ingecold: "Premium customizado. Inox. Design italiano. 

               Ultra-cong exclusivo. Superior em qualidade."

    Diferença pill (right): "✓ INGECOLD SUPERIOR" green

  PREÇO:

    Prática: "~R$28K ultra-cong. 10-24x cartão. Boleto."

    Ingecold: "+20-30% premium. Parcelamento desde ago/2024."

    Diferença pill: "⚠ Falta argumento TCO" amber

  PRAÇA:

    Prática: "Site + e-comm + representantes nacionais + feiras"

    Ingecold: "SP metro. Só indicação. Zero canal digital."

    Diferença pill: "🔴 GAP CRÍTICO" coral

  PROMOÇÃO:

    Prática: "30+ anúncios Google. Instagram 47K. YouTube."

    Ingecold: "Zero campanha. Instagram parado desde 2023."

    Diferença pill: "🔴 GAP ABSOLUTO" coral

  DIGITAL:

    Prática: "55K visitas/mês. 3.200 palavras orgânicas. App."

    Ingecold: "<300 visitas/mês. <50 palavras orgânicas."

    Diferença pill: "🔴 INVISÍVEL" coral

BOTTOM ALERT (full width, amber border, amber bg light):

  "⚡ A Prática fatura R$600M/ano com produto equivalente. 

   A diferença inteira está em distribuição e marketing. 

   O produto Ingecold JÁ É bom o suficiente para crescer 5-10x."

═══════════════════════════════════════════════

SLIDE 06 — SCORECARD DIGITAL

═══════════════════════════════════════════════

Background: navy

TITLE: "Onde a Ingecold está no digital." new line 

       "Score: 1 de 12." — number in coral

CENTER PIECE: Horizontal progress-bar scorecard — 

the visual centerpiece of this slide.

12 criteria as rows, each with animated fill bar:

  Google Ads ativos        [Ingecold ░░░░░░░░ 0] [Prática ████████ 32]

  Google Maps completo     [Ingecold ██░░░░░░ 2/5][Prática █████████ 5/5]

  Posição Google (KWs)     [0/15 KWs][Prática 12/15 KWs]

  SEO / palavras orgânicas [<50][3.200]

  Instagram seguidores     [800][47.000]

  Instagram ativo          [0 posts/mês][12 posts/mês]

  Instagram Ads            [Não][Ativo]

  YouTube                  [0 vídeos][50+ vídeos]

  LinkedIn empresa         [Básico][3.000 seguidores]

  Site com portfolio       [Desatualizado][Completo + e-comm]

  Blog/conteúdo técnico    [Nenhum][8 artigos/mês]

  Reviews Google Maps      [0-2][120+ avaliações 4.8★]

Bar color: teal = Ingecold, coral = gap, light = Prática value

All bars animate in from left on slide entry.

Score total line:

  INGECOLD: [1/12] — one filled teal dot + 11 empty dots

  PRÁTICA:  [11/12] — eleven filled dots + 1 empty

═══════════════════════════════════════════════

SLIDE 07 — PALAVRAS-CHAVE: A INGECOLD É INVISÍVEL

═══════════════════════════════════════════════

Background: navy

TITLE: "Em 14 das 15 palavras estratégicas," new line

       "a Ingecold não aparece no Google." — coral, 42px

LAYOUT: 2 columns

LEFT (60%): Visual keyword map

  15 keyword cards in a masonry-style grid layout:

  Each card shows:

    Keyword text (bold white)

    Volume badge (amber)

    Prática: [TOP 1-3 / Pág 2 / Não aparece] with color indicator

    Ingecold: [NÃO APARECE / Pág 3-4] always in coral if not present

  

  Cards with green border = "Oportunidade exclusiva Ingecold"

  (balcão sushi, câmara fermentação, freezer gourmet)

  Cards with amber border = "Alta prioridade"

  Cards with coral border = "Perdendo para Prática"

  Keywords to show:

  vitrine refrigerada padaria · balcão refrigerado inox · 

  ultra congelador abatedor · câmara de fermentação padaria ·

  vitrine refrigerada confeitaria · balcão sushi inox ·

  vitrine expositor gelateria · abatedor de temperatura ·

  equipamentos refrigeração padaria · fabricante vitrine SP ·

  vitrine refrigerada sob medida · projeto refrigeração ·

  Ingecold · freezer inox espaço gourmet · montagem padaria

RIGHT (40%): Stats column

  3 stat cards stacked:

  

  Card 1 (coral bg glass):

    "14/15" — 72px amber

    "palavras estratégicas sem presença Ingecold"

  

  Card 2 (teal bg glass):

    "3 nichos EXCLUSIVOS" — 28px white

    "balcão sushi · câmara fermentação · freezer gourmet"

    "Zero concorrente nestas buscas — janela aberta"

  

  Card 3 (amber bg dark):

    Recharts PieChart showing:

    Prática: 68% share of organic traffic

    Gelopar: 18%

    Outros: 10%

    Ingecold: 4%

    Center label: "Share of search"

═══════════════════════════════════════════════

SLIDE 08 — SWOT VISUAL

═══════════════════════════════════════════════

Background: deep navy with subtle vignette

TITLE: "Diagnóstico completo." — 44px, amber/white

LAYOUT: 2×2 SWOT grid, each quadrant is a glass card.

Each item appears as a bullet pill (icon + text) inside each card.

FORÇAS (top-left, teal border 3px, teal glow):

  Header pill: "FORÇAS" teal bg

  8 pills, each: ✓ icon + text

  • Ultra-congelador exclusivo no segmento

  • 50 anos de reputação e rede

  • Inox premium — qualidade objetivamente superior

  • Câmara de fermentação: nicho de alta margem

  • Fábrica 7.000m² com capacidade ociosa

  • Balcão sushi: produto sem concorrente direto

  • Gestão familiar: decisão ágil

  • Customização total como diferencial

FRAQUEZAS (top-right, coral border 3px):

  Header pill: "FRAQUEZAS" coral bg

  • Score digital 1/12

  • Zero geração ativa de leads

  • Família presa na operação

  • Sem CRM — 60% das propostas perdidas

  • Sem representantes regionais ativos

  • Parcelamento só desde ago/2024

  • Instagram parado 2 anos

  • Sem linha entry-level no portfólio

OPORTUNIDADES (bottom-left, amber border 3px):

  Header pill: "OPORTUNIDADES" amber bg dark

  • +26.854 padarias abertas em 2024

  • COP-30 Belém nov/2025

  • Gelaterias premium em boom

  • Mini-freezer gourmet: produto inexistente

  • Google Ads: 14 KWs sem disputa

  • América Latina 6,7% a.a.

  • MEPS valoriza produto técnico de qualidade

  • Parceiro italiano disponível

AMEAÇAS (bottom-right, slate border 3px):

  Header pill: "AMEAÇAS" slate bg

  • Produto chinês 40-60% mais barato

  • Prática expandindo para ultra-congelador

  • Cozinha industrial entrando em vitrines

  • Arquiteto sem programa de parceria

  • Inflation de insumos (inox, cobre)

  • Mercado pesquisa online: invisível = irrelevante

  • Clientes exigindo parcelamento agressivo

═══════════════════════════════════════════════

SLIDE 09 — 4 ESTRATÉGIAS CRUZADAS

═══════════════════════════════════════════════

Background: navy

TITLE: "Quatro movimentos para dobrar o faturamento." 

— 40px white

LAYOUT: 4 large cards in a 2×2 grid

CARD SO — "Força + Oportunidade" (bg teal dark, glow teal):

  Label: "SO — EXPLORAR" teal pill

  Name: "ATAQUE DIGITAL NO NICHO TÉCNICO"

  Body: "Usar o ultra-congelador e câmara fermentação 

         para capturar o boom de gelaterias e padarias 

         artesanais — que hoje encontram a Prática no Google."

  3 action pills:

  → Google Ads ultra-cong + câmara

  → Case de gelateria antes/depois  

  → 2 influenciadores de panificação

CARD WO — "Fraqueza + Oportunidade" (bg ocean dark):

  Label: "WO — CONVERTER" ocean pill

  Name: "ESTRUTURAR A MÁQUINA DE RECEITA"

  Body: "Resolver as 3 travas críticas (leads, digital, CRM) 

         antes que a janela das 26.854 novas padarias feche."

  3 action pills:

  → Contratar SDR em 30 dias

  → Google Ads R$10K/mês

  → HubSpot CRM + WhatsApp Business

CARD ST — "Força + Ameaça" (bg navy lighter):

  Label: "ST — DEFENDER" amber pill

  Name: "CONSTRUIR MOAT DE QUALIDADE"

  Body: "Planilha TCO mostra que inox Ingecold é mais barato 

         em 5 anos. Transformar qualidade em argumento de venda."

  3 action pills:

  → Material TCO vs produto chinês

  → Vídeo cliente com produto de 8 anos

  → Programa parceria arquitetos

CARD WT — "Fraqueza + Ameaça" (bg navy with coral accent):

  Label: "WT — URGÊNCIA" coral pill

  Name: "CORRER RÁPIDO NAS 3 URGÊNCIAS"

  Body: "Instagram hoje. Reviews Google Maps hoje. 

         Boleto parcelado hoje. Custo R$300. Impacto imediato."

  3 action pills:

  → Google Maps: 20 fotos + 10 reviews

  → Instagram: reativar esta semana

  → Asaas: boleto parcelado hoje

═══════════════════════════════════════════════

SLIDE 10 — PLANO 90 DIAS

═══════════════════════════════════════════════

Background: navy

TITLE: "30 ações. 90 dias. 1 empresa transformada." — 42px

LAYOUT: 3 columns = 3 phases, each as a vertical card 

with stacked action items.

COLUMN 1 — "SEMANA 1-2 / Quick wins" (border-top teal):

  Sub: "Custo: R$300" — amber

  Actions as checklist items (checkbox UI, all unchecked):

  □ Fotografar 20+ projetos para GMN e Instagram

  □ Pedir 10 reviews no Google esta semana

  □ Habilitar boleto parcelado (Asaas)

  □ Reativar Instagram: 2 posts/semana

  □ Atualizar Google Meu Negócio completo

  □ HubSpot CRM — cadastrar pipeline atual

  □ WhatsApp Business com auto-resposta

  □ Contatar 5 arquitetos para parceria

COLUMN 2 — "SEMANA 3-6 / Estruturação" (border-top amber):

  Sub: "Custo: R$15-20K/mês" — amber

  □ Contratar SDR — R$5-7K/mês

  □ Reformular site com páginas por produto

  □ Landing page ultra-congelador

  □ Ativar Google Ads R$10K/mês

  □ Criar planilha TCO inox vs chinês

  □ Formalizar programa arquitetos

  □ Calendário editorial Instagram

COLUMN 3 — "SEMANA 7-12 / Escala" (border-top coral):

  Sub: "Custo: R$25-40K/mês" — amber

  □ Contratar AE externo SP metro

  □ Instagram Ads para arquitetos

  □ 2 cases de cliente publicados

  □ Blog técnico: 2 artigos/mês

  □ Contatar 20 redes de franquia

  □ Review do funil com dados reais

  □ Protótipo mini-freezer gourmet

KPI STRIP at bottom (horizontal, 6 metrics):

  [Leads: 2→25/mês] [Visitas: 500→5K] [Propostas: 5→30]

  [Reviews: 0→30] [Instagram: 800→3.5K] [Faturamento: R$1M→R$2M]

  Each metric: current (muted) → target (amber bold)

═══════════════════════════════════════════════

SLIDE 11 — AS 10 PROVOCAÇÕES

═══════════════════════════════════════════════

Background: navy

TITLE: "10 verdades que ninguém disse ainda." — 42px, amber

LAYOUT: A scrollable (within the slide) horizontal carousel 

of 10 tall cards. Each card is 220px wide. User can drag/swipe 

WITHIN this inner carousel while the outer navigation stays.

Show 5 cards visible at a time, with partial glimpse of 6th.

Navigation arrows inside the carousel to show all 10.

Each provocation card (glass, dark bg, accent left border):

Card 01 [coral border]:

  Number: "01" — 48px amber

  Title: "Produto não é o problema."

  Body: "Visibilidade é. Prática fatura R$600M 

          com produto equivalente."

  Pill: "Parar de refinar. Começar campanha."

Card 02 [ocean border]:

  Number: "02"

  Title: "Você perde o ultra-cong. para quem não o inventou."

  Body: "Prática está no Top 3 Google para 

          'ultra congelador'. Você aparece na Pág 3."

  Pill: "Landing page em 15 dias."

Card 03 [teal border]:

  Number: "03"

  Title: "A família não pode mais ser o comercial."

  Body: "60% das propostas ficam sem follow-up. 

          Teto físico de crescimento atingido."

  Pill: "SDR em 30 dias. ROI 10-20x."

Card 04 [amber border]:

  Number: "04"

  Title: "O arquiteto é seu maior canal não ativado."

  Body: "Decide 60%+ das compras premium. 

          Hoje tratado como obstáculo."

  Pill: "Programa parceria. Comissão documentada."

Card 05 [purp border]:

  Number: "05"

  Title: "Preço caro sem TCO = perda evitável."

  Body: "Perde R$50K de diferença sem mostrar 

          que inox dura 3x mais em 5 anos."

  Pill: "Planilha TCO esta semana."

Card 06 [ocean border]:

  Number: "06"

  Title: "Instagram parado é declaração de abandono."

  Body: "100% dos indicados pesquisam no Instagram. 

          Última post: 2023."

  Pill: "Reativar hoje. Foto de celular. Agora."

Card 07 [teal border]:

  Number: "07"

  Title: "Sem CRM você tem uma rotina de esquecimento."

  Body: "60% das propostas enviadas sem follow-up. 

          HubSpot free resolve isso em 2 horas."

  Pill: "+15-25% faturamento sem novo lead."

Card 08 [coral border]:

  Number: "08"

  Title: "Fábrica ociosa é ativo, não custo."

  Body: "Mini-freezer gourmet: produto inexistente 

          no Brasil. R$5-15K de protótipo."

  Pill: "Primeiro a entrar vence."

Card 09 [amber border]:

  Number: "09"

  Title: "O mercado foi para o digital. A empresa não foi."

  Body: "Score 1/12. Em 11 critérios digitais, 

          a empresa simplesmente não existe."

  Pill: "Sair de 1/12 para 5/12 em 30 dias."

Card 10 [navy bg lighter, all-amber]:

  Number: "10" — extra large, 64px

  Title: "A maior ameaça é a inação."

  Body: "Cada mês sem SDR = propostas perdidas. 

          Cada mês sem Google = Prática ganha posição 

          que custará R$50-100K para recuperar."

  HIGHLIGHT: "A Ingecold tem produto, história e fábrica que 

               a maioria levaria 20 anos para construir. 

               O que falta é a decisão."

  Pill: "Assinar o plano de 90 dias. Hoje."

═══════════════════════════════════════════════

SLIDE 12 — FORECASTING: TORNANDO A INGECOLD VISÍVEL

═══════════════════════════════════════════════

Background: deep navy with very subtle radial amber glow 

from center-bottom (rgba(245,166,35,0.06)).

TITLE: "Se você investir R$10.000 em marketing digital,"

       next line: "o que acontece?" — 38px white/amber

LAYOUT: Three zones stacked

ZONE 1 — FUNIL VISUAL (top third):

  6-stage animated funnel (horizontal, left to right):

  Each stage: circle with icon + number + label

  Connected by arrows with conversion rate labels

  ① MÍDIA (blue circle, money icon)

     "R$10.000/mês" — amber

     "investimento"

     Arrow: "leads rate →"

  ② IMPRESSÕES (ocean circle, eye icon)

     "~95.000" — white

     "pessoas alcançadas"

     Arrow: "CTR 2,6% →"

  ③ CLIQUES (teal circle, cursor icon)

     "~2.500" — white

     "cliques para o site"

     Arrow: "conv. 1% →"

  ④ LEADS (amber circle, user icon)

     "~28" — amber

     "leads gerados"

     Arrow: "qualif. 35% →"

  ⑤ QUALIFICADOS (coral circle, star icon)

     "~10" — white

     "leads qualificados"

     Arrow: "fech. 8% →"

  ⑥ VENDAS (green circle, trophy icon)

     "~1/mês" — green bright

     "venda fechada"

     "= R$72.000"

  Below funnel: 

  "Ciclo: 36 dias · CAC: R$15.000 · ROI: 380%"

ZONE 2 — 5 CENÁRIOS COMPARISON (middle third):

  Horizontal comparison bar for 5 investment levels:

  

  Recharts BarChart (grouped bars):

  X-axis: [R$3K, R$6K, R$10K, R$15K, R$20K]

  Bar 1 (teal): Receita adicional/mês

  Bar 2 (amber): Leads qualificados

  

  Values:

  R$3K: receita R$0-72K · leads ~3

  R$6K: R$36K · ~6

  R$10K: R$72K · ~10 ← HIGHLIGHTED with glow effect

  R$15K: R$108-144K · ~16

  R$20K: R$144K · ~23

  The R$10K bar has a special amber glow ring: 

  "ENTRADA IDEAL" label above it.

ZONE 3 — ARREMATE INÍCIO / MEIO / FIM (bottom third):

  3 horizontal cards in a row:

  [INÍCIO — navy card, teal border]:

    "O mercado tem 7M de equipamentos. 26.854 novas 

     padarias em 2024. Ingecold tem produto superior. 

     A demanda existe. O produto existe. A fábrica existe."

  [MEIO — teal card]:

    "Score digital 1/12. Invisível em 14/15 palavras-chave. 

     60% das propostas sem follow-up. Família na operação. 

     Os gaps estão mapeados. O plano está pronto."

  [FIM — amber card, dark text]:

    "R$10.000/mês → R$72.000 de receita no mês seguinte.

     ROI de 380%. Payback em 6 dias.

     R$1,47M adicional em 12 meses.

     A decisão é simples. O momento é agora."

CLOSING STATEMENT (full width, navy dark, centered):

  Ingecold logo (amber version, 40px height)

  

  "R$10.000 investidos em marketing digital na Ingecold 

   não são custo."

   (white, 24px, 400 weight)

  

  "São a compra de R$72.000 em receita no mês seguinte."

   (amber, 28px, 700 weight)

═══════════════════════════════════════════════

TECHNICAL REQUIREMENTS

═══════════════════════════════════════════════

Stack: React + TypeScript + Tailwind CSS

Charts: Recharts (BarChart, LineChart, PieChart)

Animations: Framer Motion for slide transitions + 

            content entrance animations per slide

State: 

  - currentSlide: number (0-11) 

  - persisted in localStorage key "ingecold_e3_slide"

  - restored on mount

Icons: Lucide React (Search, Instagram, MapPin, Play, 

       Users, Linkedin, TrendingUp, Target, DollarSign,

       CheckCircle, AlertTriangle, Trophy, Zap, ChevronLeft,

       ChevronRight, BarChart3)

Gesture handling:

  useRef for touch start position

  onTouchStart: record clientX

  onTouchEnd: if delta > 50px, navigate ±1 slide

  Mouse drag: same logic with mousedown/mouseup

Keyboard:

  useEffect with keydown listener:

  ArrowLeft → prev slide (min 0)

  ArrowRight → next slide (max 11)

  

Slide transition CSS:

  .slides-wrapper: display flex, no wrap

  .slide: flex-shrink 0, width 100vw, height 100vh

  Navigation: transform translateX(-currentSlide * 100vw)

  transition: transform 600ms cubic-bezier(0.77,0,0.175,1)

Content entrance animation per slide:

  Each slide's children wrapped in motion.div

  initial: { opacity: 0, y: 24 }

  animate: { opacity: 1, y: 0 }

  transition: { duration: 0.5, staggerChildren: 0.08 }

  Triggered by AnimatePresence watching currentSlide

Number count-up:

  Custom hook useCountUp(target, duration=1200, isActive)

  Uses requestAnimationFrame + easeOutExpo

  isActive = currentSlide === thisSlideIndex

Progress bar:

  Fixed top, z-index 100

  Width: `${((currentSlide + 1) / 12) * 100}%`

  Transition: width 400ms ease

Do NOT use localStorage for slide persistence in production

— use useState but also write to localStorage for the 

"last slide memory" feature on page load.

MOBILE RESPONSIVE:

  On mobile (< 768px):

  - Reduce font sizes ~30%

  - 2-col grids become 1-col stacked

  - Cards reduce padding

  - Touch gestures work natively

ACCESSIBILITY:

  aria-label on nav buttons

  role="region" + aria-label on each slide

  focusable dots with onKeyDown Enter support


Se os slides ficarem com scroll interno desnecessário: "Remove all overflow-y-auto from slides. Each slide must fit exactly 100vh with no internal scroll."

Se as animações de números não dispararem: "Trigger the useCountUp hook using a key prop that changes when currentSlide changes, so numbers always restart on slide entry."

Se quiser adicionar modo fullscreen: "Add a fullscreen button top-right that calls document.documentElement.requestFullscreen() for presentation mode."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lccrm.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4e6f7e53-c141-478d-b731-b98f4861c688).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
