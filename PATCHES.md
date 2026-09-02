# PATCHES — Customizações sobre libs primitivas e wrappers upstream

Este arquivo registra toda divergência intencional entre este design system e suas dependências upstream: as libs primitivas (`@base-ui/react`, `reka-ui`, `bits-ui`) e libs externas de componente (`sonner`, `cmdk`, `react-day-picker`, `lucide`, etc.). O stack Vanilla é standalone (factories + CSS `.nds-*`) e não tem upstream. Serve de checklist obrigatório ao atualizar dependências.

## Princípios

1. **Wrapper-first.** Se a customização pode viver em um wrapper sem tocar o código upstream, é wrapper. Só patche o arquivo upstream quando a mudança é estrutural (tag HTML, role, ordem de nós, comportamento interno).
2. **Todo patch é marcado no código.** Cada linha alterada recebe um comentário imediatamente acima no formato:
   ```
   // PATCH: <categoria> — <motivo curto> (ver PATCHES.md#<anchor>)
   ```
   Categorias permitidas: `a11y`, `i18n`, `theme`, `security`, `bugfix`, `api` (extensão de API de factory Vanilla — a stack não tem upstream, mas a mudança de contrato é registrada aqui para rastreabilidade).
3. **Todo patch é descrito aqui.** Uma entrada por patch, com diff antes/depois, justificativa e link para PR/issue upstream se houver.
4. **Revisão obrigatória no bump.** Ao atualizar `@base-ui/react`, `reka-ui`, `bits-ui` ou as libs externas de componente, rode `npm run patches:list` e re-valide cada entrada.
5. **Patch que muda API pública varre TODAS as superfícies que descreviam a API
   antiga — e re-roda `/quality` no componente.** A auditoria anterior ao patch
   validou o mundo velho; ela não protege o patch. Caso registrado: o
   `#alert-five-variants` moveu variantes de className para a prop `variant` e
   declarou isso na própria mensagem, mas deixou a description do `className`
   ensinando o caminho antigo e 7 uniões de tipo em `"default" | "destructive"`
   nas docs pages — descoberto 3 dias depois, por leitura humana. Checklist
   mínimo da varredura: `props.table.*` (descriptions E types), `interfaceCode`,
   `argTypes` das stories, exemplos de `usage`/`doDont`, **as STORIES que
   demonstram a API antiga**, `testes.*` do translations.json, e —
   principalmente — **`guidelines/RULES.md` e as skills**: é a camada que
   REGENERA componente novo, e foi nela que "variante via className" sobreviveu
   mais tempo (as stories erradas de Success/Warning nasceram de agents
   seguindo o RULES.md à risca). O grep pelos nomes dos valores antigos é
   repo-wide, não só no componente.

> **Histórico de stack de primitivas (React):**
> - Até 2026-04-21: `@radix-ui/react-*` individuais (modo legado)
> - De 2026-04-21 em diante: `@base-ui/react`. **Zero deps `@radix-ui/*`** — `form.tsx`, `toast.tsx`, `toaster.tsx` e `use-toast.ts` foram deletados (órfãos; App.tsx já usava `sonner` há algum tempo).
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

# 2. Bump da lib primitiva/externa
cd nortear-design-system-react && npm update @base-ui/react

# 3. Após o bump, reavaliar cada entrada deste arquivo cujo upstream foi atualizado
#    (rodar os testes de verificação indicados na própria entrada)

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

- **Arquivo:** `nortear-design-system-<stack>/src/components/ui/<slug>.<ext>`
- **Categoria:** a11y | i18n | theme | security | bugfix
- **Data:** YYYY-MM-DD
- **Upstream ref:** (issue/PR/discussion ou "—")

**Antes (upstream):**
```tsx
<div className="text-sm">{children}</div>
```

**Depois (custom):**
```tsx
// PATCH: a11y — <section> preserva a semântica de landmark exigida pelo grid
<section>{children}</section>
```

