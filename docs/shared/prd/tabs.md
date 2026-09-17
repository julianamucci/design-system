# PRD — Tabs

> **Estado descrito**: 2026-09-17, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código vai usar este documento como base:
> o que está aqui foi medido nas cinco stacks, na folha compartilhada, no conteúdo
> e na fonte das quatro libs headless, e as divergências entre stacks estão
> registradas em vez de resolvidas.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
>
> **Onde a medição é leitura de fonte e não execução**: o comportamento das libs
> (`@base-ui/react` 1.7.0, `reka-ui` 2.10.4, `bits-ui` 2.19.0,
> `@radix-ng/primitives` 1.1.2) foi lido no `node_modules` de cada stack, não
> rodado em navegador. Nenhuma suíte foi executada nesta escrita. Onde uma linha
> depende disso, ela diz "lido na fonte".

## 1. Identidade

Conjunto de **painéis irmãos na mesma tela**, dos quais um está visível por vez,
escolhido por uma fileira de abas. A aba não leva a lugar nenhum: ela troca qual
painel da própria página está à mostra, e o endereço não muda.

É um widget composto do padrão WAI-ARIA `tablist`: a fileira inteira é **uma**
parada de Tab, as setas andam entre as abas, e cada aba aponta para o seu painel
(`aria-controls`) enquanto o painel aponta de volta (`aria-labelledby`).

| vizinho | diferença que decide |
|---|---|
| NavigationMenu | troca de PÁGINA: o item é `<a href>` de verdade dentro de `<nav>`, abre em nova aba e mostra o destino na barra de status (docblock de `navigation-menu.ts` do vanilla, linhas 8 a 13). A aba troca de PAINEL e não tem endereço — se a pessoa precisa copiar o link da seção, a peça é navegação, não Tabs |
| ToggleGroup | também é fileira com seta e tabindex itinerante (`role="toolbar"` no vanilla), mas cada botão ALTERNA um estado e não controla painel nenhum; não há `aria-controls` nem `tabpanel` |
| Accordion | também esconde conteúdo, mas cada seção abre e fecha sozinha (`aria-expanded` por gatilho) e várias podem estar abertas; aqui exatamente um painel está visível, e escolher um fecha o outro |
| Stepper | tem ORDEM e progresso: a etapa atual leva `aria-current="step"` dentro de `<ol>` (vanilla, `stepper.ts` linha 374). Abas não têm ordem obrigatória — o conteúdo manda usar Stepper para etapas sequenciais (`usage.guidelines.item4`, `usage.dont.item1`) |

**A diferença entre aba e link é a que mais custa quando se erra, e ela não é
visual.** As duas desenham uma fileira de rótulos com o ativo destacado. O que as
separa é o que a tecla e o leitor de tela prometem: `role="tab"` anuncia "aba, 2
de 3" e faz a seta andar; um link anuncia destino e a seta rola a página. Usar
Tabs para trocar de rota entrega o anúncio errado e perde o endereço; usar links
para trocar painel na mesma tela obriga a pessoa a tabular aba por aba.

**Não há consumidor interno.** Medido em 2026-09-17: nenhuma docs page das cinco
stacks usa abas fora da própria `TabsDocs.*`, nenhuma folha além de `tabs.css`
declara `.nds-tabs*`, e as únicas menções a `tablist` fora dos arquivos de tabs
são dois testes e uma story do Carousel dizendo que o controle dele NÃO é um
`tablist`. O componente só existe para quem consome o design system.

## 2. Contrato de comportamento

Cada linha aponta a chave de `docs/shared/content/tabs/translations.json` que a
publica e a story que a mede. O dicionário tem **247 chaves em cada um dos três
idiomas** (pt-BR, en, es — contagem idêntica, conferida em 2026-09-17).

| # | o contrato | chave · onde é medido |
|---|---|---|
| C1 | A lista é `role="tablist"`, cada aba é `role="tab"` e só o painel da aba ativa está na árvore de acessibilidade | `testes.accessibility.item4`, `accessibility.items.item1` a `item3` · Playground das cinco — vanilla, react e vue CONTAM os painéis (`getAllByRole('tabpanel')` com 1); svelte e angular consultam `getByRole('tabpanel')`, que reprova com mais de um, sem afirmar a contagem |
| C2 | A lista tem nome acessível, e ele é obrigatório | `accessibility.items.item4`, `doDont.pair2` · Playground das cinco — busca por nome (`getByRole('tablist', { name })`) em react, svelte e angular; atributo em vanilla e vue |
| C3 | Exatamente uma aba tem `aria-selected="true"`, e é a ativa | `testes.accessibility.item5` · Playground das cinco; `Default`/`DefaultAndActive` de estados em vanilla, react, vue, svelte |
| C4 | A aba e o painel apontam um para o outro: `aria-controls` na aba, `aria-labelledby` no painel | `accessibility.items.item3` · Playground de vanilla, react, vue, svelte e angular — só para a aba ATIVA; nenhuma story afirma o `aria-controls` de uma aba inativa (ver V9) |
| C5 | Clicar numa aba ativa a aba e troca o painel | `testes.functional.item1` · Playground das cinco |
| C6 | Com ativação automática, a seta move o foco E ativa a aba seguinte | `testes.functional.item2` · Playground de vanilla, react, vue e svelte; `Keyboard` de estados no angular |
| C7 | Home vai à primeira aba e End à última | `testes.functional.item3` · Playground de vanilla, react, vue e svelte; `Keyboard` no angular |
| C8 | Tabindex itinerante: só uma aba está no percurso do Tab, e o Tab seguinte cai no painel ativo, que tem `tabindex="0"` | `testes.functional.item4`, `accessibility.items.item5` · `FocusVisible` (vanilla, react, svelte), `Focus` (vue, angular) |
| C9 | A aba focada por teclado desenha anel visível, inclusive quando é a ativa | `testes.accessibility.item3`, `accessibility.items.item6` · as mesmas stories, por `boxShadow` diferente de `none` |
| C10 | A seta acompanha a orientação: esquerda/direita no horizontal, cima/baixo no vertical | `accessibility.keyboard.arrow*` · seta vertical APERTADA em story fixa só em vanilla (`Vertical` de variantes e de composições), vue (`VerticalSettings`) e svelte (`VerticalNavigation`); no react só se o control do Playground for trocado; no angular nunca |
| C11 | `aria-orientation="vertical"` na lista quando o conjunto é vertical | `accessibility.aria.tablist` · `Vertical` de variantes das cinco |
| C12 | A aba desabilitada tem `aria-disabled="true"` e NÃO tem `disabled` nativo | `testes.accessibility.item6`, `accessibility.items.item7` · `Disabled` (vanilla, react, vue, svelte), `DisabledTab` (angular), por `not.toBeDisabled()` |
| C13 | A seta ALCANÇA a aba desabilitada, não a ativa, e segue adiante a partir dela | `testes.functional.item5`, `states.disabled.behavior` · as mesmas stories, nas cinco |
| C14 | Nem clique, nem Enter, nem Espaço ativam a aba desabilitada | `testes.functional.item5` · as mesmas stories, com `pointerEventsCheck: 0` no clique |
| C15 | A aba desabilitada fica esmaecida e fora do alcance do ponteiro | `testes.visual.item4` · as mesmas stories, por `opacity < 1` e `pointerEvents === 'none'` |
| C16 | Na variante `default` o trilho pinta fundo e a aba ativa se distingue por FUNDO, não só por cor de texto | `testes.visual.item1`, `testes.accessibility.item2`, `usage.guidelines.item3` · `Default` de variantes das cinco |
| C17 | Na variante `line` o trilho não pinta fundo e o ativo é marcado por traço em `::after` com opacidade 1, contra 0 nas inativas | `testes.visual.item2` · `Line` de variantes das cinco |
| C18 | No vertical as abas empilham na mesma coluna e o painel fica ao LADO da lista | `testes.visual.item3` · `Vertical` de variantes das cinco, pela borda esquerda das abas e pela caixa do painel contra a da lista |
| C19 | A caixa do trilho é resultado do respiro: empurrar o conteúdo faz o trilho crescer | — (sem chave publicada) · `Default` de variantes das cinco, por `trackMeasureCrescimento` + `boxDoTrackDesvios` de `docs/shared/testing/tabs-probe.ts` |
| C20 | Ícone no gatilho é decorativo e não entra no nome da aba; badge no gatilho entra no nome e não vira segundo alvo de foco | `variants.compositions.iconTrigger`, `badgeTrigger` · `WithIcons`/`WithIconsInTrigger` e `WithBadge`/`WithBadgeInTrigger` em vanilla, react, vue e angular; o svelte não tem as duas composições |
| C21 | Com ativação manual, a seta só move o foco e Enter confirma | `props.table.activationMode`, `notes.item2` · `ManualActivation` (react, svelte, angular), `ManualMode` (vue). **Não vale no vanilla**, que não tem o modo (V3) |

