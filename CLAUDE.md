# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This is a **multi-stack design system monorepo**. The same design system is implemented in 5 stacks that share content, themes, and guidelines:

- `nortear-design-system-react/` — React 19 + `@base-ui/react` — port **6006**
- `nortear-design-system-vue/` — Vue 3 + `reka-ui` — port **6007**
- `nortear-design-system-svelte/` — Svelte 5 + `bits-ui` — port **6008**
- `nortear-design-system-vanilla/` — Vanilla TS factories + CSS `.nds-*` — port **6009**
- `nortear-design-system-angular/` — Angular 22 + `@radix-ng/primitives` — port **6010**

`STACKS` in `scripts/audit.mjs` is the authoritative list, and it has five entries. Any doc that says "four stacks" is stale.

Shared (read by all stacks):
- `docs/shared/content/<slug>/translations.json` — pt-BR/en/es content per component
- `docs/shared/guidelines/` — cross-stack rules
- `docs/shared/themes/` — CSS custom property themes
- `docs/shared/skill-refs/` — schemas/references consumed by `.claude/commands/*.md` skills
- `scripts/audit.mjs` and `scripts/audit-translation-literals.mjs` — deterministic checks

Per-stack guidelines live in `nortear-design-system-<stack>/guidelines/` and each stack has its own `CLAUDE.md`. That directory carries **16 files with the same names in every stack**, and two audit rules sweep it (`dead_lib_in_infra`, `code_in_component_guideline`) — a stack missing it is invisible to both. Each stack's `CLAUDE.md` is a **~20-line pointer** to those guidelines, never a self-contained manual: operational knowledge belongs in the guideline file for its subject, where someone searching for that subject will find it.

**Creating a new stack**: follow `docs/shared/guidelines/15-nova-stack.md` — measured inventory of what to copy, what to reference from `docs/shared/` instead of copying, and how to verify the new stack is complete. Write `guidelines/` and the pointer `CLAUDE.md` **before** the components, not after: building 47 components first is exactly how Angular ended up with zero guidelines.

**Creating a new brand theme**: follow `docs/shared/guidelines/16-novo-tema.md` — the 42 required colour tokens (in BOTH modes — the chart palette stopped being light-only), the contrast rules the palette gate enforces, and the 21 files a theme has to be registered in. The one that matters most is `docs/shared/testing/cor.ts`: every contrast probe iterates its `TEMAS` list, so adding the theme there is what makes six gate stories measure it automatically, in both modes.

**Building a conversational component**: follow `docs/shared/guidelines/17-componentes-conversacionais.md` — the port of the assistant-ui Elements catalogue (120 pieces, MIT) into the five stacks. It carries the triage (38 of the 120 are compositions of primitives that already exist; 82 are new, grouped into seven families with one sheet each), the runtime-free rule that is what makes runtime-bound React elements portable at all, the shared foundation that has to exist before the SECOND piece, and the ten accessibility rules the whole family inherits. `chat-thread` is the first member and the model for the rest.

## Common Commands

Each stack is an independent npm package; run commands from inside the stack directory.

```bash
# Storybook (the primary developer interface — NOT App.tsx/main.ts)
npm run storybook          # React:6006 · Vue:6007 · Svelte:6008 · Vanilla:6009 · Angular:6010

# Build + typecheck
npm run build              # tsc -b && vite build (varies per stack)

# Lint
npm run lint

# Tests (React only has unit tests; all stacks have Storybook tests)
npm run test               # React: vitest run
npm run test:watch         # React: vitest watch
npm test                   # all stacks: Storybook Test (vitest browser) — play functions + axe via addon-a11y

# Visual regression
npm run chromatic
```

### Repo-root scripts

```bash
node scripts/audit.mjs <slug> --json              # quick deterministic audit per component
node scripts/audit.mjs --all --json
node scripts/audit-translation-literals.mjs       # audita o conteúdo compartilhado (5 seções)
node scripts/audit-translation-literals.mjs --only cobertura   # chaves *Code sem variante por stack
node scripts/audit-translation-literals.mjs --only plataforma  # texto preso a navegador (custo de portar)
node scripts/audit-translation-literals.mjs --only soltos      # snippet preso em override de stack
node scripts/paridade-nome-acessivel.mjs <slug>   # nome acessível igual nas 5? (instrumento, não portão)
node scripts/tabela-tokens.mjs <slug>            # tabela de tokens × folha CSS, nos dois sentidos (instrumento)
npm run core:pack                                # empacota docs/shared como @nortear/ds-core
```

