# 12. Tokenização de dimensões — ZERO classes hardcoded

Regra obrigatória para **todos os componentes UI, docs pages, stories e containers de seção** em React, Vue e Svelte.

## Princípio

O design system suporta 7 temas de densidade (Nova, Vega, Maia, Lyra, Mira, Luma, Sera). Cada tema altera **dimensões** (altura, padding, radius, shadows, font-weight) via CSS custom properties. Componentes que **hardcodam** dimensões fixas — um valor em pixels ou uma classe utilitária de tamanho fixo como `.nds-size-10` — visualmente **não respeitam o tema ativo**: ficam com densidade "Nova" mesmo quando o usuário seleciona Vega/Lyra/etc.

**Vanilla é exceção** — usa o pacote `basecoat-css` (classes `.btn`, `.input`, etc.) que não são tokenizáveis sem fork do pacote. Regras abaixo se aplicam a React/Vue/Svelte.

## Tokens disponíveis

Definidos em [`docs/shared/tokens/tokens.css`](../tokens/tokens.css) e consumidos pelo CSS standalone `.nds-*` via `var()`.

### Alturas de interativos

| Token | Default | Para que serve |
|-------|---------|----------------|
| `--height-badge` | 20px | Badge, tags compactos |
| `--height-xs` | 24px | Button size=xs, icon-xs |
| `--height-sm` | 28px | Button/Select/Toggle size=sm |
| `--height-default` | 32px | Button/Input/Select/Toggle/Textarea default |
| `--height-lg` | 36px | Button/Toggle size=lg |
| `--height-xl` | 40px | Alturas folgadas |

### Sizes de ícones / componentes quadrados

| Token | Default | Para que serve |
|-------|---------|----------------|
| `--size-xs` | 24px | icon-xs |
| `--size-sm` | 28px | icon-sm |
| `--size-default` | 32px | icon (Button size=icon), Avatar default |
| `--size-lg` | 36px | icon-lg |
| `--size-xl` | 40px | Alturas folgadas |

### Radius, shadows, fonts — já tokenizados

- `.nds-rounded-sm/md/lg` → derivados de `--radius`, `--radius-button`, `--radius-card`
- `.nds-shadow-sm/md/lg` → derivados de `--elevation-*`
- `.nds-font-medium/semibold/bold` → derivados de `--font-weight-*`

Use esses utilitários `.nds-*` normalmente — **eles já seguem o tema**.

## Como usar os tokens

As dimensões são aplicadas no CSS `.nds-*` do componente via `var()`, lendo o token — nunca cravando um valor fixo:

### ✅ CORRETO

```css
/* Button */
.nds-button {
  block-size: var(--height-default);
  padding-inline: var(--spacing-2);
  border-radius: var(--radius-button);
}

/* Icon-only button */
.nds-button[data-shape="icon"] { inline-size: var(--size-default); }

/* Input */
.nds-input { block-size: var(--height-default); }

/* Select trigger com size variants */
.nds-select-trigger[data-size="default"] { block-size: var(--height-default); }
.nds-select-trigger[data-size="sm"]      { block-size: var(--height-sm); }

/* Toggle com min-width acompanhando altura */
.nds-toggle { block-size: var(--height-default); min-inline-size: var(--height-default); }
```

### ❌ ERRADO

```css
/* Hardcoded — não respeita temas */
.nds-button { block-size: 32px; }
.nds-input  { height: 36px; }
.nds-badge  { height: 20px; }
```

## Quando usar hardcoded é aceitável

- **Spacing interno não-dimensional**: paddings e gaps consistentes entre temas (ex.: `padding-inline: var(--spacing-2)`, `gap: var(--spacing-1)`). Não precisam de token de dimensão de tema.
- **Tamanhos de SVG inline em ícones decorativos**: um ícone fixo de 16px (`.nds-icon-sm`) dentro de botões está OK (ícones pequenos não escalam com a densidade do container).
- **Altura mínima de Textarea**: `min-block-size` funcional, não é densidade de tema.
- **Containers de docs pages**: paddings internos do documento (`.nds-p-6`, `.nds-stack` com `data-spacing`) são layout de conteúdo estático, não variam com tema.
- **Elementos ilustrativos em docs pages**: screenshots, exemplos visuais inline que estão lá apenas para ilustrar — estes podem usar classes literais porque representam um "momento" do design, não o componente ativo.