**Nenhuma story afirma a AUSÊNCIA de `aria-orientation` no horizontal, exceto a
`Default` de variantes do vanilla.** É por isso que duas stacks emitem
`aria-orientation="horizontal"` sem nada ficar vermelho (V1).

## 3. Decisões fixadas

### D1 · Aba desabilitada é `aria-disabled`, nunca `disabled` nativo, e continua no percurso da seta

**Estado**: nas cinco a aba desabilitada sai com `aria-disabled="true"` e sem o
atributo `disabled`; a seta pousa nela, ela não é ativada, e a seta seguinte sai
dela.
**Motivo**: o padrão WAI-ARIA de abas pede que a desabilitada seja alcançável
para ser anunciada como indisponível; `<button disabled>` sai do alcance do foco
e a pessoa nunca descobre que a aba existe.
**Custo por stack, porque as quatro libs chegam lá por caminhos diferentes**
(lido na fonte):

| stack | o que a lib faria sozinha | o que a stack faz |
|---|---|---|
| vanilla | — | escreve `aria-disabled` e guarda dentro do ouvinte de clique e da ativação por seta (`tabs.ts` 117–128, 176–189, 218–220) |
| react | o Base UI já trata assim: `focusableWhenDisabled: true`, `disabledIndices` vazio na lista, guarda em `onClick` e `onFocus` | nada; repassa `disabled` |
| vue | a reka liga a prop ao `disabled` nativo e o foco itinerante filtra `data-disabled` | NÃO repassa a prop (`TabsTrigger.vue`, `reactiveOmit(props, 'class', 'disabled')`), escreve `aria-disabled` à mão e barra `mousedown`, `click`, Enter/Espaço e `focus` por guarda em fase de captura na lista (`TabsList.vue`) |
| svelte | o bits emite `disabled` nativo e o grupo itinerante pula `[data-disabled]` | repassa `disabled={false}` ao primitivo, escreve `aria-disabled` e usa a mesma guarda de captura na lista (`tabs-trigger.svelte`, `tabs-list.svelte`) |
| angular | o Radix NG já trata assim: `[attr.disabled]` nulo, `aria-disabled` + `data-disabled`, `setDisabledIndices([])`, guarda em `onClick`, `onKeyDown` e `onFocus` | nada; repassa `disabled` |

**Onde está escrito**: comentários nos cinco primitivos citados, a linha
`Aba desabilitada` das cinco `05-navigation-components.md`, e o docblock de
`docs/shared/testing/tabs-probe.ts`.

### D2 · Ativação automática é o padrão do sistema — e duas libs nascem com o contrário

**Estado**: a seta ativa a aba nas cinco por padrão.
**Medição, lido na fonte**: `activateOnFocus` tem padrão `false` no
`TabsList` do Base UI e no `RdxTabsList` do Radix NG — as duas nascem em modo
manual. React (`tabs.tsx`, `activationMode = "automatic"`) e angular (`tabs.ts`,
`input<TabsActivationMode>('automatic')`) reafirmam o padrão no wrapper. Reka e
bits já nascem com `activationMode = "automatic"`.
**Onde está escrito**: comentário do `TabsList` do react e do `NdsTabsList` do
angular; `props.table.activationMode.default` e `notes.item2` do conteúdo.

### D3 · `activationMode` é o nome do contrato, e o nome da lib não vaza

**Estado**: react e angular aceitam `activationMode: 'automatic' | 'manual'` e
traduzem para o booleano da lib; `activateOnFocus` fica fora da assinatura (react:
`Omit<…, "activateOnFocus">`; angular: fora da lista `inputs` do host directive).
**Armadilha medida, escrita nos dois wrappers**: ligar a string ao booleano direto
faz `"manual"` — string não vazia — virar `true`, isto é, ativação automática
justamente quando pediram a manual, sem erro. No angular o input do primitivo tem
`booleanAttribute`; o wrapper escreve no signal da raiz por `effect`, que roda
depois do do primitivo porque host directives são instanciadas antes.
**Onde está escrito**: `tabs.tsx` 42–78 e `tabs.ts` do angular 113–165.

### D4 · O trilho não tem altura: `min-height` é piso, e o piso do gatilho não acompanha a densidade

**Estado**: `.nds-tabs-list` tem `min-height: var(--size-lg)` e `padding:
var(--spacing-1)`; `.nds-tabs-trigger` tem `min-height: 1.5rem` e altura por
`padding-block` + entrelinha.
**Medição** (comentário de `tabs.css` 23–35 e 60–65): gatilho de 24px + 2 × 4px de
respiro = 32px de conteúdo, com o piso de 36px valendo na densidade padrão; com
`height` cravado o trilho ficava em 36px e o gatilho vazava do fundo arredondado.
O piso do gatilho é `1.5rem` literal, e não `--size-*`, porque 24px é o mínimo
absoluto de WCAG 2.5.8 e a densidade condensada derrubaria o alvo para 22.38px.
**Portão**: `trackMeasureCrescimento` empurra o conteúdo e `boxDoTrackDesvios`
reprova a gaiola — `Default` de variantes das cinco. O docblock da sonda registra
por que medir a altura uma vez e dobrar a fonte não bastavam.