## Architecture

### Storybook is the home

Each stack uses Storybook 10 as its primary interface. `App.tsx`/`main.ts` exists only as a development sandbox. New components are added by creating `*.stories.tsx` and `*Docs.tsx` (or stack equivalent) — **not** by registering in `App.tsx`.

The Storybook sidebar order is controlled by `storySort` in `.storybook/preview.ts`. Brand themes are toggled via toolbar globals.

### Component anatomy (per stack)

For a component `<slug>`, each stack has:

- `src/components/ui/<slug>*.{tsx,vue,svelte,ts}` — primitive
- `src/components/ui/<slug>*.stories.*` — Playground + variant/state/composition stories
- `src/components/docs/<Slug>Docs.*` — full docs page (consumed via `withAutoDocsTab` HOC)
- `src/components/docs/shared/sections/Docs*.*` — 15 generic section containers used by every docs page (header, anatomy, when-to-use, do-dont, import, variants, states, props, tokens, accessibility, related, notes, analytics, testes, demonstration)

Content for all of those comes from `docs/shared/content/<slug>/translations.json`. Code snippets in the JSON (keys ending in `Code`) carry one variant per stack; descriptive text must be API-neutral.

### Shared `lib` per stack

Each stack has these files in `src/lib/`:

- `i18n.ts` — `useTranslation(translations, overrides?)` with dot-path lookup and per-stack overrides via the `overrides` parameter (use for stack-specific prop names that differ from the shared JSON)
- `use-seo.ts` — `useSeoEffect` / `applySeo`. Detects iframe context and writes meta tags into the parent (Storybook manager). Title is `${title} · Design System` — **do not include the suffix in `seo.title` in translations.json**.
- `use-active-section.{ts,svelte.ts}` — IntersectionObserver wrapper. `onActive` (highlight) fires immediately; `onDwell` (analytics `docs_section_viewed`) fires only after 2s continuous visibility, suppressing false positives during programmatic scroll from nav clicks.
- `analytics.ts` — `track(event, params)`. GA4 lives in `manager-head.html` (not the iframe) with `send_page_view:false`; `track()` calls `window.top.gtag`.
- Sanitização: qualquer `dangerouslySetInnerHTML` / `v-html` / `{@html}` / `innerHTML` de conteúdo dinâmico usa `DOMPurify.sanitize()` **direto no call site** (`import DOMPurify from 'dompurify'`) — sem wrapper local, para que SAST reconheça o sanitizador (ver guideline 09).

### Cross-stack translation strategy

Different UI libraries (`@base-ui` / `reka-ui` / `bits-ui` / factories) expose different prop names for the same concept. The convention is:

1. **Descriptive text in shared `translations.json` is API-neutral** ("modo múltiplo", "callback de mudança"). The auditor at `scripts/audit-translation-literals.mjs` flags literal prop references in descriptive keys.
2. **Code snippets (keys ending in `Code`) carry one variant per stack**, keyed by stack name inside the JSON:

```jsonc
"structureCode": {
  "react": "<Button>Salvar</Button>",
  "vue":   "<Button>Salvar</Button>",
  "web":   "/* CSS igual nos 5 stacks de navegador */"
}
```

`web` is a group covering react+vue+svelte+vanilla+angular (`WEB_STACKS` in
`code-variants.ts` is the authoritative list) — use it for CSS. A plain
string still works and means "same snippet for every stack". Resolution lives in
`docs/shared/primitives/code-variants.ts`; each stack's `i18n.ts` declares its
own `STACK` constant and the flatten step swaps the variant in, so docs pages
keep calling `t('anatomy.structureCode')` unchanged. Missing variants fall back
to `web` → `react` (never an empty code block) and are listed by
`node scripts/audit-translation-literals.mjs --only cobertura`.

**Never put a `*Code` snippet in a `useTranslation` override** — it strands the
snippet inside one stack, invisible to the shared content. Overrides are for
prop names and labels only; `--only soltos` flags violations.
3. **Stack-specific prop tables use overrides**: when the shared `translations.json` describes props in the API of (say) `reka-ui` but the React stack uses `@base-ui` with different names, override at the call site:

```tsx
const { t } = useTranslation(translations, {
  "*":   { "props.X.name": "multiple", "props.X.type": "boolean" },
  "pt-BR": { "props.X.description": "…" },
  en:    { "props.X.description": "…" },
  es:    { "props.X.description": "…" },
});
```

