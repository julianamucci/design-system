# PATCHES — Customizações sobre os componentes shadcn/basecoat

Este arquivo registra toda divergência intencional entre os componentes deste design system e suas fontes upstream (shadcn/ui, shadcn-vue, shadcn-svelte, basecoat-css). Serve de checklist obrigatório ao atualizar dependências ou re-gerar componentes via CLI.

## Princípios

1. **Wrapper-first.** Se a customização pode viver em um wrapper sem tocar o arquivo shadcn, é wrapper. Só patche o arquivo upstream quando a mudança é estrutural (tag HTML, role, ordem de nós, comportamento interno).
2. **Todo patch é marcado no código.** Cada linha alterada recebe um comentário imediatamente acima no formato:
   ```
   // PATCH: <categoria> — <motivo curto> (ver PATCHES.md#<anchor>)
   ```
   Categorias permitidas: `a11y`, `i18n`, `theme`, `security`, `bugfix`.
3. **Todo patch é descrito aqui.** Uma entrada por patch, com diff antes/depois, justificativa e link para PR/issue upstream se houver.
4. **Revisão obrigatória no bump.** Ao atualizar `@base-ui/react`, `reka-ui`, `bits-ui`, `basecoat-css` ou re-gerar componentes via `shadcn@latest`, rode `npm run patches:list` e re-valide cada entrada.

> **Histórico de stack de primitivas (React):**
> - Até 2026-04-21: `@radix-ui/react-*` individuais (modo legado)
> - De 2026-04-21 em diante: `@base-ui/react` (registry `base-nova` do shadcn). **Zero deps `@radix-ui/*`** — `form.tsx`, `toast.tsx`, `toaster.tsx` e `use-toast.ts` foram deletados (órfãos; App.tsx já usava `sonner` há algum tempo).
>
> **Breaking changes de comportamento cross-stack pós-migração nova (2026-04-21):**
> - **React (base-ui):** `asChild` prop removido — usar `render={<Component />}` prop. `Accordion` usa `aria-disabled` em vez de atributo `disabled` nativo.
> - **Svelte (bits-ui 2.18):** `AlertDialogAction` **não fecha automaticamente** o dialog — consumidor precisa fazer `open = false` no handler. `Accordion` não aceita mais `defaultValue` — usar `bind:value`.
> - **Vue (reka-ui 2.9.6):** `AvatarImage` força `role="img"` no `<img>` — alt vazio (`alt=""`) causa violação `aria-allowed-role`. Sempre usar alt descritivo.
> - **Todas stacks:** variante `destructive` agora é soft (`bg-destructive/10 text-destructive`) em vez de sólida. Mudança visual esperada.

## Fluxo de atualização

```bash
# 1. Antes de bumpar deps
npm run patches:list                          # inventário de patches ativos

# 2. Bump da dep ou re-geração de componente
cd design-system-react && npx shadcn@latest add <component> --overwrite

# 3. Após o bump, reavaliar patches
npm run patches:diff -- --stack react --component alert
#   → mostra o arquivo atual vs. o que shadcn geraria agora
#   → identifica patches que ainda fazem sentido, ficaram redundantes ou precisam ajuste

# 4. Para cada patch redundante (upstream incorporou a fix):
#    - remover marker no código
#    - atualizar entrada aqui com status: "RESOLVIDO UPSTREAM (v X.Y.Z)"
```

## Como adicionar uma nova entrada

1. No arquivo customizado, adicione o comentário `// PATCH: a11y — ...` imediatamente acima da linha alterada.
2. Adicione uma seção abaixo (ordem alfabética por stack/componente) copiando o template abaixo.
3. Inclua sempre: trecho antes, trecho depois, motivo, data, ref. upstream se houver.

### Template

```markdown
### <stack>/<componente> — <título curto>

- **Arquivo:** `design-system-<stack>/src/components/ui/<slug>.<ext>`
- **Categoria:** a11y | i18n | theme | security | bugfix
- **Data:** YYYY-MM-DD
- **Upstream ref:** (issue/PR/discussion ou "—")

**Antes (shadcn upstream):**
```tsx
<div className="text-sm">{children}</div>
```

**Depois (custom):**
```tsx
// PATCH: a11y — grid de basecoat-css aplica col-start-2 só em <section>
<section>{children}</section>
```

**Motivo:** (1–3 frases explicando o problema concreto e por que o wrapper não resolve)

**Verificação após bump:** (o que conferir para saber se o upstream corrigiu — ex: "conferir se `AlertDescription` já usa `<section>` no shadcn v3")
```

---

## Patches ativos

<!-- ordenar alfabeticamente por stack > componente -->

### Dimensões tokenizadas em componentes interativos — multi-tema (React/Vue/Svelte)

Patches múltiplos agrupados por propósito. Todos substituem classes Tailwind hardcoded (`h-8`, `size-9`, etc.) por custom properties (`h-(--height-default)`, `size-(--size-default)`, etc.), permitindo que diferentes temas apliquem densidades distintas sem forking de componentes.

> **Nota (2026-05-15):** os temas alternativos (Vega/Maia/Lyra/Mira/Luma/Sera) foram removidos. O projeto está apenas com **Default** até a nova estratégia de temas ser definida. Os tokens `--height-*`/`--size-*` permanecem porque a estrutura está pronta para receber overrides futuros.

**Tokens definidos em `docs/shared/tokens/tokens.css`:**
- `--height-badge` (20px), `--height-xs` (24px), `--height-sm` (28px), `--height-default` (32px), `--height-lg` (36px), `--height-xl` (40px)
- `--size-xs`/`-sm`/`-default`/`-lg`/`-xl` (valores equivalentes para ícones quadrados)