**Motivo:** (1–3 frases explicando o problema concreto e por que o wrapper não resolve)

**Verificação após bump:** (o que conferir para saber se o upstream corrigiu — ex: "conferir se o upstream já usa `<section>` na próxima major")
```

---

## Patches ativos

<!-- ordenar alfabeticamente por stack > componente -->

### react/accordion — navegação por setas no wrapper (base-ui não implementa) {#react-accordion-arrow-keys}

- **Arquivo:** `nortear-design-system-react/src/components/ui/accordion.tsx`
- **Categoria:** a11y
- **Data:** 2026-07-28
- **Upstream ref:** — (o `CompositeList` do `AccordionRoot` só registra refs dos itens; não há handler de teclado em nenhum arquivo do módulo `accordion`)

**Antes:**
```tsx
<AccordionPrimitive.Root data-slot="accordion" className={cn("nds-accordion", className)} {...props} />
```

**Depois:**
```tsx
// PATCH: a11y — o @base-ui/react não implementa navegação por setas no Accordion …
<AccordionPrimitive.Root … onKeyDown={handleKeyDown} {...props} />
// handleKeyDown: ArrowDown/ArrowUp com loop + Home/End, agindo só quando o
// foco está num [data-slot="accordion-trigger"] habilitado.
```

**Motivo:** `reka-ui`, `bits-ui` e a factory Vanilla trazem a navegação por setas, e `accessibility.keyboard` do `translations.json` documenta o comportamento nas 3 línguas. No React as setas caíam no scroll da página — divergência funcional e de acessibilidade contra as outras 3 stacks. O tipo do evento é derivado de `AccordionPrimitive.Root.Props["onKeyDown"]` para não depender do caminho interno do `BaseUIEvent`.

**Verificação após bump:** conferir se o `@base-ui/react` passou a tratar ArrowDown/ArrowUp no accordion (`grep -rn "ArrowDown" node_modules/@base-ui/react/accordion/`); se sim, remover o handler e manter só o repasse de `onKeyDown`.

### svelte/hover-card — `defaultOpen` no wrapper (bits-ui LinkPreview não tem) {#svelte-hovercard-defaultopen}

- **Arquivo:** `nortear-design-system-svelte/src/components/ui/hover-card/hover-card.svelte`
- **Categoria:** api
- **Data:** 2026-07-27
- **Upstream ref:** — (`bits-ui` expõe HoverCard como `LinkPreview`, cuja `RootProps` tem `open`/`onOpenChange`, sem `defaultOpen`)

**Antes:**
```svelte
let { open = $bindable(false), openDelay = 0, closeDelay = 0, ...restProps }: HoverCardPrimitive.RootProps = $props();
```

**Depois:**
```svelte
// PATCH: api — `defaultOpen` não existe no LinkPreview do bits-ui …
let {
  defaultOpen = false,
  open = $bindable(defaultOpen),
  openDelay = 0, closeDelay = 0, ...restProps
}: HoverCardPrimitive.RootProps & { defaultOpen?: boolean } = $props();
```

**Motivo:** `defaultOpen` é a API documentada do HoverCard nas 4 stacks (tabela de props e de estados do `HoverCardDocs`) e funciona no React (base-ui). Na Svelte as 8 demos que deveriam nascer abertas passavam `defaultOpen={true}` para uma prop inexistente — não abriam e o svelte-check acusava. O default do destructuring alimenta o valor inicial de `open`, preservando `bind:open` no consumidor (usado em `HoverCardStory.svelte`).

**Verificação após bump:** conferir se o `bits-ui` passou a expor `defaultOpen` no `LinkPreview.RootProps`; se sim, remover o patch e repassar direto.

### vanilla/carousel — `onIndexChange` expõe a origem da navegação {#vanilla-carousel-nav-source}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/carousel.ts`
- **Categoria:** api
- **Data:** 2026-07-27
- **Upstream ref:** — (factory standalone)