When `*Docs.tsx` iterates `translations[locale].props.<group>.items` directly (bypassing `t()`), build a local `useMemo` array that swaps the relevant entries instead of relying on overrides — overrides only flow through `t()`.

### Skills and audit pipeline

`.claude/commands/` defines named skills (`pipeline`, `dev-react`, `dev-vue`, `dev-svelte`, `dev-vanilla`, `ux-writer`, `quality`, `security`, `performance`, `analytics`, `seo-geo`, `cross-stack`, `product`, `docs-sections`). The `pipeline` orchestrator chains them with parallelism between stacks and inline determinism via `scripts/audit.mjs`. Skills are user-invoked with slash commands — do not invoke them speculatively.

## Conventions To Respect

- **Never register new components in `App.tsx`/`main.ts`** — they're sandboxes; the source of truth for docs is the Storybook story tree.
- **Never include emojis or ✓/✗ glyphs in `translations.json`** — those are rendered by the docs page code (.nds-* pills + lucide icons). Including them in text causes visual duplication.
- **Never reference one stack by name from another stack's text or notes** (e.g. "In React, value is always an array. In Vue…"). Each stack's docs are consumed standalone; cross-stack comparisons leak.
- **Never call `gtag()` directly** — use `track()` from `src/lib/analytics.ts`. GA4 lives in the manager, not the iframe.
- **`useSeoEffect` is mandatory** in every `*Docs.*` for title, description, hreflang, og:*, and JSON-LD. Don't write meta tags inline.
- **`seo.title` in translations.json must NOT contain "· Design System"** — `useSeoEffect` appends it.
- **Stories of variations/states must set `parameters.controls.disable: true`** when there are no `argTypes`, otherwise the Controls panel is empty.
- **Vue docs read locale from `useTranslation()`** (not Pinia / `useLocaleStore`) — historic crash.
- **Never give an interactive primitive a fixed `height`** — button, input, textarea, label, badge, select. Height is a *result* of `padding-block` + `line-height`, so the component grows with the browser font size (WCAG 1.4.4, Resize Text 200%). `--height-*` tokens stay valid for containers (cards, modals, sidebar) and for icons, which have no text to grow.
- **Never put a design value in an inline `style`** — general rule, all five stacks, in the primitive, in the story and in the docs page alike. Inline beats the sheet, so the declaration leaves the theme, the density and the type scale behind. Mechanical properties, mechanical values, `var(--token)`, custom properties and snippets shown to the reader are not violations. Canonical text (scope, exceptions, measured debt, missing utilities) lives in `docs/shared/guidelines/12-tokenizacao-dimensoes.md`; gate is `inline_style_design_value` in `scripts/audit.mjs`. Fixing means moving to a `.nds-*` class — if the utility is missing, say which; never crayon the value.
- **In coloured containers, running text is always `--foreground`** — alert, badge, callout, banner, toast. Icon and title may carry the semantic colour (short elements, 3:1 threshold); description and body copy may not, because semantic colour over a soft background rarely reaches the 4.5:1 that long text requires. Contrast must never depend on which variant was chosen.
- **Guidelines carry no implementation code** — `nortear-design-system-*/guidelines/*.md` hold purpose, textual structure (ASCII tree), tables of props/flags/events, usage rules and a11y. Compilable code ages faster in a guideline than in the component it describes. Canonical model: `## DataTable` in `08-display-components.md`. Cross-cutting guidelines (`01-acessibilidade`, `09-seguranca-xss`) may show a snippet that illustrates a *rule*, never a component API.
- **User-facing wording is plain Portuguese** — "Espécimes" was rejected in favour of "Exemplos visuais". Internal code names may keep the technical term; what the reader sees may not.
- **The theme toolbar needs a module-level channel listener** — in react/vue/svelte `preview.ts`, applying `tema-*` / `densidade-*` / `fonte-*` classes only through a decorator + `useEffect` never reverts to Default: those renderers skip the decorator re-render when the toolbar returns to `defaultValue`. Subscribe to `GLOBALS_UPDATED` and `SET_GLOBALS` at module level, guarded by `typeof document !== 'undefined'`.
- **Every event in `analytics.table.*` must exist typed in `AnalyticsEvents`** — the docs pages *are* the consuming product, so components inside them fire real product events. Payloads carry stable values (slug, `side`, `variant`), never translated text, which would split one event into three in GA4.

## Cross-Stack Source Of Truth

