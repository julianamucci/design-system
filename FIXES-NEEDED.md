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
- ~~nenhuma story monta docs pages~~ — **RESOLVIDO (2026-07-31)**: suíte de
  fumaça `docs-smoke.stories.*` nas 4 stacks (commits 49d8fd7b react, f0f9c1a4
  vue, 3a65c0d5 vanilla, 34080de9 svelte). Toda docs page agora monta no
  runner; crash de página é teste vermelho. Página limpa tem axe como PORTÃO;
  a dívida axe restante está catalogada em modo `todo` nas seções por stack
  abaixo e na consolidação.

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

## Fumaça das docs pages — vue (2026-07-31, commit f0f9c1a4)

63 páginas · 39 limpas (axe = portão) · 24 em todo · 0 crash.
`testTimeout: 120s` (IconsDocs leva ~75s legítimos sob axe).

| Página | Rules |
| --- | --- |
| avatar | aria-prohibited-attr |
| breadcrumb | landmark-unique |
| button | scrollable-region-focusable |
| calendar | landmark-unique |
| carousel | landmark-unique |
| checkbox | empty-heading, target-size |
| command | aria-required-children, button-name, empty-heading |
| icons | color-contrast |
| input | label |
| label | empty-heading |
| navigation-menu | aria-hidden-focus, landmark-unique |
| pagination | landmark-unique |
| radio-group | empty-heading |
| select | empty-heading |
| sidebar | empty-heading, landmark-no-duplicate-main, landmark-unique |
| skeleton | aria-prohibited-attr |
| slider | empty-heading |
| sonner | landmark-unique |
| switch | button-name, empty-heading |
| textarea | empty-heading |
| theme-system | heading-order |
| toggle | empty-heading |
| toggle-group | button-name, empty-heading |
| tooltip | button-name |

Top 3: empty-heading (11 páginas — h3 vazio recorrente nas seções, padrão
sistêmico só do Vue), landmark-unique (7), button-name (4).

## Fumaça das docs pages — vanilla (2026-07-31, commit 3a65c0d5)

64 páginas · 44 limpas (axe = portão) · 20 em todo · 0 crash.
`testTimeout: 45s` (IconsDocs ~20s sob axe). Nenhum vazamento de
observers/subscriptions entre os 64 testes em sequência.

| Página | Rules |
| --- | --- |
| accordion, breadcrumb, carousel, navigation-menu, pagination | landmark-unique |
| calendar, icons | color-contrast |
| context-menu | aria-required-parent, color-contrast |
| select | color-contrast, select-name |
| sidebar | color-contrast, listitem |
| dropdown-menu, menubar | aria-required-parent |
| input, slider, textarea | label |
| switch, toggle-group | button-name |
| avatar, chart | aria-prohibited-attr |
| checkbox | aria-toggle-field-name |

Top 3: landmark-unique (5), color-contrast (5), aria-required-parent e label
(3 cada).

## Fumaça das docs pages — svelte (2026-07-31, commit 34080de9)

63 páginas · 43 limpas (axe = portão) · 19 em todo · 1 fora (Icons, excluída
por decisão da dona — o catálogo lucide completo falha por timeout mesmo com
360s; comentário `// FORA:` no arquivo). `testTimeout: 120s`. Alert saiu limpo
nas 3 execuções (sanidade do harness).

Crash real encontrado e CORRIGIDO: **InputOTPDocs nunca montava nesta stack**
— usava a API React do input-otp (`<InputOTPSlot index={N}/>`) enquanto o slot
Svelte (bits-ui PinInput) exige `cell` → `TypeError: reading 'isActive'`. Os 8
sites renderizados foram corrigidos para `{#snippet children({ cells })}`.
**Dívida remanescente**: as code strings didáticas da página (codeSixDigits
etc.) ainda ensinam a API `index={}`/`maxLength` que não existe nesta stack —
mesmo padrão de "docs ensinando API velha" já visto no alert; corrigir na
revisão do input-otp.

