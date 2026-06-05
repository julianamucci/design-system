# Branding

Assets oficiais da marca Nortear.

```
branding/
├── simbolo.svg            ← símbolo isolado (apenas as 4 formas)
├── logo-horizontal.svg    ← logo oficial: símbolo + wordmark "Nortear." (430×160)
├── favicon.svg            ← símbolo centralizado em viewBox quadrada, p/ browser tabs
└── og-image.svg           ← 1200×630, logo horizontal centralizado sobre creme, p/ social preview
```

## Paleta

| Token | Hex | Uso |
|---|---|---|
| Wordmark | `#233037` | Letras de "Nortear" no logo |
| Teal médio | `#3A7C8A` | Parte "fria" do símbolo |
| Teal escuro | `#3B6770` | Parte "fria" do símbolo |
| Coral claro | `#E8A47C` | Parte "quente" do símbolo |
| Coral médio | `#D38F67` | Parte "quente" do símbolo · **ponto da marca** ("Nortear**.**") |
| Creme | `#FAF7F2` | Fundo de OG, superfícies de marca |

> O **ponto coral** depois de "Nortear" é parte do wordmark, não pontuação. Sempre presente. É a única cor "quente" no wordmark e funciona como acento de marca.

## Como usar no HTML do projeto

```html
<head>
  <!-- Favicon SVG (browsers modernos) -->
  <link rel="icon" type="image/svg+xml" href="/branding/favicon.svg">

  <!-- Fallback PNG/ICO p/ navegadores antigos (gerar do SVG, veja abaixo) -->
  <link rel="icon" type="image/png" sizes="32x32" href="/branding/favicon-32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/branding/apple-touch-icon.png">

  <!-- Open Graph -->
  <meta property="og:title" content="Nortear · Design System">
  <meta property="og:description" content="Componentes copiados, não dependência. TypeScript puro, sem Tailwind.">
  <meta property="og:image" content="https://nortear.dev/branding/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="website">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://nortear.dev/branding/og-image.png">
</head>
```

## Convertendo SVG → PNG/ICO

OG image precisa de **raster** pra funcionar de forma confiável (Facebook/LinkedIn não aceitam SVG; Slack desktop e WhatsApp falham silenciosamente). Converta a partir do SVG:

```bash
# resvg (Rust, mais fiel a SVG2) — recomendado
npx @resvg/resvg-cli branding/og-image.svg branding/og-image.png -w 1200
npx @resvg/resvg-cli branding/favicon.svg  branding/favicon-32.png  -w 32
npx @resvg/resvg-cli branding/favicon.svg  branding/apple-touch-icon.png -w 180

# Ou sharp (Node)
npx sharp-cli --input branding/favicon.svg --output branding/favicon-32.png resize 32

# Sem CLI: abrir no Figma/Inkscape e exportar PNG
```

Para `.ico` (IE/Edge antigo):
```bash
magick convert branding/favicon.svg -define icon:auto-resize=16,32,48 branding/favicon.ico
```

## Cuidados de manuseio

- **`logo-horizontal.svg` é a fonte canônica.** O `og-image.svg` embeda o conteúdo dele byte-a-byte, achatado num único `<g>` com transform pra centralizar no canvas 1200×630. Se o logo oficial mudar, atualize o `logo-horizontal.svg` e refaça o achatamento no `og-image.svg` (mantenha `transform="translate(-11 88) scale(2.85)"` se a viewBox da fonte continuar 430×160 com o conteúdo no mesmo lugar).
- **Não recolore o wordmark.** `#233037` é o token; usar `#3B6770` (o teal escuro do símbolo) parece coeso mas reduz contraste com o creme — falha em WCAG AA pra texto.
- **Não troque o ponto coral por preto.** O `#D38F67` é o detalhe que dá identidade ao wordmark. Sem ele vira só "Nortear" genérico.
- **OG sem tagline é proposital.** O logo oficial não tem "Design System" embaixo. Comunique o produto via `<meta property="og:description">` — texto adicional na imagem polui o que o logo já fala.
- **Favicon usa só o símbolo.** O wordmark some em 16×16/32×32. Tentar encaixar quebra a legibilidade. Em browser tabs e PWA, símbolo basta.
- **Backgrounds escuros.** Se precisar OG/wordmark em fundo escuro, o `#233037` some. Crie uma variante (`logo-horizontal-light.svg`) onde o wordmark vira `#FAF7F2` ou branco puro — não tente resolver no CSS.
- **PNG sempre exportado fresh.** Não comite PNG no repo — gere no CI a partir do SVG. Senão eles ficam dessincronizados quando o logo mudar.