**Antes:**
```ts
onIndexChange?: (index: number) => void;
// goTo(index) — chamado por botões, ArrowLeft/Right, autoplay e mount, indistinguíveis
```

**Depois:**
```ts
export type CarouselNavSource = 'init' | 'button' | 'keyboard' | 'autoplay';
onIndexChange?: (index: number, source: CarouselNavSource) => void;
```

**Motivo:** o evento `slide_change` do catálogo tipado distingue `trigger: 'button' | 'swipe' | 'keyboard'`, mas o callback não informava a origem — a fiação de analytics reportava tudo como `button` (inclusive setas do teclado) e também disparava no posicionamento inicial do mount. Mudança aditiva: consumidores que ignoram o 2º parâmetro seguem funcionando.

**Verificação após bump:** n/a (sem upstream). Ao evoluir a factory, manter `'init'` no mount e a origem correta em cada caminho de navegação.

### vanilla/sheet — `onClose(reason)` espelhando o Dialog {#vanilla-sheet-onclose-reason}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/sheet.ts`
- **Categoria:** api
- **Data:** 2026-07-27
- **Upstream ref:** — (factory standalone)

**Antes:**
```ts
onOpenChange?: (open: boolean) => void;
// close() único — overlay, Escape e botão X indistinguíveis
```

**Depois:**
```ts
export type SheetCloseReason = 'escape' | 'overlay' | 'close-button';
onClose?: (reason: SheetCloseReason) => void;
// closeWithReason(reason) interno; cada caminho de fechamento passa seu motivo
```

**Motivo:** o evento `dialog_close` do catálogo tipado tem campo `reason`, e o Dialog factory já expõe `onClose(reason)` — o Sheet era o único overlay sem isso, deixando o analytics das docs pages sem distinguir escape/overlay/botão. Mudança aditiva; `onOpenChange(false)` continua disparando após `onClose`.

**Verificação após bump:** n/a (sem upstream). Manter paridade de assinatura com `DialogCloseReason` se o Dialog ganhar novos motivos. Obs.: o AlertDialog **não** recebe este patch — não fecha por Escape/overlay por design (canônico), então `close-button`/action cobrem todos os caminhos.

### vanilla/tooltip — `onShow` na exibição real {#vanilla-tooltip-onshow}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/tooltip.ts`
- **Categoria:** api
- **Data:** 2026-07-27
- **Upstream ref:** — (factory standalone)

**Antes:**
```ts
// sem callback de exibição; TooltipDocs espelhava o SHOW_DELAY (300ms) com
// timer local próprio — dessincronizava se a constante do factory mudasse
```

**Depois:**
```ts
onShow?: () => void; // chamado dentro de show(), após o delay interno
```

**Motivo:** `tooltip_view` deve disparar quando o tooltip é de fato exibido. O timer duplicado no TooltipDocs era acoplamento frágil a uma constante privada do factory; o callback elimina a duplicação e fica disponível para qualquer consumidor.

**Verificação após bump:** n/a (sem upstream). Se o factory ganhar animação/portal assíncrono, garantir que `onShow` continue sendo chamado no momento em que o painel fica visível.

### todas/alert — `variant` expõe as 5 variantes semânticas {#alert-five-variants}

- **Arquivos:** `alert.tsx` (react), `alert/index.ts` (vue), `alert.svelte` (svelte), `alert.ts` (vanilla)
- **Categoria:** api
- **Data:** 2026-07-29
- **Upstream ref:** — (o Alert não vem de lib primitiva em nenhuma stack; é markup próprio sobre o CSS `.nds-*`)

**Motivo:** o `alert.css` define cinco variantes — `default`, `destructive`, `success`, `warning` e `info` — mas o `cva` das quatro stacks mapeava só as duas primeiras. `success` e `warning` existiam no CSS e eram alcançáveis apenas passando a classe na mão (`className="nds-alert-success"`), e `info` não era alcançável nem documentado. Capacidade do CSS que a API não expunha: o consumidor precisava conhecer o nome interno da classe.