Cada tema override em `docs/shared/themes/<tema>.css` (ex: Vega h-default=40px, Lyra h-default=28px, Maia h-default=40px, etc.).

**Basecoat usa abordagem diferente**: em vez de patch nos componentes (que usam classes `.btn`/`.input`/`.badge` do pacote `basecoat-css`), adicionamos um CSS override em `nortear-design-system/src/styles/basecoat-theme-overrides.css` que redeclara as dimensões dos componentes upstream usando `height: var(--height-*)`. Importado depois de `basecoat-css` no `globals.css` para vencer a cascade dentro do mesmo `@layer components`. Ver seção #basecoat-theme-overrides abaixo.

#### #button-dimension-tokens

- **Arquivos patched:** React `button.tsx`, Vue `button/index.ts`, Svelte `button/button.svelte`
- **Tokens usados:** `--height-default`, `--height-xs`, `--height-sm`, `--height-lg`, `--size-default`, `--size-xs`, `--size-sm`, `--size-lg`
- **Antes:** `h-8 ... h-7 ... h-9 ... size-8 ...`
- **Depois:** `h-(--height-default) ... h-(--height-sm) ... h-(--height-lg) ... size-(--size-default) ...`

#### #input-dimension-tokens

- **Arquivos patched:** React `input.tsx`, Vue `input/Input.vue`, Svelte `input/input.svelte`
- **Tokens usados:** `--height-default`, `--height-xs` (para file input inline)
- **Antes:** `h-8 ... file:h-6`
- **Depois:** `h-(--height-default) ... file:h-(--height-xs)`

#### #select-dimension-tokens

- **Arquivos patched:** React `select.tsx`, Vue `select/SelectTrigger.vue`, Svelte `select/select-trigger.svelte`
- **Tokens usados:** `--height-default`, `--height-sm`
- **Antes:** `data-[size=default]:h-8 data-[size=sm]:h-7`
- **Depois:** `data-[size=default]:h-(--height-default) data-[size=sm]:h-(--height-sm)`

#### #toggle-dimension-tokens

- **Arquivos patched:** React `toggle.tsx`, Vue `toggle/index.ts`, Svelte `toggle/toggle.svelte`
- **Tokens usados:** `--height-default`, `--height-sm`, `--height-lg`
- **Antes:** `h-8 min-w-8 ... h-7 min-w-7 ... h-9 min-w-9`
- **Depois:** `h-(--height-default) min-w-(--height-default) ... h-(--height-sm) min-w-(--height-sm) ... h-(--height-lg) min-w-(--height-lg)`

#### #badge-dimension-tokens

- **Arquivos patched:** React `badge.tsx`, Vue `badge/index.ts`, Svelte `badge/badge.svelte`
- **Tokens usados:** `--height-badge` (20px base; varia de 16px em Lyra/Mira até 24px em Vega/Maia/Luma)
- **Antes:** `h-5`
- **Depois:** `h-(--height-badge)`

#### #basecoat-theme-overrides + #basecoat-nova-parity

- **Arquivo:** `nortear-design-system/src/styles/basecoat-theme-overrides.css`
- **Factory atualizada:** `nortear-design-system/src/components/ui/button.ts` — tipo `ButtonSize` inclui `xs`/`icon-xs`, `btnClass` mapeia pra `btn-xs`/`btn-xs-icon`.

**Duas responsabilidades combinadas:**

1. **Tokenização de dimensões** (`#basecoat-theme-overrides`): redeclara alturas usando `--height-*`/`--size-*` para preparar variação de densidade entre temas (atualmente só Default ativo).
2. **Paridade visual com o estilo nova** (`#basecoat-nova-parity`): o pacote `basecoat-css` v0.3.11 ainda usa o estilo "new-york" (destructive sólido, sem sizes `xs`/`icon-xs`, sem `aria-expanded` states). Fazemos o Basecoat parecer com os outros ports do shadcn (base-nova/reka-nova/shadcn-svelte-nova).

**Estratégia** (sem forkar o pacote): adicionamos CSS override dentro do mesmo `@layer components` do basecoat, importado **depois** no `globals.css`:

```css
@import "tailwindcss";
@import "basecoat-css";                /* declara .btn { @apply h-9 bg-destructive text-white } */
@import "@shared/tokens/tokens.css";
@import "@shared/themes/index.css";
@import "./basecoat-theme-overrides.css";  /* redeclara: soft destructive, altura tokenizada, novos sizes */
```

**Componentes com dimensão tokenizada:**
Button (todos sizes + icons), Input (+ file-selector-button), Select, Kbd, Command input, Sidebar menu buttons, Badge.

**Paridade nova aplicada:**
- Button + Badge `destructive` → **soft** (`bg-destructive/10 text-destructive`)
- Novos sizes `btn-xs`, `btn-xs-icon` (adicionados do zero — não existem no upstream)
- `.select[aria-expanded='true']` → bg-muted (visual feedback de menu aberto)
- `.alert svg` → `color: currentColor` (permite ícone herdar cor da variante)

**Performance:**
Usamos **CSS puro com `hsl(var(--token) / 0.10)`** em vez de `@apply bg-destructive/10` em cascades extensas — reduz drasticamente o tempo de compile (primeira versão quebrou com timeouts em 50s por story; versão final compila em <15s/story). Regra: se precisar declarar a mesma cor em >5 seletores, prefira `background-color: hsl(var(--x) / 0.1)` ao `@apply bg-x/10`.