Dúvida-chave para decidir: **"Se o usuário trocar de tema, essa medida precisaria mudar?"**
- Sim → tokenizar
- Não → pode ser hardcoded

## Onde aplicar

### Componentes UI primitivos (`src/components/ui/<comp>.tsx`)

Sempre use tokens para altura/size de:
- Button (todos os sizes)
- Input, Textarea (altura principal)
- Select trigger
- Toggle, ToggleGroup
- Badge
- Switch (knob width/height)
- RadioGroup, Checkbox (size do indicador)
- Slider thumb
- Avatar (size default/sm/lg)

Se criar um componente novo que tem altura interativa, siga o padrão — consulte [PATCHES.md](../../../PATCHES.md#button-dimension-tokens) para ver exemplo.

### Stories (`*.stories.*`)

Stories que renderizam HTML inline (sem usar o componente `Button`/`Input` diretamente) devem usar tokens. Ex:

```tsx
// ❌ Hardcoded
render: () => <div style={{ height: 32 }} className="nds-p-4 nds-rounded-lg nds-border-default">demo</div>

// ✅ Tokenizado
render: () => <div style={{ blockSize: 'var(--height-default)' }} className="nds-p-4 nds-rounded-lg nds-border-default">demo</div>
```

**Exceção**: stories cujo propósito é ilustrar um tamanho específico (ex: `AsAvatar24px` num `-tamanhos.stories`) podem usar o valor literal.

### Docs pages (`src/components/docs/<Comp>Docs.*`)

Containers e blocos de demonstração dentro das docs pages devem respeitar o tema:

```tsx
// ❌ Hardcoded
<div style={{ height: 40 }} className="nds-rounded-lg nds-border-default">
  <Button>Demo</Button>
</div>

// ✅ Tokenizado (ou sem altura fixa se o conteúdo dita)
<div className="nds-rounded-lg nds-border-default nds-p-4">
  <Button>Demo</Button>
</div>
```

### Section components (`src/components/docs/shared/sections/<Doc>.*`)

Os 15 containers genéricos de seção (DocsHeader, DocsDemonstration, etc.) **não devem conter alturas fixas** em cards, tabelas ou previews. Se precisar de altura, use token ou deixe o conteúdo ditar.

## Verificação automática

Para auditar um componente rapidamente:

```bash
# Encontrar dimensões hardcoded no CSS .nds-* dos componentes.
# Procura height/block-size/inline-size/size com valor literal em px
# (deveria ser var(--height-*) / var(--size-*)).
grep -niE "(block-size|inline-size|height|width)\s*:\s*[0-9]+px" docs/shared/styles/nds/*.css

# Alturas fixas cravadas via inline style em stories e docs pages
grep -rniE "(height|blockSize|inlineSize)\s*[:=]\s*['\"]?[0-9]+(px)?" design-system-*/src/components/docs/*Docs.*
grep -rniE "(height|blockSize|inlineSize)\s*[:=]\s*['\"]?[0-9]+(px)?" design-system-*/src/components/ui/*.stories.*
```

Se algum match aparecer fora dos casos aceitáveis acima, tokenize.

## Skills que consomem esta guideline

- `/dev-react`, `/dev-vue`, `/dev-svelte` — ao criar componente novo, use tokens
- `/docs-sections` — ao criar section containers, sem alturas fixas
- `/quality` — audite esta regra; reporte violações
- `/cross-stack` — verifique que as 3 stacks usam os mesmos tokens
- `/pipeline new` — garantir que todo código novo segue a regra

## Histórico

- **2026-04-21**: tokens de dimensão introduzidos junto com os 7 temas de densidade (Nova, Vega, Maia, Lyra, Mira, Luma, Sera). Patches aplicados em Button, Input, Select, Toggle, Badge. Registrado em [PATCHES.md](../../../PATCHES.md#button-dimension-tokens).
