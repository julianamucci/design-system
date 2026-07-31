# Fixes Pendentes — Pipeline `new` code-block — 2026-07-30

O lote completo (opção 3) foi aplicado. Sobrou **um** item, e ele precisa de
decisão sua — não é trabalho parado por falta de tempo.

---

## Aberto — precisa de decisão

- [ ] **Warning `a11y_no_noninteractive_tabindex` no primitivo Svelte.**
  A região de scroll do CodeBlock tem `tabindex="0"` de propósito: é o que
  permite rolar o bloco sem mouse (WCAG 2.1.1), e está documentado na própria
  docs page.

  Minha instrução era resolver com `role="region"`. **Não resolve** — conferi na
  fonte do compilador (`svelte/src/compiler/phases/2-analyze/visitors/shared/a11y/index.js:315`):
  a regra só aceita roles **interativos** (descendentes de `widget`), e `region`
  e `group` são não-interativos por definição.

  As saídas são três, todas com custo:
  1. **Aceitar o warning** (estado atual) — 1 warning por build na stack Svelte.
  2. `role="textbox"` ou `tabpanel` — silencia, mas é semanticamente errado, e
     repetido nos ~20 blocos da docs page ainda arriscaria o `landmark-unique`
     do axe.
  3. `svelte-ignore` documentado — a política do projeto proíbe.

  Aplicar qualquer role só no Svelte criaria divergência de árvore de
  acessibilidade contra as outras 3, que usam `<div tabindex="0">` sem role. Por
  isso ficou como está.

---

## Aplicado nesta rodada

Containers (nas 4 stacks): `trackId` estável no `DocsVariants` (o `snippet_id`
deixou de ser o nome traduzido), `extensibilityCode` no `DocsProps` (React, Vue
e Svelte — o Vanilla já tinha, e os overrides do Vue e do Svelte eram código
morto), `description` das 3 sub-seções no `DocsTestes` (o Vue declarava e nunca
renderizava; as outras nem declaravam).

Stories: 15 novas por stack — `code-block-variantes` (6), `-estados` (5),
`-composicoes` (4). Nomes idênticos nas 4. **16/16 verdes em cada.**

Play do Playground: `[role="status"]` em vez de seletor por classe,
`aria-live="polite"`, `aria-hidden` no gutter e no ícone, `Tab` + `{Enter}`
(não `click`), foco na região de scroll, reset em 2s.

Locais: Do & Don't par 2 alinhado ao Vanilla nas 4, `component-slug` no Vue,
toggle "Ver código" no Vue e no Vanilla, `footer` no transform do Svelte,
`nds-w-full` por bloco, nav lendo de `ui.json`, `block_empty` do Svelte
resolvido, segundo bloco de Importação restaurado no React.

Fora do componente: emoji removido de `accordion`, `alert` e `button` (os 3
últimos dos 48 fora da regra), `Vanilla` acrescentado ao `aiEntities`, e o
`ComponentDemo` do React trocando Tailwind inerte por `.nds-*`.

---

## Precisa de validação visual sua

Duas mudanças alteram pixels e não têm cobertura de regressão até o próximo
Chromatic:

- **`ComponentDemo` (React)** — as classes eram Tailwind inertes desde a
  migração: o container renderizava **sem** padding, centralização ou superfície.
  Agora renderiza com. Afeta 3 arquivos que o usam.
- **Reset global de `box-sizing`** (pendência anterior) — 34 regras com dimensão
  fixa + padding.

---

## Backlog anterior, não tocado aqui

- `button`: 53 violações de audit (39 `noop_assertion`), pré-existentes.
- Breadcrumb com `item: '/components/<categoria>'` fixo ao lado de `name`
  dinâmico, em 20+ docs pages — refatoração ampla, não cabia neste lote.
- Nav "Estados" (`ui.json`) × heading "Configurações" (`states.title`) no
  code-block: decisão de conteúdo, não de código. O `ui.json` é global (48
  componentes), então mudá-lo por causa de um componente seria pior.

## Lint svelte: RESOLVIDO (2026-08-01)

Os 271 warnings foram zerados em 2 commits (936a4897 docs, 80661d41 ui):
eslint . com 0 problems, svelte-check 750 -> 748.