### D5 · Foco visível vence o realce de aba ativa

**Estado**: `tabs.css` 229–237 reafirma o anel para as duas formas de ativo e para
a variante `line`, com especificidade acima de todas as regras de ativo.
**Medição** (comentário 213–228): as regras de ativo sobrescreviam `box-shadow`
inteiro, e como sob ativação automática a aba focada é a ativa, o anel sumia
justamente onde o foco estava; na `line` não sobrava sombra nenhuma.
**O valor é repetido de propósito**, e não uma custom property: ela viraria
superfície pública de customização a documentar no conteúdo compartilhado.

### D6 · Orientação e variante são escritas pelo componente, e a orientação chega ao primitivo

**Estado**: o vanilla escreve `data-orientation` na raiz e `data-variant` na lista
dentro da fábrica (`tabs.ts` 65 e 73). No react `orientation` é repassada ao
`TabsPrimitive.Root`, que emite o atributo.
**Motivo, escrito nos dois**: no vanilla as stories fingiam as variantes mutando o
DOM com classe morta e `style.*` inline (docblock de `tabs.ts`); no react escrever
só `data-orientation` à mão deixava o layout vertical e as setas horizontais —
"parecia certo na tela e mentia para o teclado" (`tabs.tsx` 14–19).

### D7 · `aria-orientation` só no vertical — na referência

**Estado**: vanilla (`tabs.ts` 74–76), react e angular (padrão das duas libs)
escrevem o atributo só com `vertical`. Motivo escrito no vanilla e repetido nas
stories de react e angular: horizontal é o padrão implícito de `tablist`, e
repeti-lo é ruído para leitor de tela.
**Não vale nas cinco** — vue e svelte emitem `aria-orientation="horizontal"`
porque reka e bits escrevem o valor sempre (V1).

### D8 · O nome da lista é opção da fábrica, nunca retoque no DOM (vanilla)

**Estado**: `'aria-label'` é opção de `createTabs` e vai no `role="tablist"`.
**Motivo** (`tabs.ts` 32–44): antes só se nomeava a lista com
`root.querySelector('[role="tablist"]').setAttribute(…)` depois de construir — um
contorno preso à estrutura interna que quebra calado se ela mudar. Nas outras
quatro a lista é peça de quem compõe, e o atributo vai direto nela.

### D9 · A folha aceita DOIS atributos de ativo, e o angular emite os dois

**Estado**: `[data-state="active"]` (vanilla, reka, bits) e
`[data-active]:not([data-active="false"])` (Base UI, Radix NG) pintam igual, e
as duas formas se repetem em cada regra de ativo e de foco.
**O angular escreve `data-state` além do `data-active` da lib** (`tabs.ts` 52–56 e
`[attr.data-state]` no host do gatilho): "a paridade de markup é o que a auditoria
cross-stack compara". O react NÃO faz o mesmo — só `data-active` sai (V4).

### D10 · O relevo da aba ativa é o degrau `xs`

**Estado**: `box-shadow: var(--elevation-xs)` no ativo da variante `default`.
**Onde está escrito**: a tabela "Qual degrau, por tipo de superfície" de
`docs/shared/guidelines/04-padroes-design-sistema.md` põe tabs em "relevo de
controle, no plano da página". A folha confere com o mapa: lê `--elevation-xs` e
nenhum outro degrau, e só no ativo — a `line` zera a sombra.

### D11 · No angular, tudo é diretiva de atributo em elemento nativo

**Estado**: `div[ndsTabs]`, `div[ndsTabsList]`, `button[ndsTabsTrigger]`,
`div[ndsTabsContent]`, todas `@Directive` sem template.
**Motivo** (`tabs.ts` 40–48): o vanilla renderiza `<div>` e `<button>`, e um
`<nds-tabs>` teria a mesma classe e o mesmo `data-slot` com outra TAG; e um
`@Component` com `<ng-content />` criaria view para reprojetar os mesmos filhos.

## 4. Anatomia

```
tabs                         raiz, <div>, data-orientation
├── tabs-list                <div role="tablist">, data-variant, aria-label, aria-orientation (vertical)
│   └── tabs-trigger (1..n)  <button role="tab">, aria-selected, aria-controls, tabindex 0/-1
│       ├── svg              opcional, aria-hidden, antes do rótulo
│       ├── rótulo           texto — é o nome acessível da aba
│       └── badge            opcional, entra no nome, sem foco próprio
└── tabs-content (1..n)      <div role="tabpanel">, aria-labelledby, hidden quando inativo
    └── conteúdo arbitrário
```

Quatro `data-slot` são o contrato de markup: `tabs`, `tabs-list`,
`tabs-trigger`, `tabs-content`, com as classes `.nds-tabs`, `.nds-tabs-list`,
`.nds-tabs-trigger` e `.nds-tabs-content`. Ícone e badge são conteúdo de quem
compõe; só o angular tem peça publicada para o ícone (`svg[ndsTabsIcon]`).

**Os painéis são filhos diretos da raiz**, depois da lista, nas cinco. Não existe
invólucro `TabPanels` — a árvore da guideline do vanilla que o desenha está
errada (§11).