| Página | Rules |
| --- | --- |
| avatar | aria-prohibited-attr |
| breadcrumb | landmark-unique |
| calendar | landmark-unique |
| carousel | landmark-unique |
| checkbox | button-name, empty-heading, target-size |
| command | aria-required-attr, aria-required-children, button-name, nested-interactive, target-size |
| dialog | scrollable-region-focusable |
| label | label |
| navigation-menu | landmark-unique |
| pagination | landmark-unique |
| popover | label |
| radio-group | button-name |
| select | color-contrast |
| sidebar | landmark-unique |
| skeleton | aria-prohibited-attr |
| sonner | landmark-unique |
| switch | button-name, heading-order |
| toggle-group | aria-allowed-attr |
| tooltip | button-name |

Top 3: landmark-unique (7), button-name (5), aria-prohibited-attr e
target-size (2 cada).

Bônus do portão: svelte-check caiu de 735/748 para **689** erros (novo
baseline).

## Fumaça das docs pages — CONSOLIDAÇÃO 4 STACKS (2026-07-31)

253 páginas no runner · 167 limpas com axe como portão · 84 em todo ·
2 crashes reais de produção encontrados e corrigidos (DropdownMenuDocs react,
InputOTPDocs svelte) · 1 página excluída (Icons svelte).

**Rules sistêmicas — um fix nos containers compartilhados limpa dezenas de
páginas:**

1. **landmark-unique** — 27 páginas nas 4 stacks (accordion, breadcrumb,
   calendar, carousel, navigation-menu, pagination, sidebar, sonner…). O demo
   renderiza `<nav>`/`<aside>`/`<header>` repetidos sem `aria-label`
   distintivo. Provável fix único no padrão de demo/preview.
2. **empty-heading** — 11 páginas, SÓ no Vue: alguma seção do Vue renderiza
   `<h3>` vazio quando a chave não existe. Fix em um container Vue.
3. **color-contrast / button-name / label / aria-prohibited-attr** — padrões
   por componente (avatar e skeleton falham aria-prohibited-attr nas 4 stacks;
   select falha select-name/color-contrast em 3) — fix no primitivo vale para
   as 4 stacks de uma vez.

**Assimetria da página Icons (a decidir na revisão):** react = `a11y.disable`
justificado na story · vue = roda com timeout 120s (75s reais) · vanilla =
roda com 45s · svelte = excluída da fumaça. Padronizar quando o grid for
virtualizado/paginado — isso destrava axe nas 4.

**Melhoria cross-stack sugerida pelos 4 agents:** as 16 páginas Foundations
renderizam `<section>` sem `id` nas 4 stacks — a play da fumaça precisou de
seletor relaxado. Dar `id` às sections de Foundations ganha âncora de
deep-link de graça e devolve a play estrita `section[id]`.

## Lote landmark-unique — RESOLVIDO em 22 páginas (2026-08-01)

Commits: `c9e9b736` vanilla · `62443ee2` svelte · `9f873e45` vue ·
`5a735585` react. Páginas em `a11y: todo` (total 4 stacks): 84 → 64 (as
tabelas por stack acima ficam superadas na família landmark-*).

Canon aplicado (agora regra em `_dev-shared.md` §Landmarks repetidos):
aria-label por instância = título visível do bloco via t(); Toaster único por
página; `<main>` só na Demonstração; nav de mês do Calendar não é landmark.
Provas bidirecionais por stack (pagination/breadcrumb/sonner) — reverter o
fix faz a rule voltar. Nenhum pixel, nenhum arquivo de `docs/shared/`,
nenhuma string inventada.

Bônus svelte: `</script>` literal não escapado em template string no
`SidebarDocs.svelte` quebrava o svelte2tsx de meio arquivo — escapado;
**svelte-check: 689 → 353 erros (novo baseline)**.

### Restos do lote — RESOLVIDOS (2026-08-01, arbitrados pela dona)

- ~~accordion~~ — a hipótese "categoria 4" tinha DUAS causas distintas:
  - **vanilla (`cf45697a`)**: NÃO era conteúdo — bug real de id duplicado no
    factory (`accordion-trigger-${value}` sem escopo de instância; 3
    accordions com `item-1` na página → `aria-labelledby` resolvia para o 1º
    id do documento e igualava as accessible names). Ids agora com escopo por
    instância. Zero mudança de conteúdo.
  - **react (`9f8f0de6`)**: colisão real de conteúdo (Demonstração e variante
    single abriam `q1`). A single usa itens próprios `q2/q3` do pool
    existente — `translations.json` intocado. Prova bidirecional em ambos.
  - Vue/Svelte nunca flagaram accordion. Ambas as páginas agora são portão.
