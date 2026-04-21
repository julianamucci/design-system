# 12. Tokenização de dimensões — ZERO classes hardcoded

Regra obrigatória para **todos os componentes UI, docs pages, stories e containers de seção** em React, Vue e Svelte.

## Princípio

O design system suporta 7 temas (Nova, Vega, Maia, Lyra, Mira, Luma, Sera) inspirados nos styles do shadcn. Cada tema altera **dimensões** (altura, padding, radius, shadows, font-weight) via CSS custom properties. Componentes que **hardcodam** classes Tailwind como `h-8`, `size-10`, `rounded-lg`, `shadow-md` visualmente **não respeitam o tema ativo** — ficam com densidade "Nova" mesmo quando o usuário seleciona Vega/Lyra/etc.

**Basecoat é exceção** — usa o pacote `basecoat-css` (classes `.btn`, `.input`, etc.) que não são tokenizáveis sem fork do pacote. Regras abaixo se aplicam a React/Vue/Svelte.

## Tokens disponíveis

Definidos em [`docs/shared/tokens/tokens.css`](../tokens/tokens.css) e expostos ao Tailwind v4 via `@theme inline` em cada `globals.css`.

### Alturas de interativos

| Token | Default | Para que serve |
|-------|---------|----------------|
| `--height-badge` | 20px (`h-5`) | Badge, tags compactos |
| `--height-xs` | 24px (`h-6`) | Button size=xs, icon-xs |
| `--height-sm` | 28px (`h-7`) | Button/Select/Toggle size=sm |
| `--height-default` | 32px (`h-8`) | Button/Input/Select/Toggle/Textarea default |
| `--height-lg` | 36px (`h-9`) | Button/Toggle size=lg |
| `--height-xl` | 40px (`h-10`) | Alturas folgadas |

### Sizes de ícones / componentes quadrados

| Token | Default | Para que serve |
|-------|---------|----------------|
| `--size-xs` | 24px | icon-xs |
| `--size-sm` | 28px | icon-sm |
| `--size-default` | 32px | icon (Button size=icon), Avatar default |
| `--size-lg` | 36px | icon-lg |
| `--size-xl` | 40px | Alturas folgadas |

### Radius, shadows, fonts — já tokenizados

- `rounded-sm/md/lg/xl` → derivados de `--radius`, `--radius-button`, `--radius-card`
- `shadow-sm/md/lg/xl` → derivados de `--elevation-*`
- `font-medium/semibold/bold` → derivados de `--font-weight-*`

Use essas classes Tailwind normalmente — **elas já seguem o tema**.

## Como usar os tokens

Tailwind v4.1+ suporta arbitrary values a partir de custom properties com o shortcut `(--var)`:

### ✅ CORRETO

```tsx
// Button
<button className="h-(--height-default) px-2.5 rounded-lg">

// Icon-only button
<button className="size-(--size-default) rounded-lg">

// Input
<input className="h-(--height-default) rounded-lg" />

// Badge
<span className="h-(--height-badge) rounded-4xl">

// Select trigger com size variants
<trigger className="data-[size=default]:h-(--height-default) data-[size=sm]:h-(--height-sm)">

// Toggle com min-width acompanhando altura
<button className="h-(--height-default) min-w-(--height-default)">
```

### ❌ ERRADO

```tsx
// Hardcoded — não respeita temas
<button className="h-8 rounded-lg">
<button className="size-10">
<input className="h-9" />
<span className="h-5">
```

## Quando usar hardcoded é aceitável

- **Spacing interno não-dimensional**: `px-2.5`, `py-1`, `gap-1.5` são paddings e gaps consistentes entre temas. Não precisam tokenizar (seria sobre-engenharia).
- **Tamanhos de SVG inline em ícones decorativos**: `[&_svg]:size-4` dentro de botões está OK (ícones pequenos não escalam com a densidade do container).
- **`min-h-16` em Textarea**: altura mínima funcional, não é densidade de tema.
- **Containers de docs pages**: paddings internos do documento (`p-6`, `gap-4`, etc.) são layout de conteúdo estático, não variam com tema.
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
render: () => <div className="h-8 px-4 rounded-lg border">demo</div>

// ✅ Tokenizado
render: () => <div className="h-(--height-default) px-4 rounded-lg border">demo</div>
```

**Exceção**: stories cujo propósito é ilustrar um tamanho específico (ex: `AsAvatar24px` num `-tamanhos.stories`) podem usar o valor literal.

### Docs pages (`src/components/docs/<Comp>Docs.*`)

Containers e blocos de demonstração dentro das docs pages devem respeitar o tema:

```tsx
// ❌ Hardcoded
<div className="h-10 rounded-lg border">
  <Button>Demo</Button>
</div>

// ✅ Tokenizado (ou sem altura fixa se o conteúdo dita)
<div className="rounded-lg border p-4">
  <Button>Demo</Button>
</div>
```

### Section components (`src/components/docs/shared/sections/<Doc>.*`)

Os 15 containers genéricos de seção (DocsHeader, DocsDemonstration, etc.) **não devem conter alturas fixas** em cards, tabelas ou previews. Se precisar de altura, use token ou deixe o conteúdo ditar.

## Verificação automática

Para auditar um componente rapidamente:

```bash
# Encontrar dimensões hardcoded em componentes UI
grep -E "\bh-(5|6|7|8|9|10|11|12)\b|\bsize-(5|6|7|8|9|10)\b" design-system-react/src/components/ui/*.tsx
grep -E "\bh-(5|6|7|8|9|10|11|12)\b|\bsize-(5|6|7|8|9|10)\b" design-system-vue/src/components/ui/**/*.{vue,ts}
grep -E "\bh-(5|6|7|8|9|10|11|12)\b|\bsize-(5|6|7|8|9|10)\b" design-system-svelte/src/components/ui/**/*.svelte

# Em stories e docs pages
grep -E "\bh-(5|6|7|8|9|10)\b" design-system-*/src/components/docs/*Docs.*
grep -E "\bh-(5|6|7|8|9|10)\b" design-system-*/src/components/ui/*.stories.*
```

Se algum match aparecer fora dos casos aceitáveis acima, tokenize.

## Skills que consomem esta guideline

- `/dev-react`, `/dev-vue`, `/dev-svelte` — ao criar componente novo, use tokens
- `/docs-sections` — ao criar section containers, sem alturas fixas
- `/quality` — audite esta regra; reporte violações
- `/cross-stack` — verifique que as 3 stacks usam os mesmos tokens
- `/pipeline new` — garantir que todo código novo segue a regra

## Histórico

- **2026-04-21**: tokens de dimensão introduzidos junto com os 7 temas shadcn (Nova, Vega, Maia, Lyra, Mira, Luma, Sera). Patches aplicados em Button, Input, Select, Toggle, Badge. Registrado em [PATCHES.md](../../../PATCHES.md#button-dimension-tokens).