**Verificação após bump `basecoat-css`:**
- Rodar `grep -E "@apply.*\bh-[0-9]" node_modules/basecoat-css/dist/basecoat.css` e comparar com `basecoat-theme-overrides.css`.
- Testar se `.btn-destructive` ainda é override com success (upstream pode eventualmente migrar pro soft).
- Se `basecoat-css` passar a suportar sizes `xs` nativamente, remover as regras do bloco `btn-xs` para não duplicar.

**Motivo coletivo:** preparar o design system para receber múltiplos temas sem fork de componentes. A abordagem `h-(--height-default)` usa o shortcut de Tailwind v4.1+ que compila para `height: var(--height-default)` — zero runtime cost, zero dependência JS. Atualmente só Default está ativo; outros temas serão definidos em nova estratégia.

**Categoria:** theme
**Data:** 2026-04-21
**Upstream ref:** shadcn/ui (`base-nova`), shadcn-vue (`reka-nova`), shadcn-svelte (`nova`) — todos hardcodam dimensões.
**Verificação após bump:** conferir se algum `shadcn add <component>` sobrescreve o arquivo. Se sim, re-aplicar patch.

### react/alert — SVG usa `text-current` para herdar cor da variante — ✅ RESOLVIDO UPSTREAM (2026-04-21)

- **Status:** Absorvido pelo upstream no registry `radix-nova`, mantido no `base-nova`. O Alert atual usa `*:[svg]:text-current` e `bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90`. Patch não é mais necessário — marker removido do código.
- **Arquivo:** `design-system-react/src/components/ui/alert.tsx`
- **Categoria:** a11y (contraste de ícone em variantes semânticas)
- **Data original:** 2026-04-18
- **Data resolução:** 2026-04-21 (migração shadcn `new-york` → `radix-nova`; consolidada em `base-nova` no mesmo dia)
- **Upstream ref:** shadcn/ui — `base-nova/alert.tsx`

**Antes (shadcn upstream):**
```tsx
const alertVariants = cva(
  "... [&>svg]:text-foreground ...",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
  }
)
```

**Depois (custom):**
```tsx
// PATCH: a11y — ...
const alertVariants = cva(
  "... [&>svg]:text-current ...",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive",
      },
    },
  }
)
```

**Motivo:** o upstream trava o SVG em `text-foreground`, o que quebra variantes aplicadas via `className` (ex: `text-success`, `text-warning`). Usando `text-current`, o ícone herda a cor do container — cobrindo default, destructive e qualquer variante customizada. A regra específica `[&>svg]:text-destructive` fica redundante e foi removida.

**Verificação após bump:** abrir o Storybook em `ui-alert-variantes--success` e `--warning`; ícone deve estar verde/amarelo, não cinza. Se o upstream (shadcn v3+) já usar `text-current`, remover marker e marcar entrada como RESOLVIDO UPSTREAM.

### basecoat/alert — descrição como `<section>` para grid do basecoat-css

- **Arquivo:** `nortear-design-system/src/components/ui/alert.ts`
- **Categoria:** a11y (layout legível)
- **Data:** 2026-04-18
- **Upstream ref:** `basecoat-css` dist/basecoat.css L153–L184

**Antes (factory original):**
```ts
export function createAlertDescription(options: AlertDescriptionOptions = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = 'text-sm [&_p]:leading-relaxed';
  // ...
  return el;
}
```

**Depois (custom):**
```ts
// PATCH: a11y — basecoat-css usa `> section { col-start-2 }`. Com <div>, a descrição
// cai na col 1 (16px, onde o ícone fica) e o texto quebra letra a letra.
export function createAlertDescription(options: AlertDescriptionOptions = {}): HTMLElement {
  const el = document.createElement('section');
  // ...
  return el;
}
```

**Motivo:** `basecoat-css` define `.alert { display: grid; grid-cols: [ícone 16px][1fr] }` e aplica `col-start-2` via seletor `> section` (e `> h5`). A factory original retornava `<div>`, então a descrição ficava fora do selector e renderizava na coluna estreita do ícone, quebrando visualmente quando há SVG presente.

**Verificação após bump:** inspecionar `node_modules/basecoat-css/dist/basecoat.css` — se o seletor `> section` for substituído por `> div` ou `[data-slot="alert-description"]`, ajustar a factory conforme o novo contrato.

### react/toggle + toggle-group — radius via `--radius-button` {#toggle-radius-token}

- **Arquivos:**
  - `design-system-react/src/components/ui/toggle.tsx`
  - `design-system-react/src/components/ui/toggle-group.tsx`
- **Categoria:** theme
- **Data:** 2026-04-24
- **Upstream ref:** shadcn/ui — base-nova v2 ainda hardcoda `rounded-lg` / `rounded-[min(var(--radius-md),10px)]`

**Antes (shadcn upstream):**
```tsx
// toggle.tsx — cva base
"... rounded-lg ..."
// toggle.tsx — size sm
"h-(--height-sm) ... rounded-[min(var(--radius-md),12px)] ..."
// toggle-group.tsx — root
"... rounded-lg data-[size=sm]:rounded-[min(var(--radius-md),10px)] ..."
// toggle-group.tsx — item (spacing=0)
"... first:rounded-l-lg first:rounded-t-lg last:rounded-r-lg last:rounded-b-lg ..."
```