- ~~navigation-menu popup (react)~~ — **`135dbd9d`**: `render={<div/>}` no
  Popup (wrapper `navigation-menu.tsx`), alinhado à referência vanilla.
  Provado em modo portão: só resta `aria-hidden-focus` (outro lote).
- ~~Calendar svelte~~ — **`0ea14661`**: `nav`→`div` no
  `calendar-nav.svelte` (markup do próprio projeto, não do bits-ui); página
  virou portão; svelte-check estável em 353.

**Saldo final do lote landmark: 84 → 60 páginas em todo; famílias
`landmark-unique`/`no-duplicate-main` ZERADAS nas 4 stacks.**

Paridade pendente (pré-existente, fora do lote): os previews de variantes do
accordion divergem entre stacks (vanilla usa strings locais "Pergunta 1",
react usa chaves t()) — candidato para o `/cross-stack accordion` na revisão
do componente.

## Série serial de dívida axe (2026-08-01) — 3 lotes, 1 agent por vez

Processo novo (ordem da dona): corrigir tudo → testar em bloco 1x → re-corrigir
só falhas; sem provas bidirecionais/canários redundantes.

1. **empty-heading (vue)** — `aa3d02bc`. Causa única:
   `DocsAccessibility.vue:49` renderizava o `<h3>` do bloco de teclado
   incondicionalmente com `keyboardTitle` opcional vazio; `v-if` matou as 11
   páginas. 7 viraram portão (label, radio-group, select, sidebar, slider,
   textarea, toggle).
2. **aria-prohibited-attr (4 stacks)** — `c7a38579` react · `06fe2ee7` vue ·
   `e31d6d82` svelte · `95642e61` vanilla. `aria-label` em elemento genérico:
   fallback de avatar com ícone → `role="img"`; dot de status e containers de
   loading do skeleton → `role="status"` (o vanilla já fazia certo no
   skeleton); chart rotulado → `role="img"` no call site. Snippets didáticos
   atualizados para ensinar o padrão. 8 páginas viraram portão.
3. **select (react/vanilla/svelte)** — `ea279e7a` · `e379fec9` · `cbc748d5`.
   Dois achados de valor além do axe:
   - **color-contrast**: `color: var(--primary-foreground)` SEM `hsl()` —
     declaração inválida (tokens são triplets), texto herdava `--foreground`
     sobre `--primary` = 1.1:1. Fix: classe `nds-text-primary-foreground`
     (como o Vue, que já era portão). CANDIDATO A VARREDURA: outros
     `var(--…)` de cor sem `hsl()` em estilo inline podem existir no repo.
   - **select-name**: prosa/snippet com `<select>` literal passando por
     `innerHTML`/`dangerouslySetInnerHTML` virava um `<select>` DOM REAL sem
     nome (react passava snippet JSX como notes; vanilla, 2 call sites sem
     escape). Select agora é portão nas 4 stacks.

4. **button-name (4 stacks)** — `56ddc376` vue · `9c4b32cc` svelte ·
   `2e21eb3a` react · `f61722b6` vanilla. Rótulos via chaves t() existentes
   dos blocos; rule ZERADA nas 4 stacks. Achados de valor:
   - **`role="combobox"` não aceita name-from-content** — o texto visível do
     trigger não conta como nome; todo combobox precisa de aria-label
     (command nas 4 stacks tinha isso).
   - **Bug real no svelte: `asChild` NÃO existe no bits-ui** — em
     `CommandDocs.svelte` o `<PopoverTrigger asChild>` virava
     `<button aschild="true">` wrapper SEM nome (e gerava nested-interactive
     + target-size no mesmo node). Trocado pelo snippet `child`.
   - Bônus: `DocsAccessibility.svelte` tinha o mesmo `<h3>` incondicional do
     Vue (lote 1) — mesmo fix aplicado.

- [ ] **VARREDURA PENDENTE — `asChild` fantasma no svelte**: o mesmo bug
  latente (`asChild` inerte virando wrapper `<button>` sem nome) aparece em
  BreadcrumbDocs, ButtonDocs, AspectRatioDocs, AlertDialogDocs e
  AccordionDocs do svelte. Candidato a lote serial próprio: trocar pelo
  snippet `child` (padrão da stack) + alinhar code strings didáticas.