**`data-icon` não tem produtor.** A folha encurta o padding do lado do ícone por
`:has([data-icon="inline-start"])` e `inline-end`, e nenhuma story, docs page ou
snippet das cinco escreve o atributo num gatilho de aba (V22).

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/tabs.css`, 244 linhas, linha a linha. Nenhuma folha
de stack declara regra sobre `.nds-tabs*` (busca por `.css` nos cinco `src/`
devolve zero).

| propriedade | valor | token |
|---|---|---|
| raiz · largura | 100% | **literal** |
| raiz com orientação · gap lista/painel | 8px | `--spacing-2` |
| trilho · piso de altura | 36px na densidade padrão | `--size-lg` (D4) |
| trilho · respiro interno | 4px | `--spacing-1` |
| trilho · fundo | — | `--muted` |
| trilho · raio | — | `--radius` |
| trilho · texto das inativas | — | `--muted-foreground` |
| gatilho · gap entre ícone e rótulo | 4px | `--spacing-1` |
| gatilho · padding inline | 12px | `--spacing-3` |
| gatilho · padding block | 4px | `--spacing-1` |
| gatilho · piso de altura | 24px | **literal** `1.5rem` — absoluto, fora da densidade (D4) |
| gatilho · raio | 10px no tema Default | `--radius-sm` |
| gatilho · corpo | 14px | `--text-control` |
| gatilho · peso | 500 | `--font-weight-medium`, com `500` de fallback |
| gatilho · transição | fundo, cor, sombra | `--duration-fast` |
| ativo · fundo | — | `--background` |
| ativo · texto | — | `--foreground` |
| ativo · relevo | degrau de controle | `--elevation-xs` (D10) |
| anel de foco (gatilho e painel) | 2px de halo + anel até 4px a 50% | `--background` no halo, `--ring` no anel |
| painel focado · raio do anel | — | `--radius` |
| desabilitada · opacidade | 0.5 | **literal** |
| painel · margem superior | 8px | `--spacing-2` — sombreada nas cinco (§6) |
| ícone sem classe de tamanho | 16px | `--spacing-4` em largura e altura |
| padding do lado do ícone | 4px | `--spacing-1`, por `:has([data-icon=…])` — sem produtor |
| line · gap entre abas | 4px | `--spacing-1` |
| line · raio do trilho | reto | `--radius-none` |
| line · indicador | cor | `--foreground` |
| line · espessura do indicador | 2px | **literal** |
| line horizontal · posição do indicador | 5px abaixo do gatilho | **literal** `-5px` |
| line vertical · posição do indicador | 4px à direita | `--spacing-1` negativado |
| line · transição do indicador | opacidade | `--duration-fast` |

**Os literais**: a largura da raiz, o piso de 24px (declarado e justificado), a
opacidade de 0.5, e os dois do indicador da `line` — espessura e `-5px`. Os dois
últimos não têm comentário: o `-5px` é o respiro de 4px da lista mais 1px, e
nenhum lugar diz isso.

**O comentário do raio do gatilho erra os números.** `tabs.css` 70 diz
`radius (10) − spacing-1 (4)`; em `docs/shared/tokens/tokens.css` o `--radius` do
tema padrão é 14px e o `--radius-sm` é `calc(var(--radius) - 4px)`, 10px. A
fórmula está certa e o rótulo trocou o operando pelo resultado.

**Instrumento**: `node scripts/tabela-tokens.mjs tabs`, em 2026-09-17, fecha com 0
linhas divergentes contra a folha e 7 linhas por tabela nas cinco docs pages.
Aponta dois tokens lidos e não listados (`--radius-sm`, `--radius-none`) e **três
divergências entre stacks**: para `--background`, `--foreground` e `--ring`, o
angular nomeia a classe `.nds-tabs-trigger` e as outras quatro nomeiam
`.nds-tabs-trigger[data-state="active"]` e `:focus-visible`. E a linha das quatro
cita um seletor que o markup do react não produz: o react não emite `data-state`
(D9, V4).

**O docblock da folha desatualizou.** A lista de tokens do cabeçalho
(`tabs.css` 14–15) não cita o relevo, o raio do gatilho, o raio reto da `line`,
a duração nem o piso de altura, e o esboço de estrutura (linhas 6–12) não tem
`data-orientation`, `data-variant`, `data-slot` da lista e dos painéis, nem
`aria-controls`.

## 6. Estados

| estado | quando ocorre | o que muda | tem produtor? |
|---|---|---|---|
| Inativa | sempre, nas abas não escolhidas | texto herdado do trilho, sem fundo | sim, as cinco |
| Ativa · `default` | `[data-state="active"]` ou `[data-active]` | fundo `--background`, texto `--foreground`, relevo `xs` | sim, as cinco — react só por `data-active` |
| Ativa · `line` | idem, dentro de `[data-variant="line"]` | sem fundo nem sombra; `::after` com opacidade 1 | sim, `Line` das cinco |
| Hover | — | **nada: a folha não tem regra `:hover`** | não existe — e `states.hover.behavior` afirma "texto `foreground`" nos três idiomas |
| Foco visível · gatilho | `:focus-visible` | anel de 2px + 4px | sim, `FocusVisible`/`Focus` das cinco |
| Foco visível · painel | `.nds-tabs-content:focus-visible` | o mesmo anel, com raio `--radius` | alcançado — as mesmas stories tabulam até o painel —, mas nenhuma afirma o anel dele |
| Desabilitada · `aria-disabled` | `[aria-disabled="true"]` | opacidade 0.5, `pointer-events: none` | sim, `Disabled`/`DisabledTab` das cinco |
| Desabilitada · nativa | `:disabled` | a mesma pintura | **sem produtor**: as cinco evitam o atributo (D1). O único caminho é o `disabled` da RAIZ no svelte, documentado no Playground e não renderizado (V28) |
| Vertical | `.nds-tabs[data-orientation="vertical"]` | lista em coluna, gatilho a 100% e alinhado ao início | sim, `Vertical` das cinco |
| Vertical · `line` | as duas regras juntas | indicador de 2px à direita | **sem story fixa** em nenhuma; só alcançável pelos controls do Playground do angular, o único com `variant` e `orientation` |
| Com ícone e `data-icon` | `:has([data-icon=…])` | padding do lado do ícone encurta | **sem produtor** nas cinco |
| Movimento reduzido | `prefers-reduced-motion: reduce` | `transition: none` no gatilho e no `::after` | sim — bloco `@media` da folha (239–244), além de `--duration-fast` zerar em `docs/shared/tokens/motion.css` |
| Painel sem orientação | `.nds-tabs-content` fora de `.nds-tabs[data-orientation]` | `margin-top: --spacing-2` | **sem produtor**: as cinco escrevem `data-orientation` na raiz, e a regra 124–127 zera a margem sempre. O comentário diz "remove o margin-top do fluxo vanilla", mas o vanilla também escreve o atributo desde D6 |

**O que a tabela de estados do conteúdo publica e a folha não tem**: `Hover`.
**O que a folha tem e ninguém produz**: `:disabled`, vertical com `line`, o
`data-icon` e a margem de painel da regra base.

## 7. API

O conjunto de props que o conteúdo compartilhado publica (`props.table`) é:

| prop | tipo | padrão | onde mora | stacks que têm |
|---|---|---|---|---|
| `value` | string | — | raiz | react, vue (`modelValue`), svelte (`bind:value`), angular (`model`); **não no vanilla**, que é só não-controlado |
| `defaultValue` | string | — | raiz | react, vue, vanilla, angular; **não no svelte** — o bits não tem valor inicial separado |
| callback de mudança | `(value) => void` | — | raiz | as cinco, com nomes de framework |
| `orientation` | `horizontal \| vertical` | `horizontal` | raiz | as cinco |
| `activationMode` | `automatic \| manual` | `automatic` | **lista** em react e angular, **raiz** em vue e svelte | quatro; **não existe no vanilla** (V2, V3) |
| `variant` | `default \| line` | `default` | lista (vanilla: opção da fábrica) | as cinco |
| classe extra | string | — | cada peça | as cinco |

E o que o conteúdo NÃO publica e existe: `disabled` e `value` no gatilho (as
quatro com peças), `value` no painel, `items` e `aria-label` na fábrica do
vanilla, `loopFocus` na lista do angular (documentado por override), `loop` e
`disabled` na raiz do svelte (documentados só no `argTypes` do Playground).

### Divergências de framework, registradas

| stack | como difere |
|---|---|
| react | Quatro componentes sobre `@base-ui/react/tabs`. `TabsList` troca `activateOnFocus` por `activationMode` (D3) e escreve `data-variant`. O ativo sai como `data-active`, sem `data-state`. `tabsListVariants` (cva) tem as duas variantes com string vazia: a classe é sempre `nds-tabs-list` e quem diferencia é o atributo |
| vue | Quatro SFCs sobre `reka-ui`. `Tabs.vue` redeclara as props da raiz, incluindo `activationMode`, `unmountOnHide`, `dir` e `as`, e escreve `data-orientation` também à mão (a reka já escreve). O modelo é `modelValue` + `update:modelValue`. `TabsTrigger.vue` omite `disabled` do repasse (D1) e `TabsList.vue` instala a guarda de captura. `tabsListVariants` mora em `index.ts` |
| svelte | Quatro peças sobre `bits-ui`, com formas curtas (`Root`, `List`, `Trigger`, `Content`) e longas no índice. A raiz tem `value = $bindable("")` e **nenhum `defaultValue`**: a aba inicial é o próprio `value` — escrito na docs page, que omite a linha por isso. `TabsStory.svelte` é andaime de story, não peça publicada |
| vanilla | Fábrica única `createTabs(options)`, sem estado controlado: `items` carrega `value`, `label`, `content` e `disabled`, e a fábrica monta lista e painéis. `aria-label` é opção (D8). O rótulo entra por `textContent`; ícone e badge são inseridos pelas stories DEPOIS de montar, trocando o conteúdo do gatilho |
| angular | Quatro diretivas de atributo com `hostDirectives` do Radix NG (D11), mais `svg[ndsTabsIcon]` com três ícones fixos (`user`, `settings`, `shield`). O modelo é `[(value)]`/`(valueChange)`, e o id da aba pode ser escolhido por input. `data-state` é escrito à mão ao lado do `data-active` da lib (D9) |

### Peças, por stack

| stack | peças |
|---|---|
| react | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `tabsListVariants`, tipos `TabsActivationMode`, `TabsListProps` |
| vue | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `tabsListVariants`, tipo `TabsListVariants` |
| svelte | `Root`/`Tabs`, `List`/`TabsList`, `Trigger`/`TabsTrigger`, `Content`/`TabsContent`, `tabsListVariants`, tipo `TabsListVariant` |
| vanilla | `createTabs`, tipos `TabsOptions`, `TabsItemDef`, `TabsVariant`, `TabsOrientation` |
| angular | `div[ndsTabs]` (`NdsTabs`), `div[ndsTabsList]` (`NdsTabsList`), `button[ndsTabsTrigger]` (`NdsTabsTrigger`), `div[ndsTabsContent]` (`NdsTabsContent`), `svg[ndsTabsIcon]` (`NdsTabsIcon`), `NDS_TABS`, tipos `TabsOrientation`, `TabsListVariant`, `TabsActivationMode`, `TabsIconKind` |

### Modelo de teclado, por stack

Lido na fonte dos cinco primitivos e das quatro libs.

| | vanilla | react | vue | svelte | angular |
|---|---|---|---|---|---|
| eixo da seta | segue a orientação | segue a orientação | segue a orientação | segue a orientação | segue a orientação |
| laço no fim | sim, sem opção | sim (`loopFocus`, padrão da lib) | sim (`loop`, padrão da lib) | sim (`loop = true` no componente da lib) | sim (`loopFocus`, exposto) |
| Home / End | sim | sim | sim | sim | sim |
| PageUp / PageDown | não | não | **sim, primeira/última** | não | não |
| ativação padrão | automática, fixa | automática (wrapper inverte a lib) | automática (lib) | automática (lib) | automática (wrapper inverte a lib) |
| modo manual | **não existe** | `activationMode` na lista | `activationMode` na raiz | `activationMode` na raiz | `activationMode` na lista |
| Enter / Espaço | clique nativo do `<button>` | clique nativo | ouvinte da lib | ouvinte da lib | ouvinte da lib |
| desabilitada no percurso | sim | sim (lib) | sim (wrapper contorna a lib) | sim (wrapper contorna a lib) | sim (lib) |
| quem barra a ativação da desabilitada | guarda no ouvinte da fábrica | lib | guarda de captura na lista | guarda de captura na lista | lib |
| `tabindex="0"` fica com | a aba ATIVA | a aba FOCADA | a aba FOCADA | a aba ATIVA | a aba FOCADA |
| `aria-orientation` | só vertical | só vertical | sempre | sempre | só vertical |
| `aria-controls` | todas as abas | **só a ativa** | todas | todas | todas |
| direção RTL | não lê | lê | lê | lê | lê |

### Inconsistências entre stacks, medidas em 2026-09-17

Nenhum dos itens abaixo é visto por portão, salvo onde a coluna diz. Os achados
do auditor estão na §11.

| # | o que difere | quem faz o quê | lados |
|---|---|---|---|
| V1 | `aria-orientation` no horizontal | vue e svelte escrevem `horizontal` (lib); vanilla, react e angular não escrevem | 3 × 2 — só o vanilla afirma a ausência |
| V2 | onde mora `activationMode` | lista em react e angular; raiz em vue e svelte; inexistente no vanilla | 2 × 2 × 1 |
| V3 | ativação manual existe | react, vue, svelte e angular têm; o vanilla não — e a docs page dele lista a prop com "apenas automatic implementado" | 4 × 1, com a referência do lado de fora |
| V4 | atributo de aba ativa | `data-state` em vanilla, vue, svelte e angular; `data-active` em react e angular; o react não emite `data-state` | 4 × 1 — e as tabelas de tokens das cinco citam `[data-state="active"]` |
| V5 | `data-disabled` na aba desabilitada | react e angular emitem (lib); vanilla, vue e svelte não | 3 × 2 |
| V6 | quem barra a ativação da desabilitada | ouvinte da fábrica no vanilla; lib em react e angular; guarda de captura na lista em vue e svelte | 2 × 2 × 1 (D1) |
| V7 | painel inativo | elemento no DOM com `hidden` e conteúdo montado em vanilla, svelte e angular; elemento no DOM com conteúdo desmontado no vue (`unmountOnHide`, padrão da reka); elemento DESMONTADO no react | 3 × 1 × 1 — lido na fonte |
| V8 | `tabindex` do painel inativo | `0` em vanilla, vue e svelte; `-1` no angular; no react o painel inativo não existe | 3 × 1 × 1 |
| V9 | `aria-controls` da aba inativa | aponta para o painel em vanilla, vue, svelte e angular; ausente no react, porque o Base UI só registra o id de painel montado | 4 × 1 — lido na fonte, nenhuma story afirma |
| V10 | para onde vai o `tabindex="0"` quando foco e seleção se separam (modo manual, ou seta na desabilitada) | fica na aba ativa em vanilla e svelte; segue a aba focada em react, vue e angular | 3 × 2 |
| V11 | PageUp / PageDown | só o vue responde (reka) | 4 × 1 |
| V12 | `label` do `tab_change` na demonstração | rótulo TRADUZIDO em react, vue e vanilla; o `value` estável em svelte e angular | 3 × 2 — a maioria contradiz a regra de payload estável do `CLAUDE.md` |
| V13 | `location` do `tab_change` | `docs_demo` em react, vue, svelte e vanilla; `docs-demonstration` no angular | 4 × 1 — visto por `location_fora_do_vocabulario` |
| V14 | forma do tipo `tab_change` | react, vue e svelte tipam `value` e tudo opcional; vanilla e angular não tipam `value` e exigem `component: 'tabs'`; só o svelte envia `value` | 3 × 2 |
| V15 | stories de composição | vanilla: `WithIconsInTrigger`, `WithBadgeInTrigger`, `Vertical`, `SubNavigationLine`; react: `WithIcons`, `WithBadge`, `Controlled`, `ManualActivation`; vue: `Controlled`, `WithIcons`, `WithBadge`, `VerticalSettings`, `ManualMode`; svelte: `SettingsPanel`, `CodePreviewLine`, `VerticalNavigation`, `ManualActivation`; angular: `WithIcons`, `WithBadge` | nenhuma maioria; o svelte é o único sem ícone e sem badge |
| V16 | stories de estado | vanilla `Default`, `Active`, `FocusVisible`, `Disabled`; vue `Default`, `Active`, `Focus`, `Disabled`; svelte `Default`, `Active`, `Disabled`, `FocusVisible`; react `DefaultAndActive`, `FocusVisible`, `Disabled`; angular `Keyboard`, `ManualActivation`, `DisabledTab`, `Focus` | vanilla/vue/svelte coincidem no conjunto; react junta dois; angular é outro recorte |
| V17 | grupo da story de ativação manual | `compositions` em react, vue e svelte; `states` no angular; ausente no vanilla | 3 × 1 × 1 — visto por `story_group_divergent` |
| V18 | controles do Playground | vanilla `defaultValue`, `aria-label`; react `orientation`, `defaultValue`; vue `defaultValue`, `orientation`, `activationMode`; svelte `orientation`, `activationMode`; angular `orientation`, `variant`, `activationMode` | nenhuma maioria; só o angular expõe `variant` |
| V19 | onde as setas e Home/End são afirmados | no Playground em vanilla, react, vue e svelte; numa story `Keyboard` à parte no angular, cujo Playground não cobre `functional.item2` e `item3` | 4 × 1 |
| V20 | seta vertical apertada em story fixa | vanilla, vue e svelte sim; react só pelo control; angular nunca | 3 × 2 (C10) |
| V21 | ausência de `aria-orientation` no horizontal afirmada | só vanilla | 1 × 4 |
| V22 | como o ícone entra no gatilho | vanilla dentro de `span.nds-cluster`; react e vue como filho direto (o vue com `nds-size-4`, que escapa da regra `svg:not([class*="size-"])`); angular por `svg[ndsTabsIcon]`; svelte não compõe. Nenhuma escreve `data-icon` | nenhuma maioria |
| V23 | variante do badge no gatilho | `default` e `destructive` em vanilla e vue; `info` em react (um) e angular (dois, `12` e `Beta`); svelte não compõe | 2 × 2 × 1 |
| V24 | teste do construtor de snippet | vue, svelte e vanilla têm `tabs.source.test.ts`; react e angular não | 3 × 2 — visto por `source_sem_teste` |
| V25 | `transform` no painel Code | as cinco no Playground; o angular só nele, e os três arquivos de variantes, estados e composições publicam o template da story | 4 × 1 — visto por `story_file_sem_transform` |
| V26 | `layout` dos arquivos de story | `padded` em react e angular; `centered` no vue; padrão do Storybook em svelte e vanilla | nenhuma maioria |
| V27 | valor de design em `style` inline | `padding-top: 0.75rem` nos quatro arquivos de story do vue; `max-width: 36rem` nas docs pages de react, vue e svelte | vanilla e angular limpos — visto por `inline_style_design_value` |
| V28 | desabilitar o conjunto inteiro | só o svelte expõe `disabled` na raiz (documentado no Playground como "Desabilita todas as abas de uma vez"); lido na fonte, ele faz o bits emitir `disabled` NATIVO e `data-disabled` em todas as abas, por fora da decisão D1 | 1 × 4 — sem story que renderize |
| V29 | conjunto da demonstração | react, vue, svelte e vanilla usam três abas; o angular usa também `code`, `preview`, `settings`, `profile`, `account`, `security` | 4 × 1 — visto por `demonstration_labels_divergent` |
| V30 | classe citada na tabela de tokens | `[data-state="active"]` e `:focus-visible` em react, vue, svelte e vanilla; `.nds-tabs-trigger` sem estado no angular | 4 × 1 — visto por `tabela-tokens.mjs`, não pelo auditor |

## 8. Acessibilidade

**Atributos que as cinco escrevem**: `role="tablist"` na lista com o nome dado por
quem compõe; `role="tab"`, `aria-selected` e `id` em cada aba; `role="tabpanel"`,
`aria-labelledby` e `hidden` no painel inativo; `aria-disabled="true"` na aba
desabilitada. `aria-controls` e `aria-orientation` não são uniformes (V1, V9).

**Teclado**: Tab entra na fileira pela aba que tem `tabindex="0"` e o Tab seguinte
cai no painel ativo; setas andam no eixo da orientação, com laço; Home e End vão
aos extremos; Enter e Espaço ativam a aba focada (relevante no modo manual). A
tabela completa, stack a stack, está na §7.

**Leitor de tela**: o conteúdo promete "lista de tabs, [nome]" ao entrar, o rótulo
com "selecionado"/"não selecionado", e a posição ("1 de 3") ao navegar
(`accessibility.screenReader`). A posição sai do papel `tab` dentro de `tablist`,
não de atributo escrito — nenhuma stack escreve `aria-posinset` ou `aria-setsize`,
e nenhuma story mede o anúncio.

**O que deliberadamente NÃO se faz**:

- não se usa `disabled` nativo na aba (D1) — a aba sairia do percurso e nunca
  seria anunciada;
- não se confia em `pointer-events: none` para barrar a aba desabilitada: o
  comentário de `tabs.ts` do vanilla diz que a folha é "o reforço visual, não a
  trava", e as cinco stories clicam com `pointerEventsCheck: 0` para exercitar a
  guarda de verdade;
- não se escreve `tabindex` no painel à mão: quem escreve é a fábrica ou a lib, e
  as guidelines de react e vue proíbem o manual;
- não se anuncia o ícone do gatilho: `aria-hidden="true"` nas cinco composições
  com ícone, e a story afirma o nome exato da aba;
- não se põe foco no badge do gatilho: as stories afirmam `tabindex` e `role`
  nulos nele.

**Contraste**: `testes.accessibility.item2` pede 4.5:1 entre texto e fundo. Nenhuma
story das cinco mede razão de contraste da aba — a `Default` de variantes afirma
que a ativa tem fundo DIFERENTE da inativa, o que prova distinção, não contraste.
O texto das inativas é `--muted-foreground` sobre `--muted`, que é o par de menor
contraste do componente, e ninguém o mede aqui.

**A sonda da aba desabilitada não é consumida.** `docs/shared/testing/tabs-probe.ts`
abre dizendo "as cinco stacks medem a aba DESABILITADA com este arquivo", e
exporta `measureAbaDesabilitada` e `desviosDaAbaDesabilitada`. Medido em
2026-09-17: nenhum arquivo das cinco stacks importa as duas — as stories só usam
`trackMeasureCrescimento` e `boxDoTrackDesvios`. A medição da desabilitada existe
cinco vezes, escrita à mão em cada story `Disabled`.

## 9. Analytics

| evento | quem dispara hoje | payload |
|---|---|---|
| `tab_change` | as cinco docs pages, na demonstração | `{ component: "tabs", label, index, total, location }` — com as diferenças de V12 a V14 |
| `docs_page_view` | as cinco docs pages | `{ component_name: "tabs", locale, page_title }` |
| `docs_section_viewed` | as cinco docs pages | `{ section_id, component_name: "tabs", locale }` |

**O componente não dispara nada.** Nenhum dos cinco primitivos importa `track`; o
evento é da docs page, que é o produto consumidor.

**`tab_change` está tipado nas cinco `analytics.ts`, com duas formas** (V14), e
disparado nas cinco demonstrações — mas o `label` sai TRADUZIDO em três (react,
vanilla e vue leem o rótulo do dicionário no call site). O `CLAUDE.md` é explícito:
payload carrega valor estável, nunca texto traduzido, que partiria um evento em
três no GA4. O angular escreve o motivo no próprio método e envia o `value`; o
svelte também envia o `value`, nos dois campos.

**Quatro fontes descrevem o payload, e nenhuma é o código**, medido em 2026-09-17:

- `analytics.table.tab_change.payload` do conteúdo: `{ component, label, index,
  total, location }` — a forma, mas sem dizer o que vai em `label`;
- `docs/shared/guidelines/07-analytics.md` §Tabs: `label`, `index`, `total`;
- guidelines de react e vue: `label` é o "texto da tab" — a instrução que produz a
  violação — e "não disparar na tab inicial";
- guideline do vanilla: `{ from, to, label }` "no clique" — `from` e `to` não
  existem em tipo nenhum; guideline do angular: "origem e destino no payload",
  também inexistentes.

E o snippet `props.extensibilityCode` das cinco stacks ensina
`label: tabs.find(…)?.label`, sem `location` — código feito para ser copiado,
ensinando o rótulo.

> **PENDÊNCIA · 2026-09-17** — o `label` do evento de troca de aba sai traduzido
> nas demonstrações de react, vue e vanilla e no snippet de extensibilidade das
> cinco; svelte e angular enviam o valor estável.
> **Fecha quando**: a dona decidir o que vai em `label` (o `value` da aba, como já
> fazem duas stacks) e as cinco demonstrações, o snippet e as guidelines de
> navegação passarem a dizer a mesma coisa.

## 10. Reconstruir do zero

Ordem: folha → fábrica de referência → wrappers de lib → stories → docs page.

- **Comece pelo padrão WAI-ARIA inteiro, não pelo desenho.** Papel, par de ids nos
  dois sentidos, tabindex itinerante e painel alcançável por Tab são o
  componente; a folha só pinta.
- **Aba desabilitada é `aria-disabled` e fica no percurso** (D1). Em lib que
  converte a prop em `disabled` nativo, não repasse a prop, e barre a ativação por
  guarda de captura na lista — `focus` não é cancelável, então quem contém é
  `stopPropagation`.
- **Confira o padrão de ativação da lib antes de confiar nele** (D2). Duas das
  quatro nascem manuais.
- **Nunca ligue `activationMode` direto a um booleano** (D3).
- **Nada de `height` no trilho** (D4); o piso do gatilho é absoluto.
- **O anel de foco precisa vencer toda regra de ativo** (D5), nas duas formas de
  atributo e dentro da `line`.
- **Escreva `data-orientation` na raiz e `data-variant` na lista** pelo componente,
  e faça a orientação chegar ao primitivo (D6) — senão layout e setas divergem.
- **`aria-orientation` só no vertical** (D7), se a lib permitir.
- **Armadilha por stack**:
  - **react** — o Base UI nasce manual, não emite `data-state` e desmonta o painel
    inativo, levando junto o `aria-controls` das abas inativas;
  - **vue** — a reka converte `disabled` em nativo e o foco itinerante filtra
    `data-disabled`; a prop tem de sair do repasse. PageUp/PageDown vêm de graça e
    as outras quatro não têm;
  - **svelte** — o bits não tem `defaultValue`, a raiz aceita `disabled` que desfaz
    D1, e o merge do estado do gatilho vence o atributo do call site: só
    `disabled={false}` desliga o nativo;
  - **vanilla** — a fábrica é não-controlada e não tem modo manual; ícone e badge
    entram trocando o conteúdo do gatilho depois de montar;
  - **angular** — o Radix NG nasce manual e o input dele é `booleanAttribute`; o
    wrapper escreve no signal da raiz por `effect`, e a ordem de instanciação dos
    host directives é o que sustenta isso.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, estados, variantes, orientação, foco | `docs/shared/styles/nds/tabs.css` |
| texto, props, tokens, critérios de teste | `docs/shared/content/tabs/translations.json` (247 chaves × 3 idiomas) |
| caixa do trilho; sonda da aba desabilitada, sem consumidor | `docs/shared/testing/tabs-probe.ts` |
| degrau de relevo | `docs/shared/guidelines/04-padroes-design-sistema.md`, "Qual degrau, por tipo de superfície" |
| evento e payload | `docs/shared/guidelines/07-analytics.md` §Tabs + `src/lib/analytics.ts` das cinco |
| regra de CATEGORIA (navegação) | não tem casa compartilhada: não existe `docs/shared/guidelines/21-navegacao.md` |
| portões determinísticos | `node scripts/audit.mjs tabs --json` |
| instrumento de tokens | `node scripts/tabela-tokens.mjs tabs` |

**Não há Figma.** `docs/shared/figma/design-links.ts` não tem entrada para tabs, e
o arquivo do Figma não tem página do componente (conferido em 2026-09-17). Não há
conjunto nem anotação a conferir contra o código, e nenhum arquivo de story das
cinco declara `design`.

> **PENDÊNCIA · 2026-09-17** — o componente não tem representação no Figma: nem
> entrada em `design-links.ts`, nem página no arquivo.
> **Fecha quando**: existir a página e o link do conjunto registrado em
> `design-links.ts`, ou a dona decidir por escrito que Tabs fica fora do Figma.

### O auditor, antes e depois deste arquivo

Medido em 2026-09-17, **antes** de este arquivo existir:
`node scripts/audit.mjs tabs --json` devolve **18 achados**.

| regra | severidade | stacks | o que diz |
|---|---|---|---|
| `inline_style_design_value` | high (3), medium (4) | react, vue (5×), svelte | `max-width: 36rem` nas docs pages de react, vue e svelte; `padding-top: 0.75rem` nos quatro arquivos de story do vue (V27) |
| `story_file_sem_transform` | medium | angular (3×) | variantes, estados e composições publicam o template da story (V25) |
| `identificador_pt` | low | react, vanilla, angular | `estilo` nas stories de estados de react e angular; `padrão` no `tabs.source.test.ts` do vanilla |
| `source_sem_teste` | medium | react, angular | sem `tabs.source.test.ts` (V24) |
| `location_fora_do_vocabulario` | medium | angular | `docs-demonstration` no `TabsDocs.ts`, linha 557 (V13) |
| `story_group_divergent` | medium | cross-stack | `ManualActivation` em `compositions` no react e no svelte e em `states` no angular (V17) — o vue a chama `ManualMode` e escapa da comparação por nome |
| `demonstration_labels_divergent` | medium | angular | seis rótulos a mais na demonstração (V29) |

**Com este arquivo escrito, a contagem é 23**, medida logo depois de salvá-lo: os
18 acima, inalterados regra a regra, mais cinco `catalogo_duplicado_com_prd`, um
por `05-navigation-components.md`. As regras que este documento poderia acender
sozinho não acenderam — `prd_token_sem_lastro` não reporta nenhum dos tokens da
§5, e nenhuma pendência daqui cai em `prd_pendencia_ja_fechada`.

> **PENDÊNCIA · 2026-09-17** — os 18 achados anteriores ao PRD estão abertos, três
> de severidade alta (os `max-width` inline das docs pages de react, vue e svelte).
> **Fecha quando**: `node scripts/audit.mjs tabs --json` devolver lista vazia.

### O catálogo em guideline existe, nas cinco, e diverge

`## Tabs` está em `05-navigation-components.md` das cinco stacks (react linha 247,
vue 244, svelte 165, vanilla 41, angular 45). O que cada cópia afirma e o código
contradiz, medido em 2026-09-17:

