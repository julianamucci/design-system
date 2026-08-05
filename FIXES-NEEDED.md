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

- ~~Divergência `role="toolbar"` no toggle-group~~ — **RESOLVIDO
  (2026-08-01, decisão da dona: alinhar pelo COMPORTAMENTO, não removendo o
  role)**. Correção de um erro meu de levantamento: o vanilla **declarava**
  `role="toolbar"` (via `setAttribute`, que meu grep por `role="toolbar"`
  não pegou) mas **não implementava** o contrato de teclado do WAI-ARIA APG
  — o leitor de tela anunciava "barra de ferramentas" e as setas não faziam
  nada. O react declarava E cumpria (roving tabindex, coberto por story).
  Vanilla ganhou ArrowLeft/Right/Up/Down + Home/End circulares e roving
  tabindex, com story cobrindo o contrato.
  **Lição de método**: "vanilla é a referência" é heurística, não dogma —
  aqui a referência era justamente quem estava errada, e o grep por
  `role="toolbar"` não via `setAttribute('role','toolbar')`.
  - **Resta divergente** (não bloqueia): svelte e vue emitem `role="group"`
    imposto por bits-ui/reka-ui, embora suas stories testem navegação por
    setas — o comportamento existe, o que difere é o anúncio. Forçar
    `toolbar` exigiria renderizar a raiz via snippet `child`/`asChild`:
    refatoração de primitivo, decisão futura.
- ~~Cores inertes no vanilla~~ — **RESOLVIDO (2026-08-01)**: `SidebarDocs`
  passou a usar `hsl(var(--sidebar-foreground)[ / 0.7])` e a classe já
  existente `.nds-bg-destructive-soft` no lugar do `color-mix` com o token
  inexistente `--color-destructive`. docs-smoke 64/64 — o axe aprovou o
  contraste real, sem precisar de ajuste de cor.

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
  Playground (`role "grid"` ausente).