Além de escondida, a forma manual saiu errada em duas stacks: Vue e Svelte montavam Success e Warning com classes do Tailwind (`bg-success/10`, `border-success/30`), que saíram do projeto e não existem mais. As duas stories renderizavam um alert `default`, e o Chromatic fotografava isso como baseline.

**Depois:** `variant` aceita as cinco em todas as stacks; `className`/`class` volta a ser só override pontual. As docs pages e as stories passaram a usar a prop.

**Verificação após bump:** se o `alert.css` ganhar uma variante nova, adicioná-la ao `cva` das 4 stacks e ao `AlertVariant` do Vanilla no mesmo commit — o descompasso entre CSS e API foi o que criou este caso.

### todas/alert — `<h5>` e `<section>` no título e na descrição {#alert-title-desc-semantics}

- **Arquivos:** `alert.tsx` (react), `AlertTitle.vue` / `AlertDescription.vue` (vue), `alert-title.svelte` / `alert-description.svelte` (svelte)
- **Categoria:** api
- **Data:** 2026-07-29 · **atualizado 2026-08-01**: `as` configurável no
  AlertTitle (default `'h5'`) nas 4 stacks, padrão do CardTitle. Motivo: `h5`
  fixo sob seções `h2` das docs pages violava axe `heading-order` em produção —
  achado por story de fumaça montando a docs page inteira, superfície que
  nenhum teste cobria. Docs pages passam `as="h3"`; axe da página zerou
  (verificado nos dois sentidos: reintroduzir o h5 falha exatamente com
  heading-order).
- **Upstream ref:** — (marcação própria)

**Motivo:** o cabeçalho do `alert.css` documenta a estrutura com `<h5 class="nds-alert-title">` e `<section class="nds-alert-description">`, e o CSS traz seletores `.nds-alert > h1..h6` e `.nds-alert > section` justamente para isso. O Vanilla seguia; React, Vue e Svelte renderizavam `<div>` nos dois, perdendo a semântica de cabeçalho e o landmark da descrição. Alinhadas ao Vanilla, que é a referência cross-stack.

**Verificação após bump:** n/a.

### todas/accordion — `data-type` e `data-collapsible` na raiz {#accordion-config-data-attrs}

- **Arquivos:** `accordion.tsx` (react), `Accordion.vue` (vue), `accordion.svelte` (svelte), `accordion.ts` (vanilla)
- **Categoria:** api
- **Data:** 2026-07-29
- **Upstream ref:** — (nenhuma das libs — base-ui, reka-ui, bits-ui — escreve a configuração na raiz)

**Motivo:** a configuração do accordion vivia só na prop/closure. Depois de montado, nada no DOM distinguia um `single` de um `multiple`: CSS, teste, devtools e o gerador de snippet do Storybook viam exatamente o mesmo HTML. No Vanilla isso tinha efeito visível — o renderer `html` do Storybook monta a caixa de código a partir do `outerHTML` e só reemite quando ele muda, então trocar o modo nos Controls não alterava o snippet.

**Assimetria conhecida e aceita:** `data-type` sai nas 4 stacks. `data-collapsible` sai só em Vue e Vanilla — base-ui e bits-ui não expõem `collapsible` (no modo único, fechar o item ativo é sempre permitido nessas libs). Emitir o atributo onde a prop não existe seria inventar uma configuração.

**Verificação após bump:** se alguma lib passar a escrever um atributo equivalente na raiz, remover o nosso para não duplicar.

### react/chart — `role="img"` no ChartContainer para satisfazer aria-prohibited-attr {#chart-aria-img-role}