- **react e vue**: "Sem ícones nas tabs — exceto instrução específica", enquanto o
  conteúdo publica a composição com ícone e quatro stacks a demonstram; a tabela de
  teclado lista só `Arrow Right`/`Arrow Left`, sem o par vertical; o `label` do
  evento é o "texto da tab" (§9). O vue aponta `src/components/ui/tabs/tabs.vue`, e
  o arquivo é `Tabs.vue`;
- **svelte**: a árvore diz `Tabs (defaultValue)`, e a raiz do svelte não tem
  `defaultValue` — a docs page da mesma stack tem um comentário dizendo que não
  documenta a prop justamente por isso; o teclado é "Arrow Left/Right entre tabs",
  sem Home/End nem vertical;
- **vanilla** — a stack de referência: a árvore tem um invólucro `TabPanels` que a
  fábrica não cria; o trilho teria "respiro interno de 8-grid", e o respiro é 4px
  (`--spacing-1`); o foco visível seria "no tab ativo", e o anel é da aba FOCADA; o
  evento seria `{ from, to, label }` no clique, e o código envia `{ component,
  label, index, total, location }` na troca;
- **angular**: "origem e destino no payload", inexistentes; e o comentário do
  `tabs.ts` da mesma stack (linhas 66–67) e o docblock de `DisabledTab` dizem que "o
  bloqueio do clique vem do `pointer-events: none`" — lido na fonte, o
  `RdxTabsTab.onClick` já retorna quando a aba está desabilitada, e é ele a trava;