- **vue MotionDocs — `color-contrast`: NÃO reproduz mais; não há o que
  corrigir.** Este item mudou de diagnóstico três vezes e as duas primeiras
  leituras foram minhas e erradas ("flaky sob carga"; depois "violação real
  de 1.88"). A terceira — que eu também escrevi — atribuía a violação ao
  congelamento de animação em headless. **Também errada**, e agora com
  evidência: a story `Motion` do docs-smoke do Vue nunca teve
  `a11y: { test: 'todo' }`, sempre rodou o axe completo e passa. O motivo
  técnico é que `motion-v` anima via JS/rAF, que **avança** em headless — o
  congelamento atinge keyframes CSS, não animação por script. Os números
  díspares (1.01, 1.02, 1.88) eram amostras de execuções sob carga que não se
  sustentam. Fechado por ausência de defeito, não por correção.
  **Lição de método**: três diagnósticos sucessivos sem reproduzir de forma
  controlada. O correto teria sido isolar a story antes de teorizar.
  **QUARTO diagnóstico — 2026-08-02, este correto e com medição.** O
  "fechado por ausência de defeito" também estava errado: o defeito existe e é
  uma **corrida**, não contraste. A play `mounted` do docs-smoke retornava no
  mesmo quadro da montagem e o axe (postVisit) media enquanto os elementos
  ainda estavam em `opacity: 0` — daí `1.01 (#fdfdfd sobre #ffffff)`. Passava
  por sorte, e por isso "não reproduzia": dependia do tempo de render das
  páginas anteriores da suíte. Medido em par: árvore em `HEAD~1` 63/63, árvore
  com a seção de leitor de tela 62/63, mesma máquina, falha determinística.
  Corrigido em `256af081` com uma play `settled` que só devolve quando nenhum
  elemento resta com `opacity` inline < 1. **Lição**: "não reproduz" sob uma
  suíte compartilhada não é ausência de defeito — é ausência de controle sobre
  o tempo. Teste racy fecha como corrigido, nunca como inexistente.
- svelte: 15 falhas de interação em stories de pagination/navigation-menu/
  sidebar (backlog dos 50/180).
- vanilla: `target-size` nos dots de 8px em `carousel-composicoes > Com Dots`.

## Lote alert — demo por capacidade + stories dismissible (2026-08-01)

Commits: `711b6c4e` vanilla · `3602dce3` svelte · `b468603b` vue ·
`f7950616` react (+ chave `demonstration.labels.warningAction` nos 3 locales).

Demo da AlertDocs deixou de repetir o mesmo alert 4×: default sem título,
destructive com título, success dismissible (emitindo `alert_dismiss` com o
payload já usado nas Variantes), warning com ação inline.

**As stories Dismissible/DismissibleTeclado "não carregavam" — causa real:**
a play function FECHAVA o alert e a asserção final era ele ter sumido. Como a
play roda sozinha ao abrir a story, o canvas ficava VAZIO — e o Chromatic
fotografava vazio. Agora um alert novo remonta após o fechamento, e a prova
ficou mais forte: guarda o nó ORIGINAL e assere `not.toBeInTheDocument()`
(o `queryByRole(...) === null` anterior não distinguia "fechou" de "nunca
montou").

### Divergências cross-stack abertas (decisão da dona)

- ~~Ação do alert: texto × comportamento~~ — **RESOLVIDO (2026-08-01)**:
  `1106b591` vanilla · `6347fa8a` svelte · `6d01486c` vue · `b6f2a73b` react.
  Não havia conflito: o texto ("alinhada à direita") sempre esteve certo. O
  componente tem o slot `AlertAction` (`.nds-alert-action` é
  `position: absolute; top; right`, e o próprio CSS documenta "quem precisa de
  ação usa a composição AlertAction"), e a story `ComAcao` sempre o usou. O
  erro foi meu: instruí os agents a empilhar o botão dentro da descrição, e as
  4 docs pages passaram a ensinar markup que quebra linha. Corrigido na demo e
  na composição (preview E snippet) das 4.
  **Lição**: quando story e docs page divergem, a story pode ser a certa —
  conferir qual das duas usa a API real do componente antes de "convergir".
- [ ] **`AlertDescription` do Svelte renderiza `<section>`**, enquanto o
  vanilla (referência) usa `<div>`. Não há justificativa semântica para
  `<section>` dentro de um alert. Primitivo — ficou fora do escopo do lote.

## Motion — classes reutilizáveis de entrada/saída (2026-08-01)

Commits: `eccd694a` (tokens + classes + vanilla) · `f033037a` react ·
`ae9729f2` svelte · `109f4c6e` vue · `28c8db57` (guard na referência).

Referência aprovada pela dona: animação do popover do animate-ui
(spring stiffness 300, damping 25). Nenhuma biblioteca entrou.

- `--ease-spring: cubic-bezier(0.365, 0.565, 0.121, 1.163)` — **ajuste
  numérico**, não escolha visual: erro máximo de 3,1% contra a curva do
  spring, reproduzindo 2,7% dos 3,8% de overshoot. O otimizador está em
  `scratchpad/fit-spring2.mjs` e serve para traduzir qualquer outro spring.
- `--duration-spring: 400ms` — acomodação medida do spring (410ms).
- `.nds-animate-in` / `.nds-animate-out` em `utilities.css`, genéricas.

### Fato de ambiente que vale para TODA animação daqui em diante

**Em Chromium headless — o ambiente dos testes — animações de `opacity` e
`transform` não avançam**: ficam presas no quadro zero com
`playState: "running"` (animações de propriedades de layout, como o
`grid-template-rows` do accordion, avançam normalmente). Consequências:

1. Classe de animação de entrada tem de ser **transitória** (removida por
   `animationend` + timeout). Se persistir, o elemento fica invisível para
   sempre nesse ambiente — reproduzido: as stories dismissible falhavam em
   `toBeVisible`.
2. **Nunca depender só de `animationend`** para remover um nó: além do
   headless, `prefers-reduced-motion` suprime a animação e o evento jamais
   dispara. Timeout de segurança é obrigatório.
3. Asserção de visibilidade em elemento que anima precisa de `waitFor` — é
   racy em qualquer browser, não só no headless.
4. Explica o falso `color-contrast` do MotionDocs (acima).

### Próximos passos possíveis (não feitos)

- [ ] Dialog (`nds-dialog-zoom-in/out`) e Select (`nds-select-zoom-in/out`)
  já têm keyframes com exatamente o mesmo desenho (opacidade + escala 0.95).
  Podem migrar para as classes compartilhadas e eliminar a duplicação.
- [ ] Documentar as duas classes na foundation page de Motion das 4 stacks.

### Cobertura removida a pedido (2026-08-01)

- **Story `TokenIndivisivel`** saiu de `alert-composicoes.stories.ts` (vanilla)
  — a dona apontou, com razão, que não é composição. Mas era o **único guard**
  contra uma regressão real: sem o reset global de `box-sizing`, o
  `width: 100%` do `.nds-alert` media só a caixa de conteúdo e os 32px de
  padding-inline + 2px de borda saíam por fora, deixando o card 34px mais
  largo que o container e gerando rolagem horizontal (visível nas docs pages,
  onde o alert ocupa a largura toda). Como o CSS é compartilhado, a story
  guardava as 4 stacks. Se a cobertura importar, o lugar natural é
  `alert-estados` ou um teste de layout dedicado.

### Ruído pré-existente notado (fora de escopo, não tocado)

- react `alert-dialog`: console avisa `<button> cannot contain a nested
  <button>` e prop `asChild` vazando para o DOM. Não quebra teste, mas
  `asChild` inerte é o mesmo bug já varrido no svelte — candidato a lote.

## Lote alert-dialog (2026-08-01) — dois bugs reportados pela dona

`292c033e` react · `97456749` vue · `05332985` svelte · `b38d0582` react extra.

### 1. React: botão sem estilo por fora do botão correto

`AlertDialogTrigger` declarava `asChild?: boolean` e **nunca usava a prop** —
repassava tudo ao Base UI, que renderizava o próprio `<button>` envolvendo o
nosso, e ainda vazava `asChild` como atributo no DOM. Varredura achou **3
primitivos com o mesmo defeito**: `alert-dialog`, `dialog`, `collapsible`
(corretos: `popover`, `dropdown-menu`, `hover-card`).

**Resolveu dívida axe já catalogada**: as páginas alert-dialog e collapsible
tinham `nested-interactive` E `target-size` no modo todo — as duas rules eram
o mesmo bug (botão dentro de botão; o botão fantasma era pequeno demais).
**As duas viraram portão de axe.**

Achado adicional: `popover.tsx` e `dropdown-menu.tsx` passavam
`nativeButton={false}` com todos os 31 call sites usando `<Button>` nativo —
o Base UI logava `console.error` em dev e aplicava `role="button"` + handlers
de teclado redundantes. Removido. `pagination.tsx` mantém a prop: lá o render
é um `<a>`, que é o caso legítimo dela.

### 2. Vue e Svelte: dialogs abrindo sozinhos no load

Previews da docs page usavam `default-open` (vue, 6×) e `<AlertDialog open>`
(svelte, 6×). Como o componente renderiza em portal com overlay modal, cada
preview aberto cobria a página e eles empilhavam. React e Vanilla nunca
tiveram o problema porque seus previews mostram o **gatilho fechado**.
Convergido: vue ganhou `AlertDialogDemo.vue` (equivalente ao
`buildAlertDialogDemo` do vanilla) e svelte reusou o `AlertDialogStory.svelte`
que já existia.

### 3. `nds-bg-destructive` é inerte sobre botões (achado do lote)

`.nds-bg-destructive` (colors.css) e `.nds-button-default` (button.css) têm a
MESMA especificidade, e `button.css` é importado depois no `index.css` — a
variante do botão vence. O `AlertDialogAction class="nds-bg-destructive"` das
docs pages renderizava com fundo primary. Corrigido em react e vue com
`variant="destructive"` (inclusive nos snippets, que ensinavam a classe morta).

- [ ] **Pendente**: a mesma classe é usada em `ContextMenuDocs`, `SidebarDocs`
  e no container `DocsDoDont` de várias stacks. Sobre elemento que NÃO é botão
  a classe funciona — cada uso precisa ser verificado antes de trocar.

### Falhas pré-existentes confirmadas por stash (não regressões)

- react `dialog-composicoes > Profile Edit`: `input` presente mas não visível.
  **Provável mesma causa raiz da animação congelada em headless** — o
  `nds-dialog-zoom-in` anima opacidade 0 → 1 e trava no quadro zero, então o
  conteúdo do dialog nunca fica "visível" para o jest-dom. Fix provável:
  `waitFor` na asserção, como foi feito no alert.
- react `dropdown-menu-composicoes`: 4 falhas (Com Label, Com Checkbox Items,
  Com Radio Group) idênticas com o primitivo em stash.

## AlertDialog: confirmar não fechava (2026-08-01)

`8e2028af` react · `02a18c99` svelte. Vue e Vanilla nunca tiveram o bug.

Causa diferente em cada stack, mesmo sintoma:
- **react**: `AlertDialogAction` renderizava um `<Button>` puro, sem envolver
  `AlertDialogPrimitive.Close` — o `AlertDialogCancel`, no mesmo arquivo, já
  fazia certo. Corrigido espelhando o Cancel.
- **svelte**: o `AlertDialogPrimitive.Action` do bits-ui **não fecha** — a
  classe `DialogActionState` só expõe id e atributos; quem fecha é a
  `DialogCloseState`. Corrigido renderizando `Dialog.Close` (e não
  `AlertDialog.Cancel`, que sequestraria o `cancelNode` do root — marcação de
  foco inicial de alert dialog).

Em ambos, verificado na fonte da lib que o `onClick`/`onclick` do consumidor
continua disparando ANTES do fechamento (mergeProps encadeia handlers), então
o `track('dialog_confirm', …)` das docs pages segue intacto.

### O que deixou o bug passar: dois testes que codificavam o defeito

As duas stacks TINHAM story `Confirmed`, e as duas afirmavam o comportamento
errado:
- react: clicava e asseverava `toBeInTheDocument()` — ou seja, passava
  justamente por o diálogo continuar aberto. O spy do callback era criado
  dentro do `render`, inacessível ao `play`, então a confirmação nunca era
  checada.
- svelte: o comentário da story dizia explicitamente "bits-ui 2.18:
  AlertDialogAction não fecha automaticamente… validamos apenas que o handler
  foi disparado" — a limitação da lib foi documentada como se fosse contrato.

**Regra**: quando uma story documenta uma limitação de lib, ela precisa vir
com o item correspondente aqui no FIXES-NEEDED. Limitação aceita em silêncio
vira contrato por omissão.

Ambas reescritas: abrem, confirmam, e provam callback disparado + diálogo
fora do DOM (com `waitFor`, por causa do congelamento de animação no headless).

**Chromatic**: o snapshot da story `Confirmed` muda nas 2 stacks — o diálogo
agora fecha. A cobertura visual do aberto continua na story `Open`.

## Animação do alert-dialog + reduced-motion nos testes (2026-08-02)

`8d0c279c` CSS compartilhado + vanilla · `25e4b0b2` react · `98156a01` vue ·
`470d53c4` svelte.

Overlay e painel do alert-dialog passam a animar com o mesmo movimento do
alert dismissible (keyframes `nds-animate-in/out`, tokens `--duration-spring`
/ `--ease-spring`). O overlay só faz **fade**: escalar um backdrop
`fixed; inset: 0` encolheria a cortina e mostraria a página nas bordas — a
escala pertence ao painel, como na referência adotada.

Dois bugs encontrados no caminho:
- A animação de saída que já existia **nunca rodou em 3 das 4 stacks**: o CSS
  só tinha `[data-closed]` (convenção do base-ui), e Vue/Svelte/Vanilla usam
  `data-state`. As três convenções agora estão cobertas.
- O **Vanilla não emitia atributo de estado nenhum** e removia o nó direto.
  Passou a emitir `data-state` e a esperar a animação antes de remover (com
  timeout de segurança); sem animação ativa, remove na hora.

### Infra: `reducedMotion: 'reduce'` no browser dos testes (4 stacks)

`provider: playwright({ contextOptions: { reducedMotion: 'reduce' } })`.

Motivo medido: em Chromium headless animações de **keyframes CSS** de
`opacity`/`transform` não avançam — ficam presas no quadro zero com
`playState: "running"`. Diferente do caso do alert (onde a classe era
transitória e o JS a removia), aqui o `data-state="open"` **persiste**: o
elemento ficaria invisível para sempre e nenhum `waitFor` resolveria. Emular
reduced-motion aciona o `@media` que o CSS já tinha, o teste vira
determinístico e ainda exercita o caminho de quem pede menos movimento.

**Ganho colateral confirmado**: a falha pré-existente
`react dialog-composicoes > Profile Edit` (input presente mas não visível)
**sumiu** — era o `nds-dialog-zoom-in` congelado, como suspeitado.

**Onde NÃO ajudou** (medido, não suposto):
- vue: nada a ganhar — ver item do MotionDocs acima (animação por rAF avança).
- svelte: o backlog de ~46 falhas em suítes com animação é de outra natureza —
  26 são `Unable to find` e 15 `Timed out`, ou seja, o elemento não chega a
  renderizar. Comparação antes/depois idêntica fora do alert-dialog.

- [ ] **Icons sem folga de timeout**: 120s nas 4 stacks, e a página mede
  ~75–112s sob carga concorrente. Falha de forma intermitente quando várias
  stacks rodam em paralelo (é o caso do CI). Virtualizar/paginar o grid
  resolveria de vez — e destravaria também o axe, hoje desligado nessa página
  no react.

## /quality alert-dialog (2026-08-02) — audit zerado, 4 stacks

`867cc2a5` vanilla · `70d0cf6c` vue · `a6b801ea` react · `969aef01` svelte
(auditoria) + `2888ffd3` `71369a7b` `3d5c4f39` (paridade das 2 stories novas).

10 stories por stack (paridade), 100% com play, `audit.mjs --category
quality` retorna `[]`. Asserções do componente: ~70 → ~180.

### Bug real encontrado — teclado inoperante no Svelte

`Enter` e `Espaço` **não ativavam** Action/Cancel: o `DialogCloseState` do
bits-ui trata as teclas no próprio `onkeydown`, fecha direto e **nunca emite
`click`** — o callback do consumidor só rodava com mouse. Confirmação
inoperável por teclado (WCAG 2.1.1), invisível para o axe. Corrigido com
ponte keydown→onclick nos dois primitivos. **Só apareceu porque a skill exige
verificar tecla a tecla** — a lista documentada tinha 5 teclas e só `Escape`
era testada nas 4 stacks.

### Padrões que se repetiram nas 4

- `fn()` criado dentro do `render`: invisível para a play E para a aba
  Actions. Vira spy de módulo.
- ARIA documentado mas verificado só por `toHaveAccessibleName` (indireto):
  agora resolve os ids e compara com o texto real.
- vue: a story `Open` **fechava o diálogo no fim da play** — o Chromatic
  fotografava o estado fechado justamente na story do estado aberto.

### PENDENTE — conteúdo compartilhado contradiz as 4 implementações

Cada stack verificou na fonte da sua lib. Precisa de decisão (recomendação:
**corrigir o texto, não o código** — a implementação está certa nos 4 casos):

- [ ] **"Clique no overlay fecha"** (`functional.item6`, `accessibility.item5`,
  `states.cancelled.trigger`) — falso nas 4. react:
  `disablePointerDismissal = isAlertDialog || prop` · vue:
  `withModifiers(..., ['prevent'])` · svelte: `interactOutsideBehavior =
  "ignore"` · vanilla: decisão comentada na factory. É o comportamento
  CORRETO por WAI-ARIA APG (alert dialog exige escolha explícita).
- [ ] **`aria-modal` documentado** — o Base UI não emite; isola o fundo com
  `aria-hidden` + `data-base-ui-inert` nos irmãos.
- [ ] **"Foco inicial em Cancelar"** (`functional.item1`, `states.open.behavior`,
  `accessibility.item3`, `notes.tip1`) — as libs focam o painel
  (`tabindex=-1`); o primeiro Tab leva ao Cancelar.
- [ ] **`defaultOpen` na tabela de props** — não existe no bits-ui
  (`DialogRootProps` = open/onOpenChange/onOpenChangeComplete/children).

Conduta a uniformizar junto: vanilla, react e svelte **codificaram** o
comportamento real em asserção; o vue deixou sem, para não cristalizar a
contradição antes da decisão.

### Outras pendências levantadas (menores)

- [ ] `docs/shared/styles/nds/alert-dialog.css` (cabeçalho) diz "sem
  Escape-to-close" — obsoleto, a factory fecha com Escape.
- [ ] Vanilla não emite `data-slot` na descrição (só header/footer/content):
  seletor que funciona em 3 stacks falha na 4ª.
- [ ] Rótulos das composições divergem entre stories e docs page nas 4
  stacks (stories: "Excluir sua conta?" / "Publicar agora"; docs page:
  "Excluir conta" / "Sair da conta"). O react alinhou os dele à docs page;
  as outras 3 mantiveram os próprios. Mexe em baseline do Chromatic.
- [ ] Tabela de tokens lista utilitários Tailwind mortos (`bg-black/80`,
  `bg-background`, `border`, `sm:rounded-lg`) — resíduo da migração `.nds-*`,
  idêntico nas 4.
- [x] ~~`accessibility.aria.*` e `accessibility.screenReader.*` do JSON são
  conteúdo morto~~ — RESOLVIDO (2026-08-02). `aria.*` já era renderizado como
  `items`; o morto era `screenReader.*` (44 de 50 componentes) e `contrast`
  (só accordion). `DocsAccessibility` ganhou `screenReaderTitle`,
  `screenReaderItems` e `contrast` opcionais nas 4 stacks; 172 call sites
  fiados por script com dry-run. As chaves de `screenReader` não têm formato
  comum entre componentes, então o container recebe `Object.values(...)`.
  Sem a chave no JSON: avatar, badge, dialog (4 stacks) e form (vanilla).

## NVDA pulava para "Notas de Implementação" — RESOLVIDO (2026-08-02)

`d38c0bd0` vanilla (+vue absorvido) · `16043e20` svelte · `afeee31d` react ·
`fe26d0bf` conteúdo compartilhado.

**Sintoma** (reportado pela dona): ao abrir qualquer docs page, o NVDA pula
para a seção de Notas e fica preso ali.

**Causa**: o `DocsNotes` renderiza `Alert`, e o primitivo marcava
`role="alert"` FIXO na raiz nas 4 stacks. `role="alert"` é live region
ASSERTIVA — o leitor de tela interrompe e anuncia no carregamento. Varredura
confirmou que era a **única** live region das docs pages. Atingia **48 páginas
× 4 stacks**.

**O erro é semântico e valia além das docs**: por WAI-ARIA, `alert` é para
mensagem urgente que SURGE em runtime. Qualquer consumidor do DS com um Alert
estático na tela tinha a mesma interrupção.

**Correção**: Alert ganhou `role?: 'alert' | 'status' | 'note'`, default
`'alert'` (aditivo — nenhum call site muda de comportamento). `DocsNotes` usa
`'note'`. Story `SemAnuncio` nas 4 trava o default e o novo caso.

### O que quase deixou a correção invisível

O conteúdo compartilhado afirmava em **8 lugares** que o `role="alert"` é
automático. Eu corrigi primeiro `accessibility.aria.role` — e **nenhuma das 4
docs pages consome `accessibility.aria.*`**; elas renderizam
`accessibility.item1`. Sem a varredura completa, a página continuaria
ensinando o padrão que causou o bug. Também estava no **SEO**
(`seo.description`, `seo.aiSummary`), que é o que buscador e IA leem.

**Regra**: ao corrigir texto compartilhado, varrer TODAS as chaves por
ocorrência literal e conferir quais o container realmente renderiza — chave
não consumida é correção que não chega ao usuário.

### Achado lateral no Vue

Antes da mudança, `role` NÃO era prop no Vue: um `role` passado pelo consumidor
caía por fallthrough e **sobrescrevia silenciosamente** o `role="alert"` do
template. Declarar como prop fechou esse comportamento acidental.

### Hazard de processo — `git stash` com agents paralelos

O agent do React empilhou um stash para provar que uma falha era pré-existente
e **outro agent removeu a entrada**; as edições sumiram da árvore e da
`git stash list` (voltaram intactas, por sorte). O stash é global. Também
houve **absorção de commit**: o commit do Vue entrou dentro do commit do
Vanilla porque os agents compartilham o índice.
- [ ] Proibir `git stash` nos prompts de agent paralelo; comparar baseline
  copiando o arquivo para o scratchpad.

## Foco na navegação das docs pages — RESOLVIDO (2026-08-02)

`67e09fe5` vanilla · `bcacf3c7` react · `b23ed990` vue · `ea685f3a` svelte.

**Sintomas** (reportados pela dona, com NVDA): (1) "Ir para o conteúdo" não
leva ao título; (2) Enter num item do menu rola até a seção mas a leitura não
continua, e o Tab seguinte vai para o próximo item do menu.

**Causa 1 — nenhuma docs page tinha `<main>`.** A sidebar era `<nav>` com
rótulo, o conteúdo era um `<div>` sem landmark: não havia "conteúdo" para
alcançar nem nome que dissesse de que página se trata. Agora
`<main tabindex="-1" aria-labelledby="docs-page-title">`, com o `<h1>` do
`DocsHeader` ganhando id estável. Ao cair no conteúdo o leitor anuncia
"principal, <título>". Zero mudança visual (só a tag e dois atributos).

**Causa 2 — o handler do menu só rolava.** `scrollIntoView` sem `focus()`: o
foco ficava no botão, então o cursor de leitura não se movia e o Tab seguia a
ordem do DOM a partir do menu. Agora `tabindex="-1"` no alvo (aplicado no
clique, sem tocar no HTML das seções) + `focus({ preventScroll: true })` — o
`preventScroll` deixa a rolagem suave acontecer com o foco já movido.

**Efeito colateral previsto e tratado**: o `<main>` novo recriava
`landmark-no-duplicate-main` na página do Sidebar em react, vue e svelte,
porque os demos renderizavam `<main>`/`SidebarInset`. Os demos passaram a usar
`<div>` pixel-idêntico; os snippets continuam ensinando `<SidebarInset>`, que
é a API correta num app real. O vanilla não tinha o problema (o
`createSidebarInset` já usava `div`).

**Provas novas** (arquivo `docs-nav-foco.stories.*` por stack, `tags:['!dev']`):
existe exatamente um `<main>` e ele tem o nome do `<h1>`; clicar num item do
menu deixa `document.activeElement` DENTRO da seção alvo. O vanilla percorre
os 16 itens; o react ainda prova que o Tab seguinte cai no conteúdo.

docs-smoke com axe: vanilla 64/64 · react 66/66 (com as provas) · vue 63/63 ·
svelte 62/62. svelte-check 351 (baseline).

### PENDENTE — as 16 páginas Foundations continuam sem `<main>`

As 4 stacks registraram isso independentemente. Elas não usam
`DocsPageLayout` nem `DocsNav` (layout próprio em `FoundationPage`/
`FoundationsRenderer`, sem menu de seções), então o bug 2 não existe lá — mas
o bug 1 continua: "Ir para o conteúdo" não tem alvo nessas páginas.
`IconsDocs` e `ThemeColorsDocs` estão na mesma situação.
- [ ] Segundo passe nas 4 stacks para dar `<main>` nomeado às Foundations.

### Backlog de analytics encontrado no caminho

- [ ] `AccordionDocs` (vue, e provavelmente outras) não passa `componentSlug`
  ao `DocsPageLayout` — os botões do nav ficam sem `data-track-id`, então a
  navegação por seção não é rastreada nessas páginas.

## Foundations com landmark + rastreio de navegação — RESOLVIDO (2026-08-02)

`01c09bda` vanilla · `4b1bf502` svelte · `d97a44ea` vue · `4ee26e55` react.

### A. `<main>` nas Foundations (16/16 por stack)

Fecha a pendência do lote anterior. Descoberta comum às 4: as Foundations não
são um caminho só — o renderer cobre 14 páginas, e **`IconsDocs` e
`ThemeColorsDocs` montam layout próprio**. Corrigir só o renderer deixaria 2
páginas sem landmark; as 4 stacks varreram e pegaram as três formas.

Diferença de árvore registrada pelo vanilla: nas Foundations o `<header>` fica
DENTRO do `<main>` (no `DocsPageLayout` é irmão). Válido, e evita reordenar o
DOM só para criar o landmark.

### B. BUG DE ANALYTICS — `docs_nav_click` reportava sempre `section_id: 'nav'`

Encontrado ao medir o escopo dos slugs, não pelo sintoma. O contrato do id é
`{component}:{section}:{element}` e o exemplo canônico é `alert:nav:anatomia`
— o destino está no 3º segmento. Mas o `docs-tracking.ts` das 4 fazia:

```ts
const section = parts[1] ?? '';           // 'nav'
case 'nav': section_id: section || element
```

Ou seja, **todo evento de navegação reportava `'nav'`**. O evento disparava,
nada falhava, e o relatório era inútil: não dava para saber para qual seção o
usuário foi. Corrigido para `element || section` nas 4.

### B2. Nav sem `data-track-id` — corrigido SEM editar 108 páginas

Medição: 24 páginas em react, 20 em vue, 21 em svelte e 44 em vanilla não
passam `componentSlug` ao `DocsPageLayout`. A correção mecânica (editar as
108) seria ERRADA: a arquitetura define o slug como opcional e derivado do
`?id=` do iframe. O `DocsNav` passou a usar a mesma derivação
(`deriveSlugFromUrl`, agora exportada) como fallback e emite `data-track-id`
sempre.

**Armadilha de medição** (errei e corrijo aqui): o agent do react reportou "só
4 páginas sem slug" — falso. `componentSlug` aparece em quase toda página, mas
no `useSeoEffect` e nos section components (`DocsVariants`,
`DocsCompositions`), **não** no layout. O vue achou o mesmo na `AccordionDocs`.
Contar ocorrência no arquivo dá número errado; é preciso olhar a invocação do
layout.

### Provas novas (por stack, em `docs-nav-foco/focus.stories.*`)

As 4 chegaram independentemente à mesma ideia: **substituir o `gtag` por um
coletor** e provar que o `docs_nav_click` sai com o destino real, não com
`'nav'`. Não é asserção de atributo — é do evento que chegaria ao GA4. Como
nenhuma stack tem teste unitário de `docs-tracking`, essa é a única trava.
Também cobrem: um `<main>` nomeado nas Foundations e nas 2 de layout próprio,
e id de 3 partes em página que NÃO passa slug.

docs-smoke: vanilla 64/64 · react 63/63 · svelte 62/62 · vue 62/63 (Icons por
timeout sob carga — passa isolada em 64,7s). svelte-check 351 (baseline).

## Stories verdes no CI e vermelhas no Storybook — RESOLVIDO no alert-dialog (2026-08-02)

`04361284` vanilla · `999f2d80` svelte · vue e react abaixo.

**Sintoma** (dona): stories do alert-dialog com erro no painel Interactions,
enquanto `vitest` dava 10/10 nas 4 stacks.

**Causa**: as `play` afirmavam `toBeVisible()` logo após abrir o diálogo. O
alert-dialog passou a ter animação de entrada (opacidade 0 → 1 em 400ms); no
Storybook a asserção roda no primeiro quadro e reprova. No CI não aparece
porque o browser dos testes emula `prefers-reduced-motion`.

**A emulação que eu adicionei para estabilizar o CI mascarou o defeito.**

Corrigido com `waitFor` nas asserções sensíveis (visibilidade, foco
pós-abertura, remoção). Afetava as **4** stacks, não 3 — vanilla também tinha,
só não tinha sido aberta. React já era imune: tem `waitForPortal()`
(`src/lib/wait-for-portal.ts`), um `waitFor` que espera a opacidade passar de
0.9 antes de qualquer asserção. É o padrão que as outras 3 deveriam adotar.

### CORREÇÃO DE DIAGNÓSTICO MEU

Eu afirmei aqui e nas skills que "em Chromium headless animações de
`opacity`/`transform` não avançam, ficam presas no quadro zero". **Errado.**
Medido no ambiente real (não na sonda sintética que me induziu ao erro): a
animação avança e completa. Prova — depois do fix com `waitFor`, o detector
sem reduced-motion passa 10/10 no vue; e o react mediu `getAnimations()`
rodando e a story concluindo.

O problema nunca foi congelamento: era **asserção racy no quadro zero**.
Consequência: `waitFor` é a correção certa, e a emulação de reduced-motion é
instrumento cego — deixa o CI verde escondendo o que o usuário vê.

- [ ] **Decisão pendente: manter ou remover a emulação de reduced-motion.**
  Medido no vue (com → sem): dialog 2 → 12 falhas · sheet 2 → 2 · popover
  4 → 4 · tooltip 10 → 10. Ou seja, ela não causa falha; **esconde ~10
  asserções racy no dialog**. Manter = CI estável e Storybook com erro.
  Remover = testes batem com o que a dona vê, ao custo de corrigir essas
  asserções (dialog primeiro). As falhas de sheet/popover/tooltip são do
  backlog pré-existente do vue, sem relação com animação.

## Emulação de motion REMOVIDA dos testes (2026-08-02, decisão da dona)

`beedec2e` svelte · `5a55a8c8` react · `ad7ba55d` vanilla · `48c3dead` +
`0168c78f` vue.

Os testes voltam a rodar com animação, como o Storybook. Verificado por mim
depois dos 4 agents (o scratchpad compartilhado corrompeu um baseline —
ver abaixo): **alert-dialog 10/10 e alert 26/26 nas 4**; `dialog` falha 2 no
vue e 1 no svelte, iguais aos baselines → backlog, não regressão.

### O que fechou o problema NÃO foi remover a emulação

Foi o `wait-for-portal.ts`: um `waitFor` que gateia na **opacidade computada**
(> 0.9) antes de qualquer asserção, na abertura de todo portal — em vez de
`findBy*` (que resolve na montagem) ou sleep fixo. React e svelte já tinham; o
vanilla criou; o vue **tinha mas sem o gate de opacidade**, e por isso
retornava no meio da animação.

Delta por stack: **vue 10** (todas em `dialog`, fechadas por UMA correção na
lib — nenhuma story editada) · **react 1** (`dialog > Profile Edit`, a falha
antiga que a emulação mascarava, agora corrigida na causa) · **svelte 0** ·
**vanilla 0**.

Melhoria do vue sobre o modelo do react: ele percorre a cadeia de ancestrais
até o `<body>` e usa a **menor** opacidade — `toBeVisible()` reprova se
qualquer ancestral estiver em 0, e gatear só no nó deixava brecha com
overlay + wrappers de portal. Vale portar para as outras 3.

### A emulação estava quebrando um teste

`skeleton > Playground` no svelte depende do pulse, que o reduced-motion
desligava. Passou a passar.

### Nuance que explica por que o CI não acusava

`toBeVisible()` do jest-dom só reprova em opacidade **exatamente** 0. As
asserções eram racy de verdade — apareciam no painel Interactions — mas quase
nunca reprovavam no vitest. Delta zero numa stack não significava ausência de
risco.

### Paridade do Playground do alert-dialog — vue

12 `expect()` / 7 `step()` → **33 / 10** (react 21/9, vanilla 20/9,
svelte 18/9). Achado no caminho: os spies `onConfirm`/`onCancel` existiam no
`setup()` e **nunca eram asseverados** — spies mortos.

- [ ] **Gap do auditor**: `coverage_divergence` compara story a story e não
  pegou 12 vs 21 no Playground. Reforçar a regra para comparar também o
  Playground entre stacks.

### BACKLOG GRANDE exposto pela medição

Falhas pré-existentes, sem relação com animação (falham com e sem emulação):
- **svelte**: 33 das 36 falhas do baseline estão em `tooltip`, `popover` e
  `drawer` — essas três famílias estão hoje praticamente sem cobertura
  funcional efetiva.
- **vue**: tooltip 10, popover 4, dialog 2, sheet 2, drawer 2.
- **vanilla**: 12, sobretudo `drawer` ("multiple elements with role dialog" —
  overlay vazando entre stories) e `target-size`.
- **react**: 8 (tooltip 7 + drawer axe).
- [ ] Priorizar: `tooltip` e `drawer` são os piores em 3 das 4 stacks.

### Processo

Os 4 agents compartilham o mesmo diretório de scratchpad: um baseline foi
sobrescrito por outro agent e houve stdout interleaved. Exigir nome de arquivo
por stack e conferir o cabeçalho `RUN … /<stack>` antes de concluir número.

## /quality button — 2026-08-04

Os quatro itens abertos aqui foram resolvidos em seguida: `xs`/`icon-xs`
implementados e documentados, rótulo do link saindo do `translations.json`,
rótulos dos snippets alinhados aos das stories e spy do Vanilla movido para o
`meta`. Ficou um achado novo, de outra natureza:

### Stories do Svelte: `Meta<typeof Button>` contra `ButtonStory`

O `meta` declara `component: Button`, então o Storybook tipa os args com
`ButtonProps`; o `render` devolve `{ Component: ButtonStory }`, cujas props são
outro tipo. Toda story desses arquivos falha no svelte-check com a mesma
mensagem (`disabled: boolean | null` contra `boolean`) — 25 erros só nos
arquivos do button, e o padrão se repete em badge e provavelmente nos demais
wrappers `*Story.svelte`.

O efeito prático é que **cada story nova soma um erro ao baseline**: as duas de
`xs` levaram o svelte-check de 351 para 353 sem terem defeito próprio. Enquanto
isso não for resolvido, o número não mede qualidade — mede quantas stories
existem.

- [ ] Decidir uma vez: `Meta<typeof ButtonStory>` nos arquivos que renderizam
  pelo wrapper, ou alargar as props do wrapper para aceitar as formas nulas dos
  atributos DOM. Aplicar em todos os `*Story.svelte`.

### Escape de entidades em superfície de texto — RESOLVIDO

`stripHtml` virou helper compartilhado (`src/lib/strip-html.ts` por stack) e as
179 docs pages passaram a importá-lo. As cópias locais sumiram.

O helper exporta **duas** funções, porque os destinos são dois e confundi-los
quebra em direções opostas:

- `toPlainText` tira tags **e** decodifica entidades — para quem escreve
  textNode (testes, tabela de props, tokens, estados, teclado, cenários,
  analytics). Sem isso a tabela mostrava "Elemento &lt;button&gt; nativo".
- `stripHtml` tira só as tags — para quem renderiza HTML sanitizado. Decodificar
  ali transforma texto em markup vivo: `&lt;img&gt;` virou um `<img>` real sem
  `alt` e o axe reprovou Avatar e Card. Foi assim que o erro apareceu.

### Markup literal em superfície de texto — 264 chaves ainda

A correção do `stripHtml` cobriu os containers que eu tinha verificado. Depois o
`DocsDoDont` apareceu na tela com `<code>default</code>` cru — e ele não estava
na minha lista, porque eu tinha classificado o bloco do/dont do `DocsWhenToUse`
(que renderiza HTML) e assumido que era o mesmo container. Não é.

Rodei então a classificação por container de verdade (contando
`dangerouslySetInnerHTML` em cada seção compartilhada):

| renderiza HTML | escreve textNode |
|---|---|
| DocsAccessibility (summary, items, contrast, screenReader), DocsWhenToUse (guidelines/do/dont), DocsVariants, DocsCompositions, DocsNotes, DocsProps (extensibilidade), DocsAnatomy | DocsTestes, DocsTokens, DocsStates, DocsRelated, DocsDoDont, DocsAnalytics, DocsImport, DocsHeader, DocsDemonstration, e as tabelas do DocsProps e do DocsWhenToUse |

`doDont.*` e `related.*` foram corrigidos. Sobram **264 chaves** com tag ou
entidade caindo em superfície de texto nas docs pages de componente:

```
188  accessibility.aria      19  props.items         14  analytics.description
  8  tokens.items             5  props.menuButton     3  props.sidebar
 26  cauda longa (aria.*, keyboard.*, screenReader.*, brand/axes, …)
```

`accessibility.aria` é o grosso e **não passa pelo `DocsAccessibility`** — o
container não tem prop `aria`. Cada docs page monta essa tabela por conta, então
o destino precisa ser conferido caso a caso antes de converter.

- [ ] Verificar container por container antes de aplicar `toPlainText`.
  Converter por prefixo sem conferir foi o que transformou `&lt;img&gt;` num
  `<img>` sem alt no Avatar e no Card.
- [ ] Regra no `audit.mjs`: string com `<tag>` ou `&lt;` chegando a prop de
  container que escreve textNode. É o único jeito de isso parar de reaparecer —
  nem teste nem axe pegam, só olhar a página.