- **Arquivo:** `nortear-design-system-react/src/components/ui/chart.tsx` (ChartContainer)
- **Categoria:** a11y
- **Data:** 2026-04-28
- **Upstream ref:** wrapper `chart.tsx` sobre `recharts` — upstream usa `<div data-slot="chart">` sem `role`

**Antes (upstream):**
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

**Verificação após bump:** se o wrapper upstream de chart passar a incluir `role="img"` por padrão, remover marker. Teste com `npx storybook test` na story `ui-chart-estados--uma-serie` — não deve reportar `aria-prohibited-attr`.

### react/collapsible — substituir `asChild` por `className` em stories (base-ui breaking) {#collapsible-trigger-no-aschild}

- **Arquivos:**
  - `nortear-design-system-react/src/components/ui/collapsible.stories.tsx`
  - `nortear-design-system-react/src/components/ui/collapsible-estados.stories.tsx`
  - `nortear-design-system-react/src/components/ui/collapsible-composicoes.stories.tsx`
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

- **Arquivo:** `nortear-design-system-react/src/components/ui/calendar-layouts.stories.tsx` (story `WithWeekNumber`)
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

**Verificação após bump:** se react-day-picker v10+ trocar para `<th scope="row" role="rowheader">`, remover este patch.

### react/sonner — desabilitar `color-contrast` e `aria-prohibited-attr` (lib externa) {#sonner-rich-colors-contrast}

- **Arquivos:**
  - `nortear-design-system-react/src/components/ui/sonner.stories.tsx`
  - `nortear-design-system-react/src/components/ui/sonner-tipos.stories.tsx`
  - `nortear-design-system-react/src/components/ui/sonner-composicoes.stories.tsx`
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
  - `nortear-design-system-react/src/components/ui/command.stories.tsx`
  - `nortear-design-system-react/src/components/ui/command-compositions.stories.tsx`
  - `nortear-design-system-react/src/components/ui/command-states.stories.tsx`
  - `nortear-design-system-react/src/components/ui/command-variants.stories.tsx`
    (este registro listava três arquivos; o quarto sempre esteve lá — corrigido
    em 2026-09-02)
- **Categoria:** a11y (escopo limitado a stories de `Primitives/Overlay/Command/*`)
- **Data:** 2026-04-28 · **Reduzido e remedido em:** 2026-09-02 · **Premissa
  removida em:** 2026-09-02