- **a cobertura é desigual**: vanilla e angular têm tabela de opções/entradas,
  react e vue têm regras, teclado e UX writing, e o svelte tem vinte linhas.

> **FECHADA · 2026-09-17** — as cinco `05-navigation-components.md` tinham seção
> `## Tabs`, e passou a haver PRD. Duas fontes para a mesma coisa, e a segunda já
> errava a árvore da referência, o payload do evento em três redações e o
> `defaultValue` do svelte.
> **Fecha quando**: `catalogo_duplicado_com_prd` não reportar tabs.
> **Como fechou (2026-09-17)**: as cinco seções viraram ponteiro para este PRD e
> para `docs/shared/guidelines/21-navegacao.md`, com a mecânica de cada stack sob
> título próprio. As três afirmações falsas não passaram para o texto novo.

### Afirmações do conteúdo compartilhado e da folha que o código contradiz

1. `states.hover.behavior` promete texto `foreground` no hover da aba inativa; a
   folha não tem regra `:hover` (§6);
2. `accessibility.aria.tablist` publica `aria-orientation` como atributo da lista
   sem condição; vale sempre em duas stacks e só no vertical em três (V1);
3. `notes.item3` diz "só a tab ativa é focável via Tab"; em react, vue e angular o
   `tabindex="0"` segue a aba FOCADA quando foco e seleção se separam (V10);
