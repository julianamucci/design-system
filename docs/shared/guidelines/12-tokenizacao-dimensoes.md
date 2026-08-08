# 12. Tokenização de dimensões — ZERO classes hardcoded

Regra obrigatória para **todos os componentes UI, docs pages, stories e containers de seção** em React, Vue e Svelte.

## Princípio

O design system suporta 7 temas de densidade (Nova, Vega, Maia, Lyra, Mira, Luma, Sera). Cada tema altera **dimensões** (altura, padding, radius, shadows, font-weight) via CSS custom properties. Componentes que **hardcodam** dimensões fixas — um valor em pixels ou uma classe utilitária de tamanho fixo como `.nds-size-10` — visualmente **não respeitam o tema ativo**: ficam com densidade "Nova" mesmo quando o usuário seleciona Vega/Lyra/etc.

**Vanilla usa o CSS compartilhado `.nds-*`** (`docs/shared/styles/nds/`) — as dimensões já são tokenizadas nas próprias classes (`--height-*`/`--size-*`), sem intervenção nos primitives. Regras abaixo se aplicam a React/Vue/Svelte.

## Tokens disponíveis

Definidos em [`docs/shared/tokens/tokens.css`](../tokens/tokens.css) e consumidos pelo CSS standalone `.nds-*` via `var()`.

### Altura de quem tem texto: não é medida, é resultado

**Componente com texto não recebe `height`.** A altura sai de
`padding-block + line-height`, para o bloco crescer junto quando a pessoa
aumenta a fonte do navegador — com altura fixa, o texto cresce e o corte
acontece dentro do botão (WCAG 1.4.4, *Resize Text*, nível AA).

Por isso `--height-badge`, `--height-xs`, `--height-lg`, `--height-xl` e a
família `--spacing-btn-x*` **foram removidas**: prescreviam o oposto disso e
ninguém as consumia. Se encontrar referência a elas em algum lugar, é resíduo.

| Token | Default | Para que serve |
|-------|---------|----------------|
| `--height-sm` | 28px | Caixa sem fluxo de texto, degrau compacto |
| `--height-default` | 32px | Caixa sem fluxo de texto (ex.: `min-block-size` de barra de código) |

Repare no "sem fluxo de texto": estes dois sobraram porque servem a caixas cuja
altura não depende de tipografia. Para qualquer coisa que renderiza uma frase,
a resposta é padding.

### Quadrados sem texto

Peça sem texto **tem** medida: botão icon-only, indicador de checkbox e radio,
knob do switch, thumb do slider, círculo do avatar. Não há frase a ser cortada,
e o tamanho precisa ser previsível em qualquer contexto.

Aqui a medida vem da escada `--size-*`, que tem valor por densidade:

| Token | Default | Condensado | Confortável |
|-------|---------|-----------|-------------|
| `--size-xs` | 24px | 20px | 28px |
| `--size-sm` | 28px | 24px | 32px |
| `--size-default` | 32px | 28px | 40px |
| `--size-lg` | 36px | 32px | 44px |
| `--size-xl` | 40px | 36px | 48px |

Cravar o `rem` no lugar do token compila e passa em todo teste — só não
responde ao tema. Era o caso do botão de ícone, que era a única peça do sistema
a ignorar a densidade, e ninguém via porque o número batia com o do tema padrão.

### Radius, shadows, fonts — já tokenizados

- `.nds-rounded-sm/md/lg` → derivados de `--radius`, `--radius-button`, `--radius-card`
- `.nds-shadow-sm/md/lg` → derivados de `--elevation-*`
- `.nds-font-medium/semibold/bold` → derivados de `--font-weight-*`

Use esses utilitários `.nds-*` normalmente — **eles já seguem o tema**.

## Como usar os tokens

As dimensões são aplicadas no CSS `.nds-*` do componente via `var()`, lendo o token — nunca cravando um valor fixo:

### ✅ CORRETO

```css
/* Button — a altura é consequência do padding e da entrelinha */
.nds-button {
  padding-inline: var(--spacing-4);
  padding-block: var(--spacing-2);
  line-height: 1.25;
  border-radius: var(--radius-button);
}

/* Degrau de tamanho: muda padding e fonte, nunca height */
.nds-button-sm { padding-inline: var(--spacing-4); padding-block: var(--spacing-1); }
.nds-button-lg { padding-inline: var(--spacing-6); padding-block: var(--spacing-2); }

/* Icon-only: quadrado explícito, porque não há texto a ser cortado */
.nds-button-icon { width: 2.25rem; height: 2.25rem; padding: 0; }
```

### ❌ ERRADO

```css
/* Altura fixa em componente com texto: a 200% de zoom de fonte, a frase é
   cortada dentro da própria caixa. */
.nds-button { block-size: var(--height-default); }
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

Nada com texto declara altura — Button, Input, Textarea, Select, Toggle, Badge e
os degraus de tamanho de todos eles saem de `padding-block + line-height`.

Medida fixa entra só onde não há texto para cortar, e sempre em `rem`:
- botão icon-only (o quadrado do componente)
- indicador de Checkbox e RadioGroup
- knob do Switch
- thumb do Slider
- Avatar (o círculo é a peça inteira)

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
grep -rniE "(height|blockSize|inlineSize)\s*[:=]\s*['\"]?[0-9]+(px)?" nortear-design-system-*/src/components/docs/*Docs.*
grep -rniE "(height|blockSize|inlineSize)\s*[:=]\s*['\"]?[0-9]+(px)?" nortear-design-system-*/src/components/ui/*.stories.*
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