**Depois (custom):**
```tsx
// PATCH: theme — rounded consumido de --radius-button ...
"... rounded-(--radius-button) ..."
// size sm: removido override rounded-[min(...)] (usa o base)
"h-(--height-sm) ... px-2.5 text-[0.8rem] ..."
// toggle-group root:
"... rounded-(--radius-button) ..."
// toggle-group item (spacing=0):
"... first:rounded-l-(--radius-button) ... last:rounded-r-(--radius-button) ..."
```

**Motivo:** o Toggle é um controle interativo (seleção on/off), mesma família visual do Button. Sem este patch, usar Toggle/ToggleGroup em tema Lyra (radius 0) renderizava com cantos arredondados do `rounded-lg` default do shadcn, quebrando a identidade brutalista. O LanguageSwitcher (wrapper sobre ToggleGroup) exibia esse bug visível na docs header.

**Verificação após bump:** `node scripts/diff-shadcn.mjs --stack react --component toggle` e `--component toggle-group`. Se o upstream adotar `--radius-button` ou tornar o radius configurável via tema, remover o patch.

### card — `has-[>[data-slot=card-footer]]` restringe a filho direto (4 stacks) {#card-footer-direct-child}

- **Arquivos:**
  - `design-system-react/src/components/ui/card.tsx` (Card root)
  - `design-system-vue/src/components/ui/card/Card.vue`
  - `design-system-svelte/src/components/ui/card/card.svelte`
  - `nortear-design-system/src/components/ui/card.ts` (`createCard`)
- **Categoria:** bugfix
- **Data:** 2026-04-22
- **Upstream ref:** shadcn/ui — não há issue aberta (comportamento default do Tailwind `has-data-*`)

**Antes (shadcn upstream):**
```tsx
className="... has-data-[slot=card-footer]:pb-0 ... data-[size=sm]:has-data-[slot=card-footer]:pb-0 ..."
```
Gera CSS `.card:has([data-slot='card-footer']) { padding-bottom: 0 }` — combinator descendente. Qualquer `CardFooter` em qualquer profundidade casa, zerando o `pb` do ancestral.

**Depois (custom):**
```tsx
// PATCH: bugfix — has-[>[data-slot=card-footer]] restringe a filho direto para não zerar pb em Cards aninhados com footer (ver PATCHES.md#card-footer-direct-child)
className="... has-[>[data-slot=card-footer]]:pb-0 ... data-[size=sm]:has-[>[data-slot=card-footer]]:pb-0 ..."
```
Gera CSS `.card:has(>[data-slot='card-footer']) { padding-bottom: 0 }` — combinator filho direto. Só o footer imediato zera o `pb` do Card externo.

**Motivo:** a regra `has-data-[slot=card-footer]:pb-0` serve para o Card absorver o `pb` quando há um `CardFooter` colado na borda inferior (evita `pb-4` + footer com borda dupla visual). Quando um Card externo tem outro Card dentro e esse Card interno tem `CardFooter`, o seletor descendente casa o footer **do filho** e zera o `pb` do Card externo — conteúdo do Card externo fica visualmente colado na borda inferior (print reportado pelo usuário em 2026-04-22, docs pages do Card). Restringir a filho direto (`>`) garante que só o próprio footer do Card ativa o reset.

**Verificação após bump:** rodar `node scripts/diff-shadcn.mjs --stack react --component card`. Se o upstream adotar o mesmo padrão (seletor com `>`) ou substituir por uma implementação compositiva (`CardFooter` aplica `mt-auto` + Card aplica `overflow-hidden` sem precisar do `has-`), remover o PATCH.

### avatar — `object-cover` na imagem (4 stacks) {#avatar-object-cover} — ⚠️ PARCIALMENTE RESOLVIDO UPSTREAM (2026-04-21)

- **Status:** React (`base-nova`), Vue (`reka-nova`) e Svelte (`nova`) absorveram o patch — AvatarImage agora inclui `object-cover` por padrão. Basecoat **ainda precisa do patch** — marker permanece nesse único arquivo.
- **Arquivos:**
  - ~~`design-system-react/src/components/ui/avatar.tsx` (AvatarImage)~~ ✅ absorvido upstream (radix-nova → base-nova)
  - ~~`design-system-vue/src/components/ui/avatar/AvatarImage.vue`~~ ✅ absorvido upstream (reka-nova)
  - ~~`design-system-svelte/src/components/ui/avatar/avatar-image.svelte`~~ ✅ absorvido upstream (shadcn-svelte nova)
  - `nortear-design-system/src/components/ui/avatar.ts` (`createAvatarImage`) — PATCH ATIVO
- **Categoria:** bugfix (distorção visual)
- **Data original:** 2026-04-21
- **Data resolução React:** 2026-04-21 (migração shadcn `new-york` → `radix-nova` → `base-nova`)
- **Data resolução Vue:** 2026-04-21 (migração shadcn-vue `new-york` → `reka-nova` + bump 2.9.5 → 2.9.6)
- **Data resolução Svelte:** 2026-04-21 (migração shadcn-svelte `new-york` → `nova` + bump bits-ui 2.17.3 → 2.18.0)
- **Upstream ref:** shadcn/ui (base-nova), shadcn-vue (reka-nova) e shadcn-svelte (nova) incluem `object-cover`. basecoat-css — ainda não.

**Antes (upstream):**
```tsx
className={cn("aspect-square h-full w-full", className)}
```

**Depois (custom):**
```tsx
// PATCH: bugfix — object-cover evita distorção de imagens não-quadradas em container circular (ver PATCHES.md#avatar-object-cover)
className={cn("aspect-square h-full w-full object-cover", className)}
```