4. `accessibility.keyboard.enter` e `space` dizem "quando a ativação é manual", e
   o vanilla não tem modo manual;
5. a tabela de tokens das cinco docs pages nomeia `[data-state="active"]`, que o
   react não emite (V4);
6. `tokens.customizationCode` ensina a customizar por `[data-slot="…"]` e com
   literal de cor (`hsl(220 90% 50%)`) — no angular o `data-slot` é disputado por
   host binding, e a regra da casa é estilizar por classe;
7. `usage.dont.item4` manda usar `SegmentedControl` e `usage.scenarios.item5` manda
   "Filter chips"; nenhum dos dois é componente do design system;
8. na folha: o comentário do raio do gatilho erra os números (§5), o docblock não
   lista metade dos tokens lidos (§5), o comentário 123 atribui a margem do painel
   a um "fluxo vanilla" que já escreve `data-orientation` (§6), e o comentário 108
   diz "libs headless" para `data-active` quando só duas das quatro o emitem (D9);
9. em `tabs-probe.ts`: o docblock diz que as cinco stacks medem a aba desabilitada
   com o arquivo, e nenhuma importa a função (§8).

> **PENDÊNCIA · 2026-09-17** — o vanilla, que é a referência, não tem ativação
> manual, e as outras quatro stacks, o conteúdo compartilhado e quatro stories a
> publicam; a docs page do vanilla lista a prop dizendo que não está implementada.
> **Fecha quando**: a dona decidir entre implementar `activationMode` na fábrica
> do vanilla e retirar o modo manual do contrato das cinco.

> **PENDÊNCIA · 2026-09-17** — vue e svelte emitem `aria-orientation="horizontal"`,
> e a decisão escrita na referência é omitir o valor implícito.
> **Fecha quando**: a dona decidir entre suprimir o atributo no horizontal nas duas
> stacks e registrar a exceção como mecânica de lib — e, na segunda hipótese, a
> `Default` de variantes do vanilla deixar de ser a única a afirmar o contrário.

> **PENDÊNCIA · 2026-09-17** — a raiz do svelte aceita `disabled`, documentado no
> Playground, e lido na fonte ele faz o bits emitir `disabled` nativo em todas as
> abas, desfazendo D1; nenhuma story o renderiza.
> **Fecha quando**: a prop sair do repasse da raiz do svelte, ou uma story provar
> que o conjunto desabilitado continua alcançável pela seta.

> **PENDÊNCIA · 2026-09-17** — o `aria-controls` das abas inativas do react e a
> retenção do `tabindex="0"` em modo manual (V9, V10) foram lidos na fonte das
> libs e não medidos em navegador.
> **Fecha quando**: uma story de cada stack afirmar o `aria-controls` de uma aba
> INATIVA e o dono do `tabindex="0"` depois de uma seta em modo manual.
