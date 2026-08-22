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

### Tamanho de texto: prosa e controle são escadas diferentes

O sistema tem duas, e confundi-las quebra dos dois lados.

**Prosa** — `--text-h1…h4`, `--text-p`, `--text-label`. Derivam da base **e da
razão** (`--type-scale`), porque é a razão que cria a hierarquia entre títulos.
Quem escolhe a razão áurea na toolbar quer o h1 grande.

**Controle** — `--text-control-xs/sm/(padrão)/lg/xl`, para botão, campo, célula,
rótulo de interface. Derivam da base e **ignoram a razão**: um controle precisa
de tamanho previsível, e seguir a escala mandaria o texto do botão para 26px na
razão áurea.

| Token | Base 16px | Onde |
|-------|-----------|------|
| `--text-control-xs` | 10px | Indicador, contador, rótulo mínimo |
| `--text-control-sm` | 12px | Badge, kbd, texto auxiliar |
| `--text-control` | 14px | O padrão de interface — botão, campo, célula |
| `--text-control-lg` | 16px | Botão grande, campo grande |
| `--text-control-xl` | 18px | Título de diálogo e de sheet |

Antes desta escada existir, o CSS de componente cravava `0.875rem` e afins em
168 lugares, e **nenhum** lia `--text-*`. O efeito: quem escolhia base 18px na
toolbar via os títulos crescerem e todo controle ficar onde estava. Continuava
respeitando o zoom de fonte do navegador (tudo em `rem`), mas a base do design
system parava na prosa.

### Empilhamento: a escada é para camada, não para vizinho

Duas coisas usam `z-index` e só uma delas é do sistema.

**Camada global** — elemento que escapa do fluxo (portal, `position: fixed`) e
precisa se ordenar contra os outros overlays da página. Usa a escada:

| Token | Valor | Para que serve |
|-------|-------|----------------|
| `--z-dropdown` | 1000 | Superfície flutuante **não** portalizada, presa ao próprio contexto |
| `--z-sticky` | 1020 | Cabeçalho fixo de aplicação |
| `--z-fixed` | 1030 | Cromo fixo à viewport (painel de sidebar) |
| `--z-modal-backdrop` | 1040 | Véu atrás do diálogo |
| `--z-modal` | 1050 | Diálogo, alerta modal, sheet, drawer |
| `--z-popover` | 1060 | Popover, dropdown, select, menubar, hover-card — **acima** do modal, porque abrem de dentro dele |
| `--z-tooltip` | 1070 | Dica sobre qualquer superfície |
| `--z-toast` | 1080 | Aviso e atalho de navegação: nada pode cobri-los |

**Empilhamento local** — ordem entre irmãos dentro de uma peça só: o selo sobre
o avatar, a seta sobre o slide do carrossel, o preenchimento atrás do dia no
calendário. Continua em número pequeno (`-1`, `0`, `1`, `10`), e **não** deve
usar a escada: um `1060` no meio de um componente mente sobre o alcance, e o
número global não ajuda em nada num contexto de empilhamento próprio.

A pergunta que separa os dois: **"esse elemento precisa ficar acima de algo que
está fora do componente?"** Sim → escada. Não → número pequeno.

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

## `style` inline com valor de design — proibido nas cinco stacks

**Esta é a regra canônica.** Ela vale para as cinco stacks e para os três tipos
de arquivo, e é daqui que os `CLAUDE.md` de cada stack apontam. Não a copie: a
duplicata diverge em silêncio, e foi assim que a proibição passou meses parecendo
regra só do Angular.

Valor de design cravado em `style` inline sai do sistema. Inline vence qualquer
folha, então a declaração fica **fora do tema, fora da densidade e fora da escala
tipográfica** — e `height` cravado é o mesmo defeito de WCAG 1.4.4 que a seção
"Altura de quem tem texto" já proíbe. Vale para `style="…"`, `style={{…}}`,
`:style="{…}"`, `[style]`, `el.style.<prop> =` e `el.style.cssText =`.

**Alcance**: `src/components/ui/` (primitivo **e** stories) e
`src/components/docs/`. As docs pages são o pior lugar para a violação, não o
melhor: é o markup que o leitor copia.

**O que NÃO é violação** — e o auditor sabe distinguir cada um:

| Caso | Exemplo | Por quê |
|---|---|---|
| Propriedade mecânica | `position`, `display`, `transform`, `contain`, `object-fit`, `overflow`, `z-index` | Não existe como token; proibir geraria ruído em `display: contents` de factory |
| Valor mecânico | `auto`, `100%`, `0`, `fit-content` | Preenchimento, não medida escolhida |
| Token | `style={{ blockSize: 'var(--height-default)' }}` | É exatamente o que esta guideline pede |
| Custom property | `el.style.setProperty('--ratio', …)` | Alimenta a folha em vez de contorná-la |
| Valor dinâmico | vindo de prop, signal ou `args` | Não é literal cravado |
| Snippet exibido ao leitor | `` code: `<Tabs style="max-width: 36rem">` `` | `style` num trecho que **ensina** não é `style` aplicado |