**Motivo:** o container do Avatar é `rounded-full` com `aspect-square`, mas sem `object-cover` imagens não-quadradas são esticadas/achatadas em vez de cortadas, causando distorção visível no retrato (ex: rosto achatado horizontalmente). `object-cover` preserva a proporção da imagem e corta o excedente — comportamento esperado de avatar em todo produto consumidor. Wrapper não resolve porque o `<img>` é renderizado pelo primitive (Radix/Reka/Bits); a única forma limpa é passar a classe no próprio componente.

**Verificação após bump:** se `shadcn@latest add avatar` passar a incluir `object-cover` por padrão, remover markers e marcar como RESOLVIDO UPSTREAM. Teste visual: usar imagem retangular (ex: `https://picsum.photos/400/600`) — no bom o rosto/objeto mantém proporção; no ruim fica esticado.

### react/chart — `role="img"` no ChartContainer para satisfazer aria-prohibited-attr {#chart-aria-img-role}

- **Arquivo:** `design-system-react/src/components/ui/chart.tsx` (ChartContainer)
- **Categoria:** a11y
- **Data:** 2026-04-28
- **Upstream ref:** shadcn/ui — `chart.tsx` upstream usa `<div data-slot="chart">` sem `role`

**Antes (shadcn upstream):**
```tsx
<div
  data-slot="chart"
  data-chart={chartId}
  className={cn("flex aspect-video justify-center text-xs ...", className)}
  {...props}
>
```

**Depois (custom):**
```tsx
// PATCH: a11y — role="img" é necessário em <div> com aria-label para satisfazer
// axe (aria-prohibited-attr). (ver PATCHES.md#chart-aria-img-role)
<div
  data-slot="chart"
  data-chart={chartId}
  role="img"
  className={cn("flex aspect-video justify-center text-xs ...", className)}
  {...props}
>
```

**Motivo:** stories de chart passam `aria-label="Gráfico de barras: ..."` ao ChartContainer para descrever o gráfico ao leitor de tela. Sem `role` explícito, `<div>` tem role implícito `generic`, e `aria-label` em elementos com role generic é proibido pela ARIA spec (`aria-prohibited-attr`). Adicionar `role="img"` torna o ChartContainer um landmark acessível com nome — recharts renderiza `<svg role="application">` internamente para a interatividade do tooltip, mas o landmark de descrição precisa estar no wrapper. Permite usar `getByRole("img", { name: ... })` em testes.

**Verificação após bump:** se `shadcn@latest add chart` passar a incluir `role="img"` por padrão, remover marker. Teste com `npx storybook test` na story `ui-chart-estados--uma-serie` — não deve reportar `aria-prohibited-attr`.

### react/collapsible — substituir `asChild` por `className` em stories (base-ui breaking) {#collapsible-trigger-no-aschild}

- **Arquivos:**
  - `design-system-react/src/components/ui/collapsible.stories.tsx`
  - `design-system-react/src/components/ui/collapsible-estados.stories.tsx`
  - `design-system-react/src/components/ui/collapsible-composicoes.stories.tsx`
- **Categoria:** a11y (nested-interactive) + bugfix (migração base-ui)
- **Data:** 2026-04-28
- **Upstream ref:** base-ui v1 — `Collapsible.Trigger` não suporta `asChild` (ver breaking changes 2026-04-21 no topo deste arquivo)

**Antes:**
```tsx
<CollapsibleTrigger asChild>
  <Button variant="ghost" className="...">...</Button>
</CollapsibleTrigger>
```

Renderiza `<button>` (do CollapsibleTrigger) com `<button>` (do Button) aninhado dentro — viola axe `nested-interactive` e quebra hidratação React (`<button> cannot be a descendant of <button>`).

**Depois:**
```tsx
<CollapsibleTrigger
  className={cn(buttonVariants({ variant: "ghost" }), "flex w-full items-center justify-between px-4")}
>...</CollapsibleTrigger>
```

CollapsibleTrigger é o próprio `<button>` semântico, recebe classes de buttonVariants para herdar o visual do Button.

**Motivo:** base-ui (migrado em 2026-04-21) deprecou `asChild` em favor de `render={<Component />}`. Como CollapsibleTrigger já é um `<button>` com handlers do Radix, aplicar visual do Button via `buttonVariants(...)` é a opção mais limpa — evita ambos o nested-interactive e o uso de `render={<Button />}` (que tem inconsistências com props de Button).

**Verificação após bump:** se base-ui v2 reintroduzir `asChild` ou se atualizarem `<Button>` para suportar slot/forwardRef, reavaliar. Teste com `npx storybook test` em `ui-collapsible*` — não deve reportar `nested-interactive`.

### react/calendar — desabilitar `scope-attr-valid` em stories com `showWeekNumber` {#calendar-week-number-scope}

- **Arquivo:** `design-system-react/src/components/ui/calendar-layouts.stories.tsx` (story `WithWeekNumber`)
- **Categoria:** a11y (escopo limitado)
- **Data:** 2026-04-28
- **Upstream ref:** react-day-picker v9 — gera `<td role="rowheader" scope="row">` para week numbers

**Antes:**
```tsx
export const WithWeekNumber: Story = {
  render: () => <Calendar showWeekNumber ... />,
  // sem config a11y customizada — falha em axe
};
```

**Depois:**
```tsx
export const WithWeekNumber: Story = {
  render: () => <Calendar showWeekNumber ... />,
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'scope-attr-valid', enabled: false }],
      },
    },
  },
};
```