**Vanilla is the reference.** In any divergence of markup, `.nds-*` classes or behaviour, the other four stacks align to it. React, Vue, Svelte and Angular run a headless lib (`@base-ui` / `reka-ui` / `bits-ui` / `@radix-ng/primitives`) that injects its own markup and state attributes, which hides shadcn residue inherited from before the `.nds-*` migration. Vanilla has no lib: what is there is what the design system actually defines, and every divergence investigated so far ended with Vanilla right. React was the reference in the shadcn + Tailwind era — the migration inverted that.

Exception: divergence in **framework API** (prop name, composition shape, event syntax) has no source of truth. Record it instead of "aligning".

## Working Rules

Process rules, each learned from a concrete failure. They bind the orchestrator and every subagent.

- **The repository is public.** Never commit measurement IDs, tokens or credentials — GA4 IDs live in `manager-head.html`, which is why that file must not carry a real ID in a commit.
- **Close every known pendency of a component in the same pass.** When a component is under review, resolve all of its open items across the five stacks; do not record them in `FIXES-NEEDED.md` and move on. Only a decision that is genuinely the user's may stay open, and it is asked for on the spot. The goal is finishing the list with every component correct in every stack.
- **A verificação sai da MUDANÇA, não do hábito.** Antes de rodar qualquer coisa, responda em uma frase: *que portão veria este defeito?* Rode esse, e só esse. Em 2026-08-23 troquei a URL de um link e pedi 15 portões e 9 suítes: **118 minutos** para uma mudança de seis arquivos cujo único risco real era resolução de módulo. Bastavam os cinco builds e o teste novo — sete minutos. O escopo grande não era cautela, era o reflexo de quem vinha de lotes de 1.200 arquivos com falha invisível.

  | o que mudou | o que rodar |
  |---|---|
  | texto de `translations.json` | `audit.mjs` — texto não compila |
  | um componente `ui/<slug>` | build da stack + a suíte **daquele slug** |
  | CSS compartilhado `.nds-*` | as stories que usam a classe, nas cinco |
  | módulo folha novo em `docs/shared/` | os cinco **builds** (resolução de módulo) + o teste do próprio módulo |
  | binding de template do Angular | `npm run build` (`ngc --noEmit`) — só ele type-checka isso |
  | renomeação em massa, mudança de contrato | tudo, e em bloco |

  Suíte inteira é para mudança que atravessa o grafo. Para mudança local, suíte inteira não é rigor — é ruído caro, e some no meio dele o sinal que importava.

  **Build é o portão default; suíte de navegador só sob pedido explícito da dona.**
  Segunda ocorrência em 2026-08-23, na revisão do switch: rodei storybook e
  `docs-smoke` em bloco a cada correção, perto de uma hora de relógio, e ainda
  entreguei com pendência aberta. O erro não foi escolher o portão errado — foi
  rodar o caro POR HÁBITO depois de cada passo, em vez de corrigir tudo e medir
  uma vez. Markup e texto não precisam de navegador: precisam compilar.

- **Ao testar mais de uma stack, PARALELIZE em até três agentes.** Sequencial custa a soma; três em paralelo custam o máximo. O teto é três porque cinco vitest de navegador ao mesmo tempo disputam CPU e porta nesta máquina, e disputa vira o impasse descrito na regra da suíte destacada. Cada agente pega uma stack inteira (lint, build, build-storybook, suítes) e não compartilha diretório de saída com os outros.

  **GPU não ajuda aqui, e vale saber por quê antes de tentar:** a suíte é limitada por processo e por E/S, não por rasterização. O `chrome-headless-shell` roda com renderização por software de propósito — habilitar GPU nele troca velocidade por instabilidade, e a VRAM não é endereçável como memória de sistema para o node. O gargalo medido nunca foi throughput: foi um impasse com os workers a 1s de CPU.

