# Sistema de Design (Nortear — Angular)

O sistema visual é **compartilhado**: os tokens estão em `docs/shared/tokens/`, os temas em `docs/shared/themes/` e as regras `.nds-*` em `docs/shared/styles/nds/`. Este stack não tem CSS próprio de componente — `src/styles/globals.css` só importa o compartilhado.

Consequência prática: **corrigir visual aqui significa corrigir no compartilhado**, e a correção vale para as cinco stacks de uma vez. Se um valor divergir, o Vanilla é a referência.

---

## Cores e Variáveis

### Formato obrigatório: HSL sem vírgulas

```css
/* ✅ CORRETO */
:root {
  --primary: 220 44% 57%;
  --background: 0 0% 100%;
  --destructive: 0 84% 60%;
}

/* ❌ PROIBIDOS — rgba, oklch, hex */
--primary: rgba(94, 177, 239, 1);
--primary: oklch(71.6% 0.16 237.8);
--primary: #5eb1ef;
```

Justificativa: os tokens são consumidos como `hsl(var(--token))`, então o formato precisa dos três canais crus. HSL sem vírgulas também permite `hsl(var(--primary) / 0.5)` direto no CSS.

### Grupos de token

| Grupo | Tokens |
|---|---|
| Cores principais | `--primary`, `--secondary`, `--accent`, `--muted` |
| Estados | `--success`, `--warning`, `--destructive`, `--info` |
| Superfícies | `--background`, `--card`, `--popover` |
| Bordas e foco | `--border`, `--input`, `--ring` |
| Série de gráfico | `--chart-1` … `--chart-5` |

### Tokens de superfície — uso obrigatório

| Contexto | Tokens |
|---|---|
| Painel de conteúdo (Dialog, AlertDialog, Sheet, Drawer, Card) | `--card` / `--card-foreground` |
| Menu e overlay flutuante (DropdownMenu, ContextMenu, Menubar, Popover, HoverCard, Tooltip, Select) | `--popover` / `--popover-foreground` |
| Campo | `--input` / `--border` |
| Página | `--background` / `--foreground` |

### Cor em JavaScript

Biblioteca que desenha fora do CSS recebe cor por objeto de configuração, e ali `var(--chart-1)` chega como string literal e **não é resolvido**. Leia o token do `<html>` e passe o valor computado.

É o caso do Chart: `src/lib/echarts-theme.ts` lê os tokens do `<html>` por `getComputedStyle` e monta o tema que a lib recebe. Um `MutationObserver` na classe do `<html>` relê e reaplica, para que trocar tema, modo escuro, densidade ou fonte recolora o desenho sem remontar. Ver `08-display-components.md`.

### Texto corrido em container colorido

Em alert, badge, callout, banner e toast, **texto corrido é sempre `--foreground`**. Ícone e título podem carregar a cor semântica (elementos curtos, limiar de 3:1); descrição e corpo não, porque cor semântica sobre fundo suave raramente alcança os 4.5:1 que texto longo exige.

Contraste não pode depender de qual variante foi escolhida.

---

## Tipografia

| Grupo | Tokens |
|---|---|
| Escala de conteúdo | `--text-h1` … `--text-h4`, `--text-p`, `--text-label` |
| Escala de controle | `--text-control-xs`, `--text-control-sm`, `--text-control`, `--text-control-lg`, `--text-control-xl` |
| Peso | `--font-weight-extra-bold` (800), `--font-weight-bold` (700), `--font-weight-semi-bold` (600), `--font-weight-medium` (500), `--font-weight-regular` (400) |
| Família | `--font-family`, que aponta para `--font-family-active` — trocado pelas classes `.fonte-*` no `<html>` |

A escala de conteúdo é **derivada**: `--text-p` é `--type-base` e os demais degraus saem de `--type-scale`. Trocar a razão da escala pela toolbar recalcula tudo. Por isso não se crava tamanho: um valor fixo sai da escala e para de responder à troca.