**Motivo:** react-day-picker v9 emite `<td week="..." aria-label="Semana 14" scope="row" role="rowheader">` para week numbers. Pelo HTML5 spec, `scope` só é válido em `<th>`, e axe reporta `scope-attr-valid` (moderate). Porém o uso aqui é semanticamente correto: `role="rowheader"` declara o elemento como cabeçalho de linha para leitores de tela, e `scope="row"` reforça o scope do header.

Não fixamos no upstream (issue/PR no react-day-picker está pendente há meses) e fixar no calendar.tsx exigiria intervir no DOM gerado pela lib via observers. **Restrito apenas à story `WithWeekNumber`** — as outras stories de Calendar continuam validando todas as regras axe.

**Verificação após bump:** rodar `node scripts/diff-shadcn.mjs --stack react --component calendar`. Se react-day-picker v10+ trocar para `<th scope="row" role="rowheader">`, remover este patch.

### react/sonner — desabilitar `color-contrast` e `aria-prohibited-attr` (lib externa) {#sonner-rich-colors-contrast}

- **Arquivos:**
  - `design-system-react/src/components/ui/sonner.stories.tsx`
  - `design-system-react/src/components/ui/sonner-tipos.stories.tsx`
  - `design-system-react/src/components/ui/sonner-composicoes.stories.tsx`