## Backlog de testes — svelte (pré-existente, medido em 2026-08-01)

A suíte completa (vitest storybook) tem 50 de 180 arquivos falhando. Verificado
por restauração seletiva que NÃO é do lote de lint: tooltip e toggle-group
falham identicamente antes e depois (8/8). É o equivalente svelte dos 61
failures do React já registrados — backlog de correção de primitivos/stories,
não de lint.

## Skills órfãs pré-históricas — REMOVIDAS (2026-08-01, aprovado pela dona)

Os 4 arquivos de `nortear-design-system-react/guidelines/.claude/skills/`
(sistema anterior ao `.claude/commands/`, sem nenhuma referência, ensinando
"variantes customizadas sempre via className") foram apagados. Era o
reservatório mais antigo do padrão morto que regenerava as stories erradas.

## Achados da fumaça do AlertDocs (2026-08-01)

- ~~Violação axe heading-order (AlertTitle h5 sob seções h2)~~ — **RESOLVIDO**:
  `as` configurável no AlertTitle nas 4 stacks (aprovado pela dona), docs pages
  passam `as="h3"`. Axe da página do Alert zerou, com verificação negativa
  (reintroduzir o h5 reproduz exatamente heading-order).
- **ABERTO**: nenhuma story monta docs pages — crash de runtime de página é
  invisível para o vitest (foi assim que 7 páginas quebraram com portões
  verdes, e foi só por fumaça manual que o heading-order apareceu). As OUTRAS
  47 docs pages nunca passaram por axe: o Alert zerou, o resto é incógnita.
  Candidato: story de fumaça por componente ou visita de docs no test-runner.

## Fumaça das docs pages — react (2026-07-31)

`docs-smoke.stories.tsx` no runner: 63 páginas, 41 limpas (axe = portão),
21 em `a11y.test: 'todo'`, 1 com a11y desligado só na story (icons — abaixo),
0 fora. Crash real encontrado e CORRIGIDO:
DropdownMenuDocs usava `DropdownMenuLabel` (Base UI `Menu.GroupLabel`) fora de
`DropdownMenuGroup`/`DropdownMenuRadioGroup` — as previews `defaultOpen`
derrubavam a página inteira no mount.

Dívida axe catalogada (rule ids por página, modo todo — visível no painel a11y):

| Página | Rules |
| --- | --- |
| accordion | landmark-unique |
| alert-dialog | nested-interactive, target-size |
| avatar | aria-prohibited-attr |
| breadcrumb | landmark-unique |
| calendar | landmark-unique, scope-attr-valid |
| carousel | landmark-unique |
| checkbox | target-size |
| collapsible | nested-interactive, target-size |
| command | aria-required-children, button-name, color-contrast |
| dropdown-menu | aria-hidden-focus |
| icons | color-contrast — CASO À PARTE: o catálogo inteiro do lucide (~1600 ícones, sem virtualização) faz o axe estourar 60s de timeout; a story está com `a11y: { disable: true }` em vez de 'todo'. Virtualizar/paginar o grid destrava o axe |
| menubar | aria-required-children |
| navigation-menu | aria-hidden-focus, landmark-unique |
| pagination | landmark-unique |
| radio-group | aria-toggle-field-name |
| resizable | scrollable-region-focusable |
| select | color-contrast, select-name |
| sidebar | landmark-no-duplicate-main, landmark-unique |
| skeleton | aria-prohibited-attr |
| sonner | landmark-unique |
| switch | aria-toggle-field-name |
| textarea | label |

Top 3 rules: landmark-unique (8 páginas), target-size (3), color-contrast (3).

Nota de contrato: as 16 páginas Foundations (FoundationPage/ThemeColors/Icons)
renderizam `<section>` SEM `id` — a play da fumaça usa `querySelector('section')`
em vez de `section[id]` para não dar falso vermelho em página que monta bem.
Dar `id` às seções de Foundations (âncoras) é melhoria futura cross-stack.

Infra: `testTimeout: 60000` no projeto storybook do vite.config.ts — docs
pages inteiras sob axe estouravam os 15s default com os 4 runners em paralelo
(e um timeout no meio da suíte vazava landmarks pra story seguinte: o
`landmark-no-duplicate-banner` fantasma do input-otp era isso).