- **Diagnose fully, fix everything, then test once in a block.** Read and measure the whole scope before editing; apply every fix in scope before any run; run the block once; re-fix only what failed; re-run only that. No bidirectional proofs by default, no per-page gate probes, no canary per slug, no "just to confirm" re-runs. The cost this avoids is a test suite per fix, not parallelism — fan out agents as widely as the work allows, as long as each one follows this same order inside its own scope.
- **Portão só vale depois de saber o que ele cobre.** Declarei "build limpo nas cinco" com base no `npm run build` sem saber o que ele alcançava. Três arquivos do Svelte não compilavam (`import "./rotulos"` órfão, dois `Identifier already declared`) e a dona descobriu pelo CI, não por mim.

  **Medido em 2026-08-26, e o mapa mudou** — a versão anterior desta regra dizia que o build compilava "o sandbox, não o grafo", e isso está errado hoje. Plantando um erro de tipo em cada arquivo, uma stack por vez:

  | o que o `npm run build` type-checa | react | vue | svelte | vanilla | angular |
  |---|---|---|---|---|---|
  | arquivo de story | ✓ | ✓ | ✓ | ✓ | ✓ |
  | docs page | ✓ | ✓ | ✓ | ✓ | ✓ |
  | `.storybook/` | ✓¹ | ✓¹ | ✓ | ✓ | ✓ |

  ¹ passou a cobrir em 2026-08-26. Antes, React e Vue tinham `include: ["src"]` e a pasta ficava de fora — e havia **15 erros de tipo reais** dormindo ali, invisíveis: seis `showName` por stack sem a supressão que as outras três já carregavam, uma diretiva `@ts-expect-error` OBSOLETA no import do SVG (os tipos do `vite/client` já cobrem, e por isso as três stacks checadas nunca a tiveram) e um TS6307 no Vue. Vale reparar no mecanismo: `@ts-expect-error` inútil só aparece para quem checa o arquivo, então a pasta não checada acumulava supressão nos dois sentidos.

  Import órfão também reprova nas cinco. **O que isto NÃO diz** é que `build-storybook` virou dispensável: ele continua sendo quem EMPACOTA cada story, resolve addon e monta o índice — e isso não foi medido aqui. O que mudou é a leitura de "o build não vê stories", que era falsa.

  Antes de chamar um portão de verde, saiba o que ele NÃO olha: `tsc` não vê string de host binding do Angular nem `<template>` de SFC, `svelte-check` com `--threshold error` engole aviso, `eslint` não abre arquivo que o `include` do tsconfig não alcança — e o `include` é justamente o que precisa ser conferido, porque é ele que decide o alcance de todos os três.

- **Suíte longa roda em processo DESTACADO.** Complementa a regra do primeiro plano acima: em 2026-08-22 a suíte do Vue morreu com exit 127 aos 14 minutos, sem escrever uma linha de resultado — quarta ocorrência do padrão. O harness encerra tarefas de background sem aviso, e `npm test > arquivo` com stdout redirecionado não é observável no meio (o vitest só imprime no fim, fora de TTY). Relançada por `Start-Process` de um `.cmd`, fora da árvore de processos do harness, a mesma suíte fechou em 328s. Para suíte de mais de dez minutos, destacar é o padrão, não o contorno. **Quinta ocorrência em 2026-08-23**, e a assinatura vale de cor: 44 minutos de relógio com os workers OCIOSOS — 1s de CPU somado em 15 processos ao longo de um minuto — e a árvore de processos inteira viva. Não é lentidão, é impasse; a mesma suíte destacada fechou em 146s. Antes de esperar mais, meça o CPU dos workers: parado com processo vivo é impasse, e esperar não resolve.
- **`waitFor` que MEXE no DOM não reprova — PENDURA.** O `waitFor` da suíte reagenda por observador de mutação. Se a condição toca o DOM (sonda que pendura um `<span>` para resolver cor, leitura que força layout) e a primeira tentativa falha, a própria tentativa provoca a próxima: o prazo nunca chega, o navegador crava 100% de um núcleo, e a aba morre **sem resultado e sem falha** — levando o arquivo inteiro junto. Medido em 2026-08-26: a asserção com `waitFor` e o defeito plantado queimou **420 s de CPU sem reportar**; a mesma asserção com espera de relógio reprovou em **2,2 s**.

  Três agentes independentes bateram nisso no mesmo dia, e um deles perdeu dois blocos de dez minutos antes de entender. Pior: a armadilha é LATENTE — no caso feliz a condição assenta na primeira tentativa e ninguém vê. Foi assim que uma story passou meses verde e travou no dia em que o tema passou a abrir no escuro, porque aí a classe chega antes da repintura.

  Regra: dentro de `waitFor`, só leitura pura. Resolva token, monte sonda e force layout **antes**, uma vez; para esperar algo que a lib repinta, use laço de relógio com prazo. E ao verificar que um portão tem dentes, plante o defeito: portão que pendura parece portão que passa.