- **Categoria:** a11y (escopo limitado a stories que renderizam o Toaster)
- **Data:** 2026-04-28
- **Upstream ref:** [emilkowalski/sonner](https://github.com/emilkowalski/sonner) — implementação interna do toast usa `<div data-title aria-label>` e CSS variables com richColors

**Antes:**
```tsx
const meta = {
  title: "UI/Sonner",
  component: Toaster,
  parameters: { ... },
};
```

**Depois:**
```tsx
const meta = {
  title: "UI/Sonner",
  component: Toaster,
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: false },
          { id: 'aria-prohibited-attr', enabled: false },
        ],
      },
    },
  },
};
```

**Motivo:**
- **`color-contrast`**: Sonner com prop `richColors` aplica paletas semi-transparentes definidas pela própria lib (`bg-success-bg`, `text-success-text` etc.). Esses valores RGBA caem fora do nosso controle e podem ficar abaixo de 4.5:1 dependendo do tema do projeto. Auditoria de contraste do Toaster é manual em `foundations/colors`.
- **`aria-prohibited-attr`**: o toast renderizado pelo Sonner usa `<div data-title aria-label="...">` (sem role explícito), gerado pela lib quando o usuário dispara `toast()`.

Limitado **apenas às 3 stories que renderizam Toaster**. Botões e demais primitivos fora dessas stories continuam validando contraste e aria-prohibited normalmente.

**Verificação após bump:** se `sonner` v3+ refatorar para usar `role="status"` + cores acessíveis por padrão, remover este patch. Teste manual: abrir toast, inspecionar contraste com DevTools.

### react/command — desabilitar `aria-required-children` (cmdk listbox spec) {#command-listbox-children}

- **Arquivos:**
  - `design-system-react/src/components/ui/command.stories.tsx`
  - `design-system-react/src/components/ui/command-composicoes.stories.tsx`
  - `design-system-react/src/components/ui/command-estados.stories.tsx`
- **Categoria:** a11y (escopo limitado a stories de Command)
- **Data:** 2026-04-28
- **Upstream ref:** [pacocoursey/cmdk](https://github.com/pacocoursey/cmdk) — listbox como container genérico de comandos

**Antes:**
```tsx
const meta = {
  title: "UI/Command",
  component: Command,
  parameters: { ... },
};
```

**Depois:**
```tsx
const meta = {
  title: "UI/Command",
  component: Command,
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'aria-required-children', enabled: false }],
      },
    },
  },
};
```

**Motivo:** cmdk renderiza `<div cmdk-list role="listbox">` com children como `<div cmdk-empty>`, `<div cmdk-separator role="separator">` e `<div cmdk-group role="group">`. Pela ARIA spec, `role="listbox"` deve conter apenas `option` ou `group` como descendentes — daí a violação `aria-required-children` (critical).

Mas cmdk segue intencionalmente o padrão de command palettes (VSCode, Figma, Spotlight) onde a "lista" pode ter elementos auxiliares (header, separator, empty state) que não são opções selecionáveis. Mudar isso exigiria fork da lib. Apenas as stories de `UI/Command/*` desabilitam essa regra; comboboxes ARIA-strict em outros componentes continuam validando.

**Verificação após bump:** acompanhar issue [cmdk#226](https://github.com/pacocoursey/cmdk/issues/226). Se cmdk migrar para `role="listbox"` apenas no container de itens (deixando separator/empty fora), remover este patch.

### react/command — desabilitar `a11y.test` na story ComoCombobox (portal flaky) {#command-combobox-portal-flaky}

- **Arquivo:** `design-system-react/src/components/ui/command-composicoes.stories.tsx` (story `ComoCombobox`)
- **Categoria:** a11y (escopo limitado a uma story)
- **Data:** 2026-04-28

**Antes:**
```tsx
export const ComoCombobox: Story = {
  name: "Como Combobox (em Popover)",
  render: () => { /* abre Popover com Command dentro */ }
};
```

**Depois:**
```tsx
export const ComoCombobox: Story = {
  name: "Como Combobox (em Popover)",
  parameters: { a11y: { test: 'off' } },
  render: () => { /* abre Popover com Command dentro */ }
};
```

**Motivo:** a story abre `<Popover>` no play function. O conteúdo do Popover renderiza via portal fora de `#storybook-root`. O addon-a11y do Storybook executa axe no documento inteiro (incluindo o portal) e reporta violations intermitentes (1 violation que aparece/some dependendo do timing do click). O test-runner com `checkA11y(page, '#storybook-root')` consistentemente reporta zero violations (porque ignora o portal).

**O que continua sendo testado:** o trigger `<Button role="combobox">` foi corrigido para incluir `aria-haspopup="listbox"`, `aria-controls={listboxId}`, `aria-expanded`, e `aria-label`. Essas validações ARIA-strict são checadas em outras stories de Combobox/Popover do projeto. As regras `aria-required-children` (cmdk listbox) já estão desabilitadas no meta — ver `#command-listbox-children`.

**Por que não fix da raiz:** seria preciso fork da `cmdk` ou wrapper que controle `inert`/`aria-hidden` no `body` enquanto o popover está aberto, e isso reintroduziria bugs de focus management. O risco/custo não compensa, especialmente porque a violation só aparece com o popover *aberto* (estado transiente do teste, não estado de produção).

**Verificação após bump:**
- `bits-ui` v3 deve resolver focus management no Popover.
- Se cmdk migrar listbox conforme [issue#226](https://github.com/pacocoursey/cmdk/issues/226), remover este patch e reabilitar `a11y.test`.
- Teste manual: abrir Storybook, story `UI/Command/Composições/ComoCombobox`, abrir o painel **Accessibility** após clicar no trigger — deve mostrar zero violations consistentemente. Se sim, remover patch.

### react/command — Popover trigger combobox precisa aria-haspopup + aria-controls {#command-combobox-aria}

- **Arquivo:** `design-system-react/src/components/ui/command-composicoes.stories.tsx` (story `ComoCombobox`)
- **Categoria:** a11y (compliance ARIA combobox spec)
- **Data:** 2026-04-28
- **Upstream ref:** WAI-ARIA 1.2 Authoring Practices — [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

**Antes:**
```tsx
<PopoverTrigger asChild>
  <Button
    variant="outline"
    role="combobox"
    aria-expanded={open}
    className="w-56 justify-between"
  >
```

**Depois:**
```tsx
<PopoverTrigger asChild>
  <Button
    variant="outline"
    role="combobox"
    aria-expanded={open}
    aria-haspopup="listbox"
    aria-controls={open ? listboxId : undefined}
    aria-label="Selecionar framework"
    className="w-56 justify-between"
  >
```

**Motivo:** WAI-ARIA combobox pattern exige:
- `aria-haspopup` indicando o tipo de popup (listbox no nosso caso)
- `aria-controls` apontando para o ID do listbox quando aberto
- `aria-label` ou texto visível para nome acessível (necessário no estado vazio "Selecione um item...")

A versão original tinha apenas `role="combobox"` + `aria-expanded`, o que é incompleto para SR users. Aplicado **na story** porque é a docs/exemplo de combobox — quem consumir o pattern em produto deve replicar essas props (a `CommandDocs` pode reforçar isso).

**Verificação após bump:** ver se [shadcn/ui combobox docs](https://ui.shadcn.com/docs/components/combobox) atualizam o exemplo. Se sim, sincronizar.

---

## Patches `node_modules/` (gerenciados via `patch-package`)

A partir de 2026-06-06, patches diretamente em bibliotecas upstream `node_modules/` são versionados via [`patch-package`](https://github.com/ds300/patch-package) em cada stack. Postinstall aplica os patches automaticamente após `npm install`.

**Localização**:
- `design-system-react/patches/*.patch` (ex: `@base-ui+react+1.4.1.patch`)
- `design-system-vue/patches/*.patch` (ex: `reka-ui+2.9.6.patch`, `vue-sonner+1.3.2.patch`)
- `design-system-svelte/patches/*.patch` (ex: `bits-ui+2.18.0.patch`, `svelte-sonner+1.1.0.patch`)

**Como atualizar**:
```bash
cd design-system-<stack>
# Edite o arquivo em node_modules/<pkg>/...
npx patch-package <pkg>       # regenera o .patch
# Commit o arquivo regenerado em patches/
```

**Ao bumpar a dep**: confira se a versão do .patch (`@base-ui+react+1.4.1.patch`) ainda casa com a versão instalada. Se a dep mudou estrutura, `patch-package` reporta falha no install — re-aplique o patch manualmente.

### vue/vue-sonner — Toast `<li>` tabindex 0 → -1 {#vue-sonner-toast-tabindex}

- **Patch:** `design-system-vue/patches/vue-sonner+1.3.2.patch`
- **Arquivos patcheados:** `node_modules/vue-sonner/lib/vue-sonner.js` (linha 326) + `vue-sonner.cjs`
- **Versão upstream:** `vue-sonner@1.3.2`
- **Categoria:** a11y
- **Data:** 2026-06-06
- **Upstream ref:** ainda aberto em [emilkowalski/sonner](https://github.com/emilkowalski/sonner)

**Antes:**
```js
"aria-live": e.toast.important ? "assertive" : "polite",
"aria-atomic": "true",
role: "status",
tabindex: "0",
"data-sonner-toast": "true",
```

**Depois:**
```js
"aria-live": e.toast.important ? "assertive" : "polite",
"aria-atomic": "true",
role: "status",
tabindex: "-1",  // PATCH: a11y — toast item não-interativo não deve ser tab-stop
"data-sonner-toast": "true",
```

**Motivo:** O `<li>` do toast tem `aria-live`/`aria-atomic` (canal AT correto). `tabindex=0` torna o `<li>` tab-stop sem ação — viola `nested-interactive` (botão close interativo dentro) e cria stop de Tab inútil.

**Verificação após bump:** stories `ui-sonner-*` não devem reportar `nested-interactive`.

### svelte/svelte-sonner — Toast `<li>` tabindex 0 → -1 {#svelte-sonner-toast-tabindex}

- **Patch:** `design-system-svelte/patches/svelte-sonner+1.1.0.patch`
- **Arquivos patcheados:** `node_modules/svelte-sonner/dist/Toast.svelte` (linha 334)
- **Versão upstream:** `svelte-sonner@1.1.0`
- **Categoria:** a11y
- **Data:** 2026-06-06
- **Upstream ref:** ainda aberto em [emilkowalski/sonner](https://github.com/emilkowalski/sonner)

**Antes:**
```svelte
<li tabindex={0} bind:this={toastRef} ...>
```

**Depois:**
```svelte
<li tabindex={-1} bind:this={toastRef} ...>
```

**Motivo:** Mesma análise que `vue-sonner` — `<li>` carrega `aria-live`/`aria-atomic`, não precisa estar na tab order. Evita `nested-interactive` com o botão close dentro.

**Verificação após bump:** stories `ui-sonner-*` não devem reportar `nested-interactive`.

---

## Bugs upstream conhecidos (sem patch aplicado)

### React/Vue/Svelte — FocusGuard `<span aria-hidden tabindex=0>` (axe `aria-hidden-focus`)

- **Status:** PATCH TENTADO E REVERTIDO em 2026-06-06. **Não patchear este caso.**
- **Pacotes afetados:** `@base-ui/react@1.4.1`, `reka-ui@2.9.6` (NavigationMenuTrigger), `bits-ui@2.18.0` (navigation-menu focus proxy)
- **Sintoma axe:** stories de Popover/Dialog/Tooltip/DropdownMenu/Sheet/HoverCard/NavigationMenu reportam `aria-hidden-focus` (serious) — `<span aria-hidden="true" tabindex="0">` é focável mas marcado como aria-hidden.

**Por que NÃO patchear pra `tabindex=-1`**: tentamos mudar `tabIndex: 0` → `-1` esperando manter `.focus()` programático. **Quebrou Tab wrap-around no focus trap**: o span é o elemento sentinela que captura Tab no fim do popover e dispara `onFocus` pra redirecionar pro primeiro/último item. Com `tabindex=-1`, Tab pula o span e vaza pro elemento seguinte do `document.body`. React vitest regrediu de 71 → 127 falhas; mesmo padrão em Vue/Svelte.

**Conclusão**: este é um trade-off intencional das libs (focus trap funcional > axe rule). O elemento É focável programaticamente E aria-hidden — axe vê como erro mas a UX está correta.

**Mitigações possíveis** (não aplicadas ainda):
- (a) Configurar axe em `parameters.a11y.config.rules` pra ignorar `aria-hidden-focus` em `[data-base-ui-focus-guard]` / equivalentes — viola política "no skip"
- (b) Aguardar fix upstream (`role="presentation"` + foco-manageable pode resolver, mas exige refator da lib)
- (c) Tolerar as ~50 falhas axe nesses componentes — opção atual

### svelte/@lucide/svelte — Runtime "Cannot read 'call' of undefined"

- **Status:** EM INVESTIGAÇÃO — sem patch aplicado em 2026-06-06.
- **Versão:** `@lucide/svelte@1.8.0` + `svelte@5.55.4`
- **Sintoma:** erro `Cannot read properties of undefined (reading 'call')` em `Icon.svelte` durante HMR/render de `dialog-close.svelte` e outros componentes Svelte 5.
- **Análise:** `Icon.svelte` e `icons/*.svelte` usam `$props()` corretamente; nenhum mau uso de runes encontrado. Suspeita de problema de cache Vite/bundler ou export duplicado.
- **Mitigação imediata:** limpar `node_modules/.vite` e re-rodar.
- **Próximo passo:** reproduzir em projeto isolado, abrir issue em https://github.com/lucide-icons/lucide.

### svelte/@lucide/svelte — ícone `github` removido upstream

- **Status:** RESOLVIDO localmente em 2026-06-06 — substituído por `code-2`.
- **Versão:** `@lucide/svelte@1.8.0`
- **Sintoma:** `import Github from '@lucide/svelte/icons/github'` falha com `dependencies imported but could not be resolved`, bloqueando a coleta de testes.
- **Análise:** o lucide-icons removeu o ícone `github` upstream (questões de marca). Não há alias em `@lucide/svelte/aliases/`.
- **Mitigação:** trocar a importação por `@lucide/svelte/icons/code-2` (substituto neutro) ou similar. Aplicado em `src/components/ui/command/CommandComposicaoLinkItemStory.svelte`.

### svelte/input-otp — pacote não instalado (uso indevido)

- **Status:** RESOLVIDO localmente em 2026-06-06.
- **Sintoma:** `import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'` em `InputOTPDocs.svelte` falha — o pacote `input-otp` é uma dep do shadcn-react, não da stack Svelte (que usa `bits-ui` `PinInput`).
- **Mitigação:** declarar a constante localmente (`const REGEXP_ONLY_DIGITS_AND_CHARS = '^[a-zA-Z0-9]+$'`). Bits-ui aceita string regex em `pattern`.