5. **Sweep final (4 stacks em paralelo, 1 agent por stack)** — `76e26247`
   react · `8b5492b3` vue · svelte (2 commits) · `f35c5ae2` vanilla ·
   `4b389ade` alinhamento cross-stack. 19 páginas viraram portão. Padrões que
   se repetiram e valem como regra:
   - **Snippet virando DOM real** (3ª e 4ª ocorrência): `extensibilityCode`
     passado como `extensibilityNotes` (react textarea) e `<input
     type="range">`/`<textarea>` literais em prosa vanilla — o parser HTML é
     case-insensitive, então `<Textarea/>` de snippet vira campo real sem
     rótulo. REGRA: snippet vai por CodeBlock; tag literal em prosa exige
     escape `&lt;`.
   - **Elementos com role custom não pegam name-from-content**:
     `role="radio"/"switch"/"checkbox"/"combobox"` renderizados como
     `<span>`/`<div>` precisam de `aria-label` — `<label for>` não nomeia
     elemento não-rotulável.
   - **`opacity` inline derrubando contraste** (vanilla, 4 páginas): dim
     decorativo em texto já muted levava a 1.5–3.7:1. Removido; o card
     semântico já sinaliza o don't.
   - **Primitivos corrigidos** (todos sem mudança de API/pixel):
     `calendar.tsx` react (nosso override repassava `scope` para `<td>`),
     `toggle-group.svelte` (o `role="toolbar"` era letra morta — bits-ui
     sobrescreve com `role="group"` — e sobrava `aria-orientation` inválido),
     `Table` nas 4 stacks (`tabindex="0"` no wrapper com overflow).

- [ ] **Divergência cross-stack aberta — `role="toolbar"` no toggle-group**:
  react declara `role="toolbar"` (`toggle-group.tsx:42`), svelte não tem
  mais, vanilla (referência) nunca teve. Não há violação de axe no react
  (usa `data-orientation`), então é divergência de árvore de acessibilidade,
  não bug. Decidir: alinhar react à referência ou documentar a diferença.
- [ ] **Cores inertes no vanilla** (latente, achado do sweep):
  `SidebarDocs` usa `style.color = 'var(--sidebar-foreground)'` e
  `color-mix(... var(--color-destructive) ...)` — tokens são triplets HSL e
  `--color-destructive` não existe, então as declarações caem. Corrigir muda
  pixel; fica para uma passada de cor dedicada. Mesma família do bug
  `var(--primary-foreground)` sem `hsl()` já corrigido no select.

**Placar da dívida axe em `a11y: todo`: 84 (colheita) → 17** (verificado por
grep nos 4 arquivos de fumaça, não por soma de reportes).
Por stack: react 7 · vue 4 · svelte 3 · vanilla 3 (+1 `a11y.disable` no
Icons react). O que resta é decisão, não varredura: `target-size` (muda
pixel/primitivo), `aria-required-children/parent` (estrutura de
command/menubar/context-menu/dropdown), `aria-hidden-focus` (focus guards
internos do Base UI — recomendação: exceção documentada, não é corrigível do
nosso lado sem gambiarra).

Histórico anterior ao sweep (para referência): 36 páginas.
Rules restantes mais frequentes: target-size, aria-required-children/parent,
aria-hidden-focus (focus guards Base UI — provável exceção documentada),
aria-toggle-field-name, label, color-contrast (icons/calendar/command),
nested-interactive, scrollable-region-focusable, scope-attr-valid,
heading-order, listitem, aria-allowed-attr.

### Pré-existências confirmadas fora do escopo (provadas com stash)

- react: `aria-hidden-focus` dos focus guards do Base UI em stories `ui/*` +
  `data-active` em pagination-variantes (6 falhas).
- vue: 12 falhas em stories de carousel/navigation-menu/sidebar + calendar
  Playground (`role "grid"` ausente); Motion `color-contrast` 1.02 flaky sob
  carga (passa isolada).
- svelte: 15 falhas de interação em stories de pagination/navigation-menu/
  sidebar (backlog dos 50/180).
- vanilla: `target-size` nos dots de 8px em `carousel-composicoes > Com Dots`.