- **Run vitest in the foreground**, `Bash` timeout 600000. Background runs have been killed silently three times on this machine: no node process, no result file, the agent waits forever. Redirect to a scratchpad file if the output needs parsing.
- **Saída de instalador se lê pelo código de saída e por `grep`, nunca por `tail`.** O `npm install` que levou `svelte-sonner` de 1.1.1 a 1.2.1 imprimiu `**ERROR** Failed to apply patch` no meio da saída, e eu li só a última linha — `Run npm audit for details.`, que é ruído fixo. O CI reprovou no passo de instalação por um dia inteiro, e pior: o patch deixou de valer no ambiente local sem aviso, então tudo que medi naquele componente valeu para um estado que o design system não entrega. Ao verificar instalação ou build, cheque `$?` e faça `grep -iE "error|failed|ERR!"` na saída inteira; `tail` serve para ver se terminou, não para saber se deu certo.

- **Bump de dependência invalida patch, e o patch não avisa.** `nortear-design-system-svelte/patches/` e `nortear-design-system-vue/patches/` existem e o `postinstall` roda `patch-package`. O nome do arquivo carrega a versão (`svelte-sonner+1.2.0.patch`): subiu a versão, o patch para de aplicar. Depois de qualquer atualização, rode `npx patch-package` e confirme a linha `pacote@versão ✔`. Se o upstream tiver corrigido, apague o patch; se não, refaça com `npx patch-package <pacote>` e remova o arquivo antigo.

- **Suíte lenta é lixo de processo até prova em contrário.** Medido em 2026-08-21: a suíte do React levava ~290s com um `vitest run` órfão de pé desde a manhã — morto por timeout, nunca encerrado — segurando 14 `chrome-headless-shell`, mais um `storybook dev` de 3,5 GB da véspera. Com a máquina limpa, 162,6s. Quarenta e quatro por cento do relógio, sem tocar em código, e mais do que o `isolate: false` economiza em cima disso. O `pretest` de cada stack roda `scripts/limpar-orfaos.mjs` e encerra processo de teste com mais de 20 min (não mexe em `storybook dev`, só avisa). O sintoma barato de reconhecer é `Port 63315 is in use, trying another one...` na abertura. Antes de investigar intermitência "sensível a carga", confira se a carga não é sua.

- **Portão sem dentes é pior que portão nenhum, e "passou" não prova que ele mede a coisa certa.** O guarda de rolagem horizontal media o `<html>`, que não transborda porque quem rola é o container da story: ficou verde com a barra visível na tela. Todo portão novo se verifica reintroduzindo o defeito — e, quando o defeito é de layout, contra o elemento que de fato recorta, não contra a raiz.

- **Portão que FILTRA exclui em silêncio; portão que mede COBERTURA precisa reprovar.** O `source-snippets.test.ts` varria os construtores de snippet filtrando por `/(?:Source|Snippet)$/`. Quando a tradução de identificadores moveu o sufixo para o meio do nome (`buttonParDeAcoesSource` → `actionsSourceButtonPair`), 28 exports do Vue saíram da varredura: nenhum reprovou, a contagem encolheu, e a suíte seguiu verde medindo menos. Nenhum dos três portões podia pegar — o nome ficou consistente na declaração e em todo uso. Onde a contagem de testes é GERADA a partir de uma lista, some sem deixar rastro: quem não entra na lista tem de se declarar numa exceção nomeada, e o que não estiver declarado reprova. Corolário para medir: comparar com a rodada anterior não prova nada se ela já vinha danificada — compare com o commit anterior à mudança.

- **`build-storybook` do Angular NÃO faz type-check de template.** Passou verde com sete `TS2339` de pé — `@for (mes of meses(); track mes.value)` com a variável renomeada só na declaração, e `tabela().cabecalho` contra um produtor que já devolvia `header`. O único portão que alcança expressão de template é `npm run build` (`ngc --noEmit`). Vale a mesma leitura das outras stacks: saber o que o portão não olha antes de chamá-lo de verde.
- **Never `git stash` while agents share the repo.** The stash is global — one agent's `pop` destroys another's entry, and uncommitted work disappears. To compare against a baseline, copy the file to the scratchpad and restore it, or use a separate worktree. The scratchpad is shared too: prefix filenames with the stack name.
- **Stage only your own paths.** `git add -A` sweeps in whatever a concurrent session left in the tree.
- **An intermittent failure never closes as "does not reproduce".** It closes as fixed, or it stays open. Measure in pairs on the same machine (`git checkout HEAD~1 -- <stack>`, run, restore, run). An axe contrast violation with a ratio near 1.0 and near-identical colours is an element mid-fade, not a bad palette — the fix is making the play wait for it to settle, never `a11y.test: 'todo'`.
- **Commit when a task closes**, without asking; one commit per subject. Push still requires an explicit request. Branch first if on the default branch.