- **Upstream ref:** [pacocoursey/cmdk](https://github.com/pacocoursey/cmdk) — listbox como container genérico de comandos

**Depois:**
```tsx
const meta = {
  title: "Primitives/Overlay/Command",
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

**Motivo — a versão anterior deste registro estava errada em duas pontas, e as duas foram medidas em 2026-09-02.**

O texto de 2026-04-28 culpava três filhos (`cmdk-empty`, `cmdk-separator`,
`cmdk-group`) e concluía que "mudar isso exigiria fork da lib". Nenhuma das
duas afirmações se sustenta:

- **O divisor NÃO precisava de fork.** `ariaRequiredChildrenEvaluate` (axe-core)
  descarta todo nó em que `isVisibleToScreenReaders` é falso ANTES de julgar
  filho permitido. Um `aria-hidden="true"` no `CommandSeparator` — que é
  exatamente o que vanilla, vue e angular já faziam — resolve sem tocar na lib.
  A lib crava `role="separator"` depois do espalhamento das props, então o
  papel continua lá; o nó é que sai da árvore. **Feito**, e a asserção da story
  `WithGroups` deixou de cobrar `role="separator"`.
- **O `cmdk-group` nunca foi o problema:** `role="group"` é filho PERMITIDO de
  `listbox`.

**O que restou até 2026-09-02, e por que a regra estava desligada:**
`CommandEmpty` do cmdk montava `<div cmdk-empty role="presentation">` DENTRO da
lista, e só enquanto o filtro não casa. `role="presentation"` não entra como
filho não permitido (o avaliador desce para os filhos), mas quando não sobra
nenhuma opção o listbox fica sem `option`, o nó de texto conta como conteúdo, e
o caminho `reviewEmpty` devolve **falha** em vez de "incompleto".

**A premissa foi removida em 2026-09-02, por decisão da dona.** `CommandEmpty`
deixou de embrulhar o primitivo do cmdk: é agora um `<div role="status"
aria-live="polite" aria-atomic="true">` próprio, montado o tempo todo e IRMÃO do
`CommandList` — a forma do Vanilla, e o que
`accessibility.screenReader.onFilter` promete nas cinco docs pages. O estado vem
de `useCommandState`, exportado pelo cmdk (`useCmdk as useCommandState`), então
não houve fork; a condição continua sendo `filtered.count === 0`, a mesma que o
primitivo usava. O mesmo foi feito no Svelte, por `onStateChange` do
`Command.Root` do bits-ui.

**Com isso, nenhuma das três causas conhecidas do patch continua de pé** — o
divisor está `aria-hidden`, o `cmdk-group` sempre foi permitido, e a mensagem
saiu do listbox. **O patch NÃO foi removido**, e a razão é a regra da casa:
premissa se derruba medindo. Quem julga `aria-required-children` é o axe rodando
em navegador, e a suíte de navegador não foi executada nesta rodada (decisão da
dona: rodada completa no fim da campanha). Especificamente, **não está
confirmado** que um listbox sem nenhum `option` — que é o que sobra agora quando
o filtro não casa — saia como "incomplete" (`reviewEmpty`) e não como falha.
Remover a exceção antes dessa medida trocaria um portão frouxo por uma falha
vermelha sem diagnóstico.

**Próximo passo, e é uma medição, não um conserto:** na rodada de navegador,
religar `aria-required-children` nos quatro arquivos e ver se as stories do
Command passam. Se passarem, este registro inteiro sai.

**Verificação após bump:** acompanhar issue [cmdk#226](https://github.com/pacocoursey/cmdk/issues/226). Se cmdk migrar para `role="listbox"` apenas no container de itens (deixando empty fora), remover este patch.

### todas/alert — variante dismissible (`dismissible`/`onDismiss`/`dismissLabel`) {#alert-dismissible}

- **Arquivos:** `alert.tsx` (react), `alert/index.ts` (vue), `alert.svelte` (svelte), `alert.ts` (vanilla)
- **Categoria:** api
- **Data:** 2026-07-31
- **Upstream ref:** — (o Alert não vem de lib primitiva em nenhuma stack; markup próprio sobre o CSS `.nds-*`)

**Depois:** `dismissible?: boolean` (default `false`) renderiza o botão de fechar — Button `ghost` `icon-sm` com `.nds-alert-dismiss`, `data-slot="alert-dismiss"` e ícone X do lucide. Acioná-lo remove o alert da tela e dispara o callback de fechamento (`onDismiss`; Vue: emit `dismiss`) **uma única vez**. `dismissLabel` (default `'Fechar alerta'`) é o aria-label do botão. No Vanilla a raiz também recebe `data-dismissible` (o snippet do Storybook vem do `outerHTML`; config só no closure congela a caixa de código). Mutuamente exclusivo com a composição `AlertAction` por design.

**Motivo:** o evento `alert_dismiss` estava tipado nos 4 `analytics.ts` e documentado na tabela de analytics da doc, mas o componente nunca teve como ser fechado. O CSS já existia no `alert.css` compartilhado (`.nds-alert-dismiss` + `:has()` abrindo o padding). O analytics segue no consumidor via callback — proibido importar `@/lib/analytics` no primitivo.

**Verificação após bump:** n/a (sem upstream no Alert). Se o componente ganhar modo controlado, manter a garantia de `onDismiss` disparar uma única vez por fechamento.

### todas/alert — `role` configurável (`alert` | `status` | `note`) {#alert-role}

- **Arquivos:** `alert.tsx` (react), `alert/index.ts` (vue), `alert.svelte` (svelte), `alert.ts` (vanilla) + `docs/shared/sections/DocsNotes.*` nas 4
- **Categoria:** a11y
- **Data:** 2026-08-02
- **Upstream ref:** — (o Alert não vem de lib primitiva em nenhuma stack; markup próprio sobre o CSS `.nds-*`)

**Antes:** o elemento raiz recebia `role="alert"` **fixo**, sem como desligar.

**Depois:** `role?: 'alert' | 'status' | 'note'`, default `'alert'` — aditivo, nenhum call site existente muda de comportamento. O valor vai direto para o atributo `role` da raiz. `alert` é live region assertiva, `status` é polida, `note` não é live region.

**Motivo:** por WAI-ARIA, `alert` é para mensagem urgente que **surge em tempo de execução**. Com o role fixo, todo Alert estático virava live region assertiva: o `DocsNotes` renderiza Alerts e o NVDA saltava para a seção "Notas de Implementação" no carregamento e ficava preso ali — em 48 docs pages × 4 stacks. Varredura confirmou que essa era a **única** live region das docs pages (zero `aria-live`, zero outro role de live region em `shared/`). O bug vale além das docs: qualquer consumidor do DS com um Alert fixo em tela tinha o mesmo problema. `DocsNotes` passou a usar `role="note"`.

**Verificação após bump:** n/a (sem upstream no Alert). Manter o default em `'alert'` — trocá-lo seria breaking. Story `SemAnuncio` (arquivo de estados do Alert nas 4 stacks) trava as duas pontas: `role="note"` explícito e default `alert` quando a prop é omitida.

### vue/alert-dialog — `aria-label` de fallback no Content {#vue-alert-dialog-fallback-label}

- **Arquivo:** `nortear-design-system-vue/src/components/ui/alert-dialog/AlertDialogContent.vue`
- **Categoria:** a11y
- **Data:** 2026-08-06 (registro; o código é de 2026-05, commit f04827e7)
- **Upstream ref:** — (comportamento do `reka-ui`, não bug)

**Antes (upstream):**
```vue
<AlertDialogContent v-bind="{ ...$attrs, ...forwarded }">
```

**Depois (custom):**
```vue
<AlertDialogContent v-bind="{ 'aria-label': fallbackLabel, ...$attrs, ...forwarded }">
```

**Motivo:** o `reka-ui` só emite `aria-labelledby` quando existe um `AlertDialogTitle`; sem ele o painel fica sem nome acessível e o axe reprova por `aria-dialog-name`. O fallback entrega o nome mínimo. É a única stack com essa rede — base-ui, bits-ui e a factory Vanilla deixam o painel sem nome se o consumidor omitir o Title, o que o contrato documentado proíbe (`anatomy.item5`: título obrigatório).

**Verificação após bump:** conferir se o reka-ui passou a emitir um nome padrão. O ramo não tem story (o Title está em todas), então está declarado com `v8 ignore` — se o fallback sair, o ignore sai junto.

### vanilla/alert-dialog — `defaultOpen` na factory {#vanilla-alert-dialog-defaultopen}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/alert-dialog.ts`
- **Categoria:** api
- **Data:** 2026-08-06
- **Upstream ref:** — (stack standalone)

**Depois:** `defaultOpen?: boolean` abre o diálogo assim que o wrapper entra no DOM (microtask + `isConnected`), sem clique no trigger. `open()` passou a ser idempotente: com o painel montado, um segundo clique no trigger não monta outro painel nem deixa o primeiro órfão no body.

**Motivo:** `defaultOpen` está na tabela de props compartilhada e existe em React, Vue e Svelte; só o Vanilla não expunha. As stories abriam o diálogo com `queueMicrotask(() => trigger.click())` — truque que não é API e que nenhuma documentação descrevia. Não há equivalente para `open` controlado: o estado de abertura continua sendo da factory, e a story `Controlled` declara isso em `coversNotApplicable`.

**Verificação após bump:** n/a (sem upstream). Se a factory ganhar modo controlado, rever o `coversNotApplicable` de `functional.item7` nas stories de estados.

---

## Patches `node_modules/` (gerenciados via `patch-package`)

A partir de 2026-06-06, patches diretamente em bibliotecas upstream `node_modules/` são versionados via [`patch-package`](https://github.com/ds300/patch-package) em cada stack. Postinstall aplica os patches automaticamente após `npm install`.

**Localização**:
- `nortear-design-system-react/patches/*.patch` (ex: `@base-ui+react+1.4.1.patch`)
- `nortear-design-system-vue/patches/*.patch` (ex: `reka-ui+2.9.6.patch`, `vue-sonner+2.0.9.patch`)
- `nortear-design-system-svelte/patches/*.patch` (ex: `bits-ui+2.18.0.patch`, `svelte-sonner+1.1.1.patch`)

**Como atualizar**:
```bash
cd nortear-design-system-<stack>
# Edite o arquivo em node_modules/<pkg>/...
npx patch-package <pkg>       # regenera o .patch
# Commit o arquivo regenerado em patches/
```

**Ao bumpar a dep**: confira se a versão do .patch (`@base-ui+react+1.4.1.patch`) ainda casa com a versão instalada. Se a dep mudou estrutura, `patch-package` reporta falha no install — re-aplique o patch manualmente.

### vue/vue-sonner — Toast `<li>` tabindex 0 → -1 {#vue-sonner-toast-tabindex}

- **Patch:** `nortear-design-system-vue/patches/vue-sonner+2.0.9.patch`
- **Arquivos patcheados:** `node_modules/vue-sonner/lib/vue-sonner.js` (linha 326) + `vue-sonner.cjs`
- **Versão upstream:** `vue-sonner@2.0.9`
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

- **Patch:** `nortear-design-system-svelte/patches/svelte-sonner+1.1.1.patch`
- **Arquivos patcheados:** `node_modules/svelte-sonner/dist/Toast.svelte` (linha 334)
- **Versão upstream:** `svelte-sonner@1.1.1`
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

## Divergências idiomáticas entre libs (sem patch — não alinhar)

Diferenças de saída que vêm da lib primitiva e que **entregam o mesmo resultado
para o usuário**. Ficam registradas para que uma auditoria cross-stack não as
trate como bug e "alinhe" na força.

### alert-dialog — `aria-modal` só em bits-ui e Vanilla

- **Onde:** `role="alertdialog"` do painel, nas 4 stacks.
- **Divergência:** `bits-ui` (Svelte) e a factory Vanilla emitem `aria-modal="true"`. `@base-ui/react` e `reka-ui` não emitem: marcam todo o resto da página com `aria-hidden` (base-ui soma `data-base-ui-inert`), que é a técnica mais nova e mais confiável de isolamento.
- **Por que não alinhar:** as duas técnicas entregam o mesmo isolamento para leitor de tela; forçar `aria-modal` em base-ui/reka duplicaria a semântica sem ganho, e remover dos outros dois perderia isolamento onde o `aria-hidden` não é aplicado. As play functions asseveram o mecanismo de cada stack e os comentários explicam qual é.
- **Rever se:** base-ui ou reka passarem a emitir `aria-modal`, ou se o axe passar a exigir o atributo.

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
- **Sintoma:** `import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'` em `InputOTPDocs.svelte` falha — o pacote `input-otp` é uma dep exclusiva da stack React, não da Svelte (que usa `bits-ui` `PinInput`).
- **Mitigação:** declarar a constante localmente (`const REGEXP_ONLY_DIGITS_AND_CHARS = '^[a-zA-Z0-9]+$'`). Bits-ui aceita string regex em `pattern`.