## Dimensões

| Escada | Uso |
|---|---|
| `--spacing-*` | espaçamento, no grid de 8px na densidade padrão (`--spacing-2` = 8px) |
| `--radius-*` | raio, derivado de `--radius`; aliases por componente (`--radius-button`, `--radius-card`, `--radius-badge`) |
| `--size-*` | dimensão de elemento sem texto: ícone, alça, indicador |
| `--height-*` | altura de **container** (card, modal, sidebar) — nunca de primitivo interativo |

**Altura de primitivo interativo é resultado**, não entrada: `padding-block` mais tipografia. Botão, campo, label, badge e select crescem com a fonte do navegador (WCAG 1.4.4, Resize Text 200%). Ver `../../docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

Meio-degrau existe e é intencional (`--spacing-1-5`, `--spacing-2-5`): padding-block de campo, item de menu, tooltip. Off-grid inventado (3px, 5px, 7px) é defeito.

---

## Foco visível

O anel de foco vem do `:focus-visible` de cada regra `.nds-*` no CSS compartilhado, e é **opaco**. A construção é dupla: uma faixa da cor do fundo separando o elemento do anel, e o anel em `hsl(var(--ring))`.

Não recriar anel no componente, não usar opacidade e não desligar. Anel translúcido foi medido e reprovava contraste em seis temas.

---

## Temas e dimensões de tema

Cinco dimensões, todas trocadas por classe no `<html>` e controladas pela toolbar do Storybook:

| Dimensão | Classes |
|---|---|
| Marca | `tema-default`, `tema-warm`, `tema-cold` |
| Claro/escuro | `dark` |
| Densidade | `densidade-default`, `densidade-condensado`, `densidade-confortavel` |
| Família de fonte | `fonte-default`, `fonte-lexend`, `fonte-pt-serif`, `fonte-lxgw-wenkai` |
| Escala e base tipográfica | `escala-*`, `base-tipo-s` / `-m` / `-l` |

Movimento reduzido entra por `data-reduced-motion` no `<html>`, não por classe.

Nenhuma dessas classes é aplicada por código de componente: a fonte é o `preview.ts`. Componente que lê tema para decidir aparência está errado — quem decide é o CSS.

Para adicionar um tema, ver `12-arquitetura-projeto.md`.

---

## Variante semântica é input, não classe

```html
<!-- ✅ variante é input do componente -->
<div ndsAlert variant="warning">

<!-- ❌ classe semântica solta -->
<div ndsAlert class="nds-alert-warning-custom">
```

Alert e Badge **têm** as variantes semânticas: `success`, `warning` e `info` estão nas regras `.nds-alert-*` e `.nds-badge-*` do CSS compartilhado e são expostas como input nos dois.

> As guidelines de React e Vanilla dizem que "Badge não tem essas variantes" e mandam sobrescrever as variáveis internas escopadas. Isso está **vencido** — medido no `docs/shared/styles/nds/badge.css` e no componente das duas stacks. As variáveis escopadas (`--badge-bg` e companhia) seguem sendo o caminho para uma cor **fora** da paleta semântica, o que é outro caso; ver `../../docs/shared/guidelines/04-padroes-design-sistema.md`.

---

## Animação

Duração e curva vêm de `docs/shared/tokens/motion.css`. Toda animação respeita `prefers-reduced-motion` e a chave `data-reduced-motion`.

Overlay entra com keyframes de fade e zoom. Isso tem consequência em teste: afirmar sobre o painel no primeiro frame lê opacidade intermediária, e é assim que nasce a violação de contraste com razão perto de 1.0 no axe — elemento em transição, não paleta ruim. A correção é o teste esperar assentar (`esperarPortal` em `@/lib/wait-for-portal`), nunca desligar o portão de a11y.

Ver `../../docs/shared/guidelines/13-animacao.md`.