**Corrigir é mover para classe `.nds-*`, nunca apagar o efeito.** Se a utilitária
não existir, crie a regra no CSS compartilhado seguindo o Vanilla — não crave o
valor e não invente classe fora do vocabulário (ver "Nunca invente classe
`.nds-*`" na guideline de regras gerais de cada stack).

Antes de trocar a inline por classe, confira se a **folha já faz aquilo**. Foi o
caso mais comum desta varredura: `.nds-radio-group[aria-orientation="horizontal"]`
já traz `grid-auto-flow: column` e `gap: var(--spacing-6)`, e quatro docs pages
repetiam as três declarações inline — em vanilla, sem sequer marcar o atributo,
de modo que o leitor de tela anunciava o grupo como vertical.

Portão: `node scripts/audit.mjs <slug>`, regra `inline_style_design_value`
(**high** em primitivo e docs page, **medium** em andaime de story).

**Dívida medida em 2026-08-19** (varredura das cinco stacks, já com a guarda de
snippet): 138 arquivos e 988 declarações, em 36 slugs — react 39 · vue 28 ·
svelte 26 · vanilla 45, Angular limpo. **82% delas não têm utilitária hoje**: o
que falta é `p-3`/`px-3`/`pt-*`/`pl-*` (a escada de `0.75rem`, de longe a mais
repetida), degraus de `w-*` e `max-w-*` fora de 16/20/24/32rem, e as famílias
`min-h-*`, `min-w-*`, `max-h-*` e `height` — esta última nunca deve virar
utilitária genérica sem decisão explícita, justamente por causa da WCAG 1.4.4.
Mintar essas classes é decisão de dona do projeto, não de quem passa corrigindo.

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

**Exceção**: stories cujo propósito é ilustrar um tamanho específico (ex: `AsAvatar24px` num `-sizes.stories`) podem usar o valor literal.

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

- **2026-08-19**: a proibição de `style` inline passou a ser regra geral e
  canônica desta guideline — antes vivia só no `01-regras-gerais.md` do Angular,
  e os outros quatro `CLAUDE.md` não a mencionavam. A regra `inline_style_design_value`
  do `audit.mjs` deixou de varrer só primitivo e passou a incluir stories e docs
  pages, com guarda de snippet (`snippetMask`) e leitura de `style.cssText`.
- **2026-04-21**: tokens de dimensão introduzidos junto com os 7 temas de densidade (Nova, Vega, Maia, Lyra, Mira, Luma, Sera). Patches aplicados em Button, Input, Select, Toggle, Badge. Registrado em [PATCHES.md](../../../PATCHES.md#button-dimension-tokens).

## A escada, e a preferência por múltiplos de 8

As utilitárias de dimensão têm escada **fechada** e **uniforme**. Antes não
tinham: cada degrau nascia quando alguém precisava, um eixo de cada vez, e o
resultado era `pr` com dois degraus, `ml` com um, `mr` inexistente e cinco
`min-height` avulsos em dois blocos do mesmo arquivo. Enquanto isso o
repositório cravava `min-height` em **22 valores diferentes, 257 vezes**. A
dispersão não era gente inventando: era gente sem degrau.

**Ao construir componente ou página nova, prefira múltiplos de 8.**

| família | degraus (px na densidade padrão) |
|---|---|
| espaçamento (`p`, `px`, `py`, `pt`, `pb`, `pl`, `pr`, `m*`) | 0 · 2 · 4 · **8 · 16 · 24 · 32** |
| `nds-min-h-*` | **64 · 80 · 96** · 100 · **120 · 160 · 200 · 240 · 280 · 320 · 360 · 400 · 480** |
| `nds-w-*` e `nds-max-w-*` | **224 · 288 · 320 · 384 · 448 · 512 · 640 · 768 · 1024 · 1152** |
| `nds-size-*` (quadrado) | **8 · 16 · 24 · 32 · 40 · 48 · 64** |
| `--box-height-*` | **120 · 160 · 200 · 240** · 300 |

Os degraus em negrito são múltiplos de 8. Os dois que não são existem por
motivo registrado: `nds-min-h-25` (100px) é herdado, e `--box-height-xl`
(300px) é o teto de painel que a escada de caixa já usava.

Nos eixos de espaçamento, `2px` e `4px` existem para **ajuste ótico** — alinhar
um ícone, encostar um indicador — e não para compor respiro. Se um deles é a
resposta para "quanto de espaço entre estas duas coisas", quase sempre a
resposta certa é 8 ou 16.

### `nds-w-*` e `nds-max-w-*`: mesma letra, mesmo número

As duas famílias usavam as MESMAS letras para números diferentes — `w-md` era
24rem e `max-w-md` era 28rem. Quem lia uma e escrevia a outra errava um degrau
sem nada acusar. Hoje a letra significa o mesmo nas duas; o que muda é só o
comportamento quando sobra espaço:

- **`nds-w-X`** — a caixa TEM aquela largura. É a forma para demonstração e para
  caixa que precisa da medida declarada, inclusive sob um ancestral que encolhe
  para o conteúdo. Largura declarada, sem teto: num pai mais estreito ela
  transborda, e é assim de propósito.
- **`nds-max-w-X`** — a caixa é FLUIDA e para de crescer ali. É a forma para
  conteúdo em fluxo de bloco, como uma docs page, e para quando o pai pode ser
  mais estreito que o degrau.

A família de largura **não** carrega `max-width: 100%` como rede. A primeira
versão carregava, e colapsou o painel do hover-card de 384px para 34px: painel
portalizado é absoluto, e o bloco de contenção dele é o invólucro do popper, que
tem largura zero — `100%` de zero é zero. Overlay é metade deste design system,
então a rede custava mais do que protegia.

Não use `nds-w-full nds-max-w-X`: sob ancestral que encolhe, `width: 100%` não
tem contra o que resolver e a caixa fica do tamanho do texto. O portão
`largura_fluida_sob_centered` cobra isso.

### E quando o degrau não existe?

Não crave o valor. Ou o vizinho serve, ou aquilo quer virar componente — que é
onde meio-degrau é legítimo, porque tem dono e revisão. A régua de
`--spacing-*` é contínua e tem os meios-degraus (`1-5`, `2-5`, `3`, `5`, `7`);
o vocabulário de **utility** é deliberadamente menor que ela.
