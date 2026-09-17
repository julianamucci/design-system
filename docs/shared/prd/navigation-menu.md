# PRD — NavigationMenu

> **Estado descrito**: 2026-09-17, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código vai usar este documento como base:
> o que está aqui foi medido nas cinco stacks, na folha compartilhada e no
> conteúdo, e as divergências entre stacks estão registradas em vez de resolvidas.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
>
> **É a primeira descrição unificada do componente, e ela nasce contradizendo a
> folha.** O docblock de `navigation-menu.css` (linhas 5-23) ainda ensina
> `role="menubar"` na lista, `role="menu"` no painel e `aria-haspopup="true"` no
> gatilho — as três coisas que a fábrica do vanilla, que é a referência, recusa
> por escrito (`navigation-menu.ts:5-23`) e que nenhuma das cinco stacks emite.
> O catálogo em guideline existe em quatro stacks e NÃO existe no vanilla (§11).

## 1. Identidade

Barra de **destinos** do site — cabeçalho ou coluna lateral — em que cada item é
um link de verdade ou um gatilho que revela um painel de mais links. É
**navegação, não menu de comandos**: o painel é uma lista de páginas, o item é
`<a href>` (abre em nova aba, entra no histórico, mostra o endereço na barra de
status), e o padrão de ARIA é o de **divulgação** (disclosure): `aria-expanded` e
`aria-controls` no gatilho, sem papel nenhum de menu.

A raiz é `<nav>` nas cinco stacks, e é a única peça da família de flutuantes cujo
painel não tem papel ARIA: o Popover é `dialog`, o DropdownMenu e o Menubar são
`menu`. Essa ausência é deliberada e está escrita nos primitivos do vanilla
(`navigation-menu.ts:12-18`) e do angular (`navigation-menu.ts:37-51`).

| vizinho | diferença que decide |
|---|---|
| **Menubar** | barra de COMANDOS de aplicação (Arquivo, Editar, Exibir): `role="menubar"` e `role="menu"` (`menubar.ts:271`, `:434` no vanilla), foco itinerante, typeahead e Tab que FECHA. Aqui o item é destino, o Tab atravessa os links do painel e não há typeahead |
| **DropdownMenu** | UM gatilho com uma lista de AÇÕES, e o teclado pertence à lista (`dropdown-menu.md` §1). Aqui há uma BARRA de gatilhos irmãos, um painel por vez, e o conteúdo são endereços |
| **Popover** | conteúdo INTERATIVO arbitrário (campo, formulário), aberto só por clique, com papel `dialog`. Aqui o painel abre também pelo ponteiro, e dentro dele só há links |
| Sidebar | navegação vertical PERSISTENTE da aplicação; o conteúdo compartilhado manda preferi-la quando há painel lateral fixo (`usage.guidelines.item2`, `usage.dont.item2`) |
| Breadcrumb | também é `<nav>` com `aria-current="page"`, mas descreve a posição numa hierarquia, não os destinos disponíveis |
| Tabs | alterna painéis presentes na MESMA página; aqui cada escolha sai da página |

**A pergunta que decide entre este e o Menubar: o que acontece quando a pessoa
escolhe?** Se ela VAI PARA OUTRA PÁGINA, é NavigationMenu. Se ela EXECUTA ALGO
sem sair, é Menubar (barra) ou DropdownMenu (um gatilho). O conteúdo compartilhado
diz isso pelo cenário — "Editor estilo desktop (IDE) → Menubar",
`usage.scenarios.item2` — e a consequência para o ARIA está no parágrafo acima:
anunciar "menu, 4 itens" a quem espera páginas promete comandos que não existem.

**E entre este e o Popover: dentro do painel só há links?** Se sim, é este. Um
campo ou um botão de ação dentro do painel é conteúdo de Popover, e montá-lo aqui
deixaria o painel abrir sozinho sob o ponteiro com um formulário dentro.

**Nenhum consumidor interno.** Medido em 2026-09-17: as classes
`.nds-navigation-menu-*` só aparecem na folha própria, nos primitivos, nas stories
e nas cinco docs pages; nenhuma outra folha compartilhada e nenhuma sonda de
`docs/shared/testing/` as usa.

## 2. Contrato de comportamento

Cada linha aponta a chave de `docs/shared/content/navigation-menu/translations.json`
que a publica e a story que a mede. O dicionário tem **243 chaves folha em cada um
dos três idiomas** (pt-BR, en, es — conferido em 2026-09-17, contagem idêntica,
contando cada `*Code` como uma). Não há sonda compartilhada: as plays medem cada
uma por conta própria.

| # | o contrato | chave · onde é medido |
|---|---|---|
| C1 | A raiz é `<nav>` com nome acessível próprio | `testes.accessibility.item2`, `accessibility.aria.navigation` · passo "A barra é um landmark com nome próprio" do Playground das cinco |
| C2 | Os destinos da barra são `<a>` com papel de link — nunca `menuitem` | — · passo "Os destinos da barra são links de verdade" do Playground das cinco |
| C3 | Fechado, o gatilho declara `aria-expanded="false"` e o painel não é alcançável | `testes.accessibility.item3` · `Closed` das cinco (o vanilla afirma `hidden`; as quatro com lib afirmam que o painel não existe no DOM) |
| C4 | Aberto, o gatilho declara `aria-expanded="true"` e `aria-controls` aponta para um elemento que existe | `testes.accessibility.item3` · `Open` das cinco — o ALVO difere por stack (§7, item 4) |
| C5 | Setas do eixo da barra movem o foco entre os itens da barra | `testes.functional.item2`, `accessibility.keyboard.arrows` · Playground (horizontal) e `Vertical` das cinco |
| C6 | Enter no gatilho fechado abre o painel, e os destinos ficam na ordem de foco | `testes.functional.item3` · Playground das cinco — **só o angular afirma que o foco ENTRA no painel**; as outras quatro focam o destino à mão e afirmam só que ele não tem `tabindex="-1"` |
| C7 | Escape com o painel aberto fecha e devolve o foco ao gatilho | `testes.functional.item4`, `testes.accessibility.item5` · Playground das cinco |
| C8 | O ponteiro sobre o gatilho abre o painel sem clique | `testes.functional.item1` · Playground das cinco |
| C9 | Passar o ponteiro de um gatilho ao vizinho troca o painel sem fechá-lo | `testes.functional.item7` · Playground das cinco |
| C10 | Escolher um destino do painel fecha o painel | `testes.functional.item5` · `WithDropdown` das cinco |
| C11 | O destino da página atual declara `aria-current="page"` e só ele | `testes.functional.item6`, `testes.accessibility.item4` · `Active` das cinco |
| C12 | A página atual se distingue pelo FUNDO, não só pelo texto | `testes.functional.item6` · `Active` das cinco, comparando `backgroundColor` com o de um vizinho |
| C13 | A descrição do destino faz parte do nome acessível dele (WCAG 2.4.4) | — · `MegaMenuGrid` das cinco |
| C14 | O fundo do painel é opaco | `testes.accessibility.item6` · `Open` das cinco — é o que dá sentido ao contraste medido pelo axe |
| C15 | Horizontal abre o painel abaixo da barra; vertical abre ao lado | `variants.styles.vertical` · abaixo: `Horizontal` das cinco; **ao lado: só vanilla e angular** |
| C16 | Todos os destinos do painel são alcançáveis por Tab | — · `WithHighlightedCard` das cinco |
| C17 | Em modo controlado, a interação anuncia o valor pedido | `props.table.onValueChange.description` · `ControlledValue` do vanilla (clique não abre nada até `setValue`); espião de `onValueChange` no Playground de react e angular; **vue e svelte não afirmam** |
| C18 | A barra que sai da página não deixa ouvinte preso ao documento | — · `ListenerCleanup` do vanilla — única stack que registra ouvinte em `document` à mão |

**O conteúdo publica dois contratos que nenhuma story mede.**
`testes.visual.item4` (seta indicadora) é declarado não aplicável no vanilla, com
motivo (`navigation-menu-states.stories.ts:260-262`), e medido nas outras quatro
por presença — só vue e svelte afirmam o losango desenhado (§7, item 11). E
`accessibility.items.item6` promete que o FOCO abre o painel depois da espera:
nenhuma story foca um gatilho e espera, e no vanilla o foco não abre nada (§8).

## 3. Decisões fixadas

### D1 · Navegação usa o padrão de divulgação, não o de menu

**Estado**: gatilho com `aria-expanded` e `aria-controls`; nenhum `role` na
lista, no painel ou nos destinos; nenhum `aria-haspopup`. Nas cinco — as quatro
libs instaladas não escrevem esses papéis (conferido nos pacotes: `role` só
aparece no `Backdrop` do base-ui e no do radix-ng, como `presentation`; nenhum
na reka nem no bits).
**Motivo, escrito em dois primitivos** (`vanilla/navigation-menu.ts:5-23`,
`angular/navigation-menu.ts:37-51`): `role="menuitem"` apaga o anúncio de "link"
e com ele abrir em nova aba e ver o destino; `role="menu"` no painel faz o leitor
anunciar comandos; e `aria-haspopup` promete um papel de popup que o painel não
tem — os dois comentários atribuem essa regra à guideline 01. `role="menubar"` ainda obrigaria foco
itinerante e só filhos `menuitem` (`aria-required-children`).
**O que contradiz**: o docblock da própria folha (`navigation-menu.css:5-23`)
ensina os três papéis recusados. O conteúdo compartilhado está do lado certo
(`accessibility.items.item2`: "o painel é uma lista de destinos, não um menu de
comandos"), com uma exceção — `notes.item1` fala em "papéis ARIA do menu".

### D2 · O destino de dentro do painel é peça PRÓPRIA (`-child`), separada do link da barra

**Estado**: `.nds-navigation-menu-link` é pílula de uma linha (`inline-flex`,
`white-space: nowrap`); `.nds-navigation-menu-child` é bloco com título e
descrição opcional (`display: block`, padding de 12px, raio pequeno). As cinco
têm a peça: `createNavigationMenu` monta `children` como `-child`;
`NavigationMenuChild` em react, vue e svelte; `a[ndsNavigationMenuChild]` no
angular.
**Motivo, repetido nos quatro primitivos com lib**: sem a separação, os painéis
de mega-menu empurravam título e descrição para dentro de uma pílula que não
quebra linha.
**O que ainda não acompanhou**: `anatomy.structureCode` de react, vue e svelte
ensina `NavigationMenuLink` DENTRO do painel, e `usage.guidelines.item5` manda
usar `NavigationMenuLink` no conteúdo "para herdar acessibilidade e tracking
automático" — a peça do painel é a `-child`, e nenhum primitivo chama `track`.

### D3 · Escolher um destino fecha o painel SEMPRE, sem olhar `defaultPrevented`

**Estado**: vanilla fecha no clique do `-child` (`navigation-menu.ts:326`);
react liga `closeOnClick`, que o base-ui nasce desligado
(`navigation-menu.tsx:189`); svelte despacha o evento de dispensa da lib DEPOIS do
`onclick` de quem consome (`navigation-menu-child.svelte:37-42`); angular chama
`close('link-press')` no host (`navigation-menu.ts:433-435`); vue depende do
padrão da reka (o `NavigationMenuLink` dispensa quando o evento de seleção não é
prevenido).
**Motivo**: navegar é sair da página, e um painel que sobrevive ao clique fica
pendurado sobre a seguinte. Quem usa roteador de cliente chama `preventDefault()`
no clique e continua querendo o painel fechado — no svelte, o encadeamento da lib
PARA no primeiro `preventDefault`, e é por isso que a ponte existe.
**Portão**: `WithDropdown` das cinco (C10).

### D4 · Vertical abre para o LADO, e a direção é derivada, nunca prop

**Estado**: vanilla, pela folha (`.nds-navigation-menu[data-orientation="vertical"] .nds-navigation-menu-content`,
`top: 0`, `left: 100%`, margem inicial de 8px — linhas 67-72); react e angular,
passando `side="right"` ao posicionador quando a orientação é vertical
(`react/navigation-menu.tsx:55`, `angular/navigation-menu.ts:255-257`).
**Motivo, escrito nos três**: abrir para baixo numa coluna cobriria os próprios
itens seguintes.
**Onde não alcança**: vue e svelte usam o invólucro de viewport
(`.nds-navigation-menu-viewport-wrap`, `top: 100%`), e a folha não tem regra
vertical para ele. As stories `Vertical` dessas duas stacks são só links, sem
gatilho — então nada mede onde o painel abre ali (§7, item 7).

### D5 · A página atual lê `aria-current`, e `data-active` entra junto

**Estado**: `.nds-navigation-menu-link[aria-current="page"]` e
`.nds-navigation-menu-link[data-active]:not([data-active="false"])` pintam fundo
de accent a 20%, texto `--accent-foreground` e peso semibold (folha, 252-257); no
hover e no foco o fundo DESCE para 10% (261-266).
**Motivo** (comentário da folha, 231-239): `aria-current` é o que o leitor anuncia
e o que qualquer roteador escreve; o vanilla, sem lib, só tem esse atributo, e sem
a metade ARIA o destaque dependeria de a stack usar uma lib (WCAG 1.4.1).
**Quem escreve o quê**: vanilla, `aria-current` pela opção `active`
(`navigation-menu.ts:271`); as quatro libs escrevem os DOIS a partir da prop
`active` — `data-active=""` e `aria-current="page"`, e nenhum dos dois quando
inativo (base-ui por `getStateAttributesProps`, que omite `false`; reka
`NavigationMenuLink.js:50-51`; bits `navigation-menu.svelte.js:473-474`; radix-ng
por host binding).
**O filtro `:not([data-active="false"])` não tem produtor**: o comentário diz que
"a lib emite o atributo com valor em TODOS os itens", e nenhuma das quatro libs
instaladas faz isso. É inofensivo e é resíduo.
**Portão**: `Active` das cinco (C11, C12).

### D6 · O texto sobre accent é `--accent-foreground`, e a descrição sobe junto no destaque

**Estado**: as três peças focáveis declaram `color: hsl(var(--accent-foreground))`
em hover e foco (102-108, 159-163); a página atual também (255). A descrição do
`-child`, que em repouso é `--muted-foreground`, passa a `--accent-foreground` a
85% quando o destino está em hover, foco ou foco visível (207-211).
**Medição registrada na folha**: `--muted-foreground` sobre o accent mede 2,64:1
(o axe reprovou o mesmo defeito no `command`); a 0.85 é o piso — a 0.80 a razão
cai para 4,34:1. O link da página atual era a única superfície de accent que não
declarava o texto e herdava `--foreground` por acidente (243-245).
**Regra da casa que executa**: quem pinta fundo de accent declara o texto em cima.

### D7 · Anel de foco interno em `--accent-foreground`, na forma dos menus

**Estado**: `outline: 2px solid hsl(var(--accent-foreground))` com
`outline-offset: -2px` em `:focus-visible` do gatilho, do link e do `-child`
(176-181). As três declaram `outline: 0` na regra base.
**Medição**: até 2026-09-10 o foco por teclado só pintava fundo a 10%, sem anel,
nas cinco stacks (WCAG 2.4.7). Achado pelo portão `anel_de_foco_ausente` no dia em
que ele nasceu (`0cae343ac`).
**Por que interno e nesta cor**: é a forma de `dropdown-menu.md` D2 — o painel
recorta, e o `--ring` quase some sobre o accent no escuro.
**O que as guidelines de stack ainda dizem**: a seção transversal de react e vue
manda `.nds-focus-ring` com `--ring` em todo elemento de navegação — este
componente não usa essa classe.

### D8 · A folha tem DOIS vocabulários de painel, e três stacks usam três deles

**Estado**, medido em 2026-09-17:

| stack | invólucro | superfície | miolo |
|---|---|---|---|
| vanilla | `.nds-navigation-menu-item` (relativo) | `.nds-navigation-menu-content`, absoluto, um por item | os `-child` direto |
| react · angular | `.nds-navigation-menu-positioner`, num portal | `.nds-navigation-menu-popup`, UM para a barra | `.nds-navigation-menu-viewport` → `.nds-navigation-menu-popup-content` |
| vue · svelte | `.nds-navigation-menu-viewport-wrap`, absoluto sob a raiz | `.nds-navigation-menu-viewport-panel`, UM para a barra | `.nds-navigation-menu-viewport-content` |

**Motivo**: o vanilla monta o painel à mão, junto do gatilho; base-ui e radix-ng
publicam o dialeto posicionador/popup/viewport com variáveis de tamanho
(`--positioner-*`, `--popup-*`); reka e bits publicam as dimensões do viewport
com o prefixo delas. É mecânica de lib, não escolha de desenho — e a superfície
declara o MESMO desenho nas três classes (fundo, texto, borda, raio, degrau).
**Consequência que a tabela de tokens já carrega**: o instrumento aponta quatro
"divergências entre stacks" (`--popover`, `--border`, `--elevation-md`, `--radius`
em três classes diferentes) — são esta decisão, não defeito.

### D9 · A cadeia de `transform-origin` NÃO tem degrau do bits, por exceção declarada

**Estado**: a folha não tem cadeia. Tem duas declarações isoladas:
`.nds-navigation-menu-popup { transform-origin: var(--transform-origin) }` (303),
que react e angular alimentam — o base-ui publica a variável no posicionador, e o
radix-ng também (`radix-ng-primitives-popper.mjs:562`, o dialeto unificado
`--transform-origin: var(--radix-popper-transform-origin)`); e
`.nds-navigation-menu-viewport-panel { transform-origin: top center }` (351),
literal, para vue e svelte.
**Exceção declarada**: `CADEIA_ORIGEM_SEM_BITS` em `scripts/audit.mjs` isenta esta
folha — "o bits-ui não publica origem para o navigation-menu: nenhuma chamada de
`getFloatingContentCSSVars` no pacote dele (medido na 2.19.0)". **Premissa
conferida em 2026-09-17**, com o bits-ui 2.19.0 instalado: zero chamadas em
`dist/bits/navigation-menu`, e as únicas variáveis publicadas são
`--bits-navigation-menu-viewport-width` e `-height`. A reka 2.10.4 também não
publica origem (seis variáveis, todas de viewport e indicador).
**O que o portão NÃO confere**: a premissa da exceção. O mapa principal tem a
conferência contra o pacote instalado (`cadeia_transform_origin_premissa`); a lista
de exceções é só uma chave com motivo em texto. Se o bits passar a publicar
origem, nada reprova.
**O `top center` do vue e do svelte é inerte hoje**: `.nds-navigation-menu-viewport-panel`
não declara `transform` nem transição, então não há escala para a origem ancorar.
**A cadeia foi conferida de pé**: em 2026-09-03 a mensagem do conserto do tooltip
listou esta folha entre as que "esqueciam o degrau do bits"; o portão nascido
depois a classificou como exceção, e a premissa vale.

### D10 · A página atual pinta MAIS forte em repouso do que no hover

**Estado**: repouso a 20%, hover e foco a 10% (D5). O gatilho aberto também fica a
20% (220-224). Os demais itens vão de transparente (fundo `--background`) a 10%.
**O que o conteúdo diz**: `states.active.behavior`, nos três idiomas, diz "fundo
em `--accent` a 50% de opacidade [...] que passa a opacidade total no hover e no
foco" — as duas metades contradizem a folha, e a segunda inverte a direção.
**O que o comentário da folha diz**: 246-251 afirma que "o alfa saiu do CLARO [...]
aqui ele entra inteiro", e a declaração logo abaixo é `hsl(var(--accent) / 0.2)`.
O comentário descreve uma versão anterior da regra.

### D11 · Altura é resultado; o chevron é o único tamanho fixo de peça de texto

**Estado**: gatilho e link sem `height` — `padding-block` de 8px +
`line-height: var(--line-height-normal, 1.5)` (81-92), com o motivo escrito: com
`height: 2.25rem` o texto vazava da pílula em vez de esticá-la (WCAG 1.4.4). O
chevron tem 12px literais (117-118), e o ícone de link 16px pelo token de
espaçamento (268-271) — ícones não têm texto para crescer.

### D12 · A abertura por ponteiro espera, e a espera tem DOIS nomes e dois padrões

**Estado**, medido nos primitivos e nos pacotes instalados:

| stack | espera para abrir | segundo parâmetro | padrões |
|---|---|---|---|
| vanilla | `delayDuration` | `skipDelayDuration` — janela depois de fechar em que o próximo abre sem esperar | 200 · 300 (`navigation-menu.ts:141-142`) |
| vue (reka) | `delayDuration` | `skipDelayDuration` | 200 · 300 (`NavigationMenuRoot.js:34-43`) |
| svelte (bits) | `delayDuration` | `skipDelayDuration` | 200 · 300 (`navigation-menu.svelte:17-18` do pacote) |
| react (base-ui) | `delay` | `closeDelay` — espera para FECHAR quando o ponteiro sai | 50 · 50 (`NavigationMenuRoot.js:53-54`) |
| angular (radix-ng) | `delay` | `closeDelay` | 50 · 50 |

**Motivo**: é API de lib, e o react registra o custo de não respeitá-la
(`navigation-menu.tsx:17-23`): a tipagem anunciava `delayDuration`, a prop ia
parar no DOM como atributo desconhecido e a espera ficava sempre no padrão.
**O que não é só nome**: `skipDelayDuration` e `closeDelay` são conceitos
DIFERENTES. E o vanilla não fecha quando o ponteiro sai (§6) — então nele não há
o que `closeDelay` controlaria.
**Onde a divergência vaza**: a docs page do react publica `delayDuration` e
`skipDelayDuration` com padrões 200 e 300 (`NavigationMenuDocs.tsx:845-856`) e o
`props.extensibilityCode` de react ensina os dois — nenhum existe na stack
(`snippet_sem_lastro` reporta). O angular sobrescreve a tabela com `delay`,
`closeDelay` e `indicator` e troca o snippet por uma constante local.

## 4. Anatomia

Referência (vanilla, `createNavigationMenu`):

```
navigation-menu              <nav>, aria-label, data-orientation
└── navigation-menu-list     <ul>; horizontal: .nds-navigation-menu-list; vertical: .nds-stack
    ├── <li>
    │   └── navigation-menu-link          <a href>, aria-current="page" quando ativo
    └── <li>
        └── navigation-menu-item          <div>, position: relative
            ├── navigation-menu-trigger   <button>, aria-expanded, aria-controls, data-state, data-value
            │   ├── <span>                rótulo
            │   └── svg.nds-navigation-menu-chevron   aria-hidden
            └── navigation-menu-content   <div id>, hidden quando fechado, data-value
                └── navigation-menu-child <a href>
                    ├── .nds-navigation-menu-child-label        <div>
                    └── .nds-navigation-menu-child-description  <p>, opcional
```

**Duas diferenças de forma que a referência TEM e as libs não**: o `data-slot`
`navigation-menu-item` está num `<div>` DENTRO do `<li>` (nas quatro com lib, a
peça É o `<li>`); e o painel é filho do item, no fluxo, e não num portal.

Nas quatro stacks com lib, a árvore visível é a mesma da barra, e o painel mora
fora dela:

```
navigation-menu                         <nav>
├── navigation-menu-list                <ul>
│   └── navigation-menu-item            <li>
│       ├── navigation-menu-trigger     <button>, chevron como filho
│       └── navigation-menu-content     (o miolo — no angular, um ng-template)
└── painel compartilhado                um por barra
    ├── react · angular   portal → positioner → popup → viewport → conteúdo ativo
    └── vue · svelte      viewport-wrap → viewport-panel [navigation-menu-viewport] → conteúdo ativo
```

`data-slot` publicados, por stack (medido nos primitivos):

| slot | vanilla | react | vue | svelte | angular |
|---|---|---|---|---|---|
| `navigation-menu` | sim | sim | sim | sim | sim |
| `navigation-menu-list` | sim | sim | sim | sim | sim |
| `navigation-menu-item` | sim (no `<div>`) | sim | sim | sim | sim |
| `navigation-menu-trigger` | sim | sim | sim | sim | sim |
| `navigation-menu-content` | sim | sim | sim | sim | sim (no `[ndsNavigationMenuPanel]`) |
| `navigation-menu-link` | sim | sim | sim | sim | sim |
| `navigation-menu-child` | sim | sim | sim | sim | sim |
| `navigation-menu-viewport` | — | — | sim | sim | sim |
| `navigation-menu-indicator` | — | sim | sim | sim | sim |
| `navigation-menu-child-label` · `-child-description` | — | — | — | — | sim |

Rótulo e descrição do destino são CLASSE nas cinco; só o angular dá a eles peça
com `data-slot`. Nas outras quatro são `<div>`/`<p>` escritos por quem compõe
(vanilla: pela fábrica).

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/navigation-menu.css`, 407 linhas — a maior folha
da categoria Navegação. Instrumento: `node scripts/tabela-tokens.mjs navigation-menu`
fecha com **0 linhas divergentes da folha**, 39 linhas comparadas (react, vue,
svelte e angular listam 8; o vanilla 7, sem a do indicador, que ele não desenha) e
as quatro divergências entre stacks de D8.

### Barra e itens

| propriedade | valor | token |
|---|---|---|
| raiz · camada | 10 | **literal** `z-index: 10` |
| raiz · largura | até o conteúdo | **literal** `max-width: max-content`; `none` na vertical |
| lista · gap | 4px | `--spacing-1` |
| gatilho e link · padding inline | 16px | `--spacing-4` |
| gatilho e link · padding block | 8px | `--spacing-2` |
| gatilho e link · fundo em repouso | — | `--background` |
| gatilho e link · raio | — | `--radius` |
| gatilho e link · corpo | 14px | `--text-control` |
| gatilho e link · entrelinha | 1.5 | `--line-height-normal`, com `1.5` de fallback (D11) |
| gatilho e link · peso | 500 | `--font-weight-medium`, com `500` de fallback |
| gatilho e link · transição | fundo e cor | `--duration-fast` |
| hover e foco · fundo | accent a 10% | `--accent` |
| hover e foco · texto | — | `--accent-foreground` |
| anel de foco | 2px interno | `--accent-foreground` (D7) |
| gatilho aberto · fundo | accent a 20% | `--accent` — só por `[data-popup-open]` ou `[data-open]` (§6) |
| página atual · fundo | accent a 20%, 10% no hover | `--accent` (D5, D10) |
| página atual · peso | 600 | `--font-weight-semibold`, com `600` de fallback |
| desabilitado | opacidade 0.5 | **literal**, só no gatilho |
| chevron | 12px | **literal** `0.75rem` (D11) |
| chevron · respiro | 4px | `--spacing-1` |
| chevron · rotação | 180° aberto | transição `--duration-base` |
| ícone dentro do link | 16px | `--spacing-4` |

### Painel

| propriedade | valor | token |
|---|---|---|
| superfície (as três classes de D8) | — | `--popover` |
| texto da superfície | — | `--popover-foreground` |
| borda | 1px | `--border` |
| raio | — | `--radius` |
| elevação | flutuante interativo | `--elevation-md` |
| camada | popover | `--z-popover` |
| vão até a barra (vanilla, vue, svelte) | 6px | `--spacing-1-5` |
| vão até a barra (react, angular) | 8px | **literal** `sideOffset = 8` no primitivo, não na folha |
| vão lateral na vertical (vanilla) | 8px | `--spacing-2` |
| padding · vanilla | 8px | `--spacing-2` |
| padding · miolo com lib | 4px | `--spacing-1` |
| largura mínima · vanilla | 180px | **literal** `11.25rem` |
| react · angular · posicionador | — | `--positioner-width`, `--positioner-height`, `--available-width` |
| react · angular · popup | — | `--popup-width`, `--popup-height`, `--transform-origin` (D9) |
| react · angular · entrada e saída | escala 0.9 e opacidade 0 | **literal** `scale(0.9)`; transição `--duration-moderate` com `--ease-emphasis` |
| vue · viewport | — | `--reka-navigation-menu-viewport-width`, `--reka-navigation-menu-viewport-height` |
| svelte · viewport | medida da lib + 16px | `--bits-navigation-menu-viewport-width`, `--bits-navigation-menu-viewport-height`, **somados a `1rem` literal** — o degrau da reka não soma |
| vue · svelte · largura do viewport | 100% até 48rem, medida da lib depois | **literal** `@media (min-width: 48rem)` |

### Destino do painel e indicador

| propriedade | valor | token |
|---|---|---|
| `-child` · padding | 12px | `--spacing-3` |
| `-child` · raio | — | `--radius-sm` |
| `-child` · hover e foco | accent a 10%, texto `--accent-foreground` | `--accent`, `--accent-foreground` |
| título · corpo e peso | 14px, 500 | `--text-control`, `--font-weight-medium` |
| título · entrelinha | 1 | **literal** |
| descrição · corpo | 14px | `--text-control` |
| descrição · entrelinha | 1.35 | **literal** |
| descrição · respiro sobre ela | 4px | `--spacing-1` |
| descrição · cor | — | `--muted-foreground`; `--accent-foreground` a 85% no destaque (D6) |
| descrição · corte | 2 linhas | **literal** `-webkit-line-clamp: 2` |
| indicador · altura | 6px | `--spacing-1-5` |
| indicador · losango | 8px, girado 45° | `--spacing-2` |
| indicador · cor e sombra | — | `--border`, `--elevation-md` |
| indicador · canto | 2px | **literal** |

**O degrau de elevação está no mapa**: `04-padroes-design-sistema.md` §"Qual
degrau, por tipo de superfície" classifica navigation-menu como flutuante
interativo, `md`, e as três superfícies de D8 e o losango leem `--elevation-md`.
Nenhuma sombra literal.

**Movimento reduzido**: bloco `@media (prefers-reduced-motion: reduce)` (397-407)
zera a transição das sete classes que declaram uma — gatilho, link, chevron,
`-child`, posicionador, popup e miolo do popup. A guarda **vence**: todos os
seletores dela têm a mesma especificidade das regras base e vêm depois. E é
redundante, como em toda folha que só usa duração por token: a escada de
`docs/shared/tokens/motion.css` já apaga as durações sob a preferência. O painel
do vanilla e o de vue/svelte não animam a entrada — não há o que guardar ali.

**Literais sem motivo escrito na folha**: o `z-index: 10` da raiz, os 180px de
largura mínima, as duas entrelinhas do destino, o `1rem` somado só ao degrau do
bits, o `top: 60%` do losango e o breakpoint de 48rem.

**O docblock de tokens está incompleto**: a lista das linhas 25-26 não cita
`--elevation-md`, `--z-popover`, `--line-height-normal` nem as durações.

**Seletor com resíduo de Tailwind**: `.nds-navigation-menu-link svg:not([class*="size-"])`
(268) filtra pela forma de classe utilitária `size-*`, que o projeto não tem mais.
Nenhuma story e nenhuma docs page põe ícone dentro de link da barra.

## 6. Estados

| estado | quando ocorre | o que muda | tem produtor? |
|---|---|---|---|
| Repouso | sempre | itens com fundo `--background` | sim, as cinco |
| Hover e foco | `:hover`, `:focus` | fundo a 10%, texto `--accent-foreground` | sim, as cinco (hover pela abertura do Playground) |
| Foco visível | `:focus-visible` | anel interno de 2px (D7) | sim — as setas do Playground focam por teclado nas cinco; nenhuma story mede o anel |
| Aberto · chevron | `[data-state="open"]` (vanilla, vue, svelte) ou `[data-popup-open]`/`[data-open]` (react, angular) | chevron gira 180° | sim, as cinco |
| Aberto · fundo do gatilho | só `[data-popup-open]` ou `[data-open]` | fundo a 20% | **só react e angular** — vanilla, vue e svelte escrevem `data-state="open"`, que a folha só lê para o chevron |
| Página atual | `[aria-current="page"]` ou `[data-active]` | fundo a 20%, semibold, texto `--accent-foreground` | sim, `Active` das cinco |
| Destaque do destino | `-child:hover`/`:focus` | fundo a 10%, descrição a 85% de `--accent-foreground` | sim, pelo Tab da `WithHighlightedCard` nas cinco; a cor da descrição não é medida |
| Desabilitado | `-trigger:disabled` | opacidade 0.5, sem ponteiro | **não** — nenhuma story nem docs page desabilita um gatilho |
| Entrada e saída do popup | `[data-starting-style]`, `[data-ending-style]` | escala 0.9 e opacidade 0 | react e angular (as duas libs escrevem os atributos); nenhuma story mede |
| Posicionador instantâneo | `[data-instant]` | transição desligada | react e angular, pela lib; sem medição |
| Vertical | `[data-orientation="vertical"]` na raiz | coluna; painel do vanilla ao lado | sim, `Vertical` das cinco — com painel só em vanilla, react e angular |
| Movimento reduzido | preferência do sistema | `transition: none` | sim — bloco da folha e escada de `motion.css` |

**Fechamento por saída do ponteiro não é estado da folha, mas é comportamento que
diverge**: as quatro libs fecham quando o ponteiro sai da barra e do painel
(base-ui e radix-ng depois de `closeDelay`; reka e bits pelos manipuladores de
saída do gatilho e do conteúdo). O vanilla não: o `pointerleave` do item só cancela
a abertura pendente (`navigation-menu.ts:358-361`), e o painel aberto por ponteiro
fica aberto até clique fora, Escape, clique no gatilho ou escolha de destino.

**A tabela de estados publicada tem três linhas** (`states.closed`, `open`,
`active`), e duas afirmações delas não valem nas cinco: `states.open.trigger` diz
"Hover ou foco no gatilho" (o foco não abre no vanilla), e `states.open.behavior`
diz `data-state="open"` (react e angular não escrevem esse atributo no gatilho).

## 7. API

O conjunto de opções que existe nas cinco, com o nome que cada uma usa:

| conceito | vanilla | react | vue | svelte | angular |
|---|---|---|---|---|---|
| painel aberto (controlado) | `value` + `setValue()`/`getValue()` | `value` | `v-model` / `modelValue` | `bind:value` | `[(value)]` |
| painel inicial | `defaultValue` | `defaultValue` | `default-value` | — (a raiz usa `value` vinculável com `""` de partida) | `defaultValue` |
| aviso de mudança | `onValueChange` | `onValueChange` | `@update:modelValue` | `bind:value` ou `onValueChange` | `(valueChange)`, `(onValueChange)`, `(onOpenChange)` |
| orientação | `orientation` | `orientation` | `orientation` | `orientation` | `orientation` |
| espera | `delayDuration` | `delay` | `delay-duration` | `delayDuration` | `delay` |
| segundo tempo | `skipDelayDuration` | `closeDelay` | `skip-delay-duration` | `skipDelayDuration` | `closeDelay` |
| nome do landmark | `'aria-label'`, padrão `Navegação principal` | atributo, sem padrão | atributo, sem padrão | atributo, sem padrão | atributo, **sem padrão por decisão** escrita (`navigation-menu.ts:156-163`) |
| identidade do item | `value`, com o rótulo de fallback | `value` no item | `value` no item | `value` no item | `value` no item |
| página atual | `active` no item | `active` no link | `active` no link | `active` no link | `active` no link |
| indicador | — | `indicator` na raiz, padrão `false` | peça `NavigationMenuIndicator` composta na lista | peça `NavigationMenuIndicator` composta na lista | `indicator` na raiz, padrão `false` |
| viewport | — | sempre, dentro da raiz | `viewport`, padrão `true` | `viewport`, padrão `true` | sempre, dentro da raiz |
| alinhamento do painel | — | `align`, padrão `start` | — | — | `align`, padrão `start`, e `sideOffset`, padrão 8 |
| limpeza | `destroy()` | — | — | — | — |

### Divergências de framework, registradas

| stack | como difere |
|---|---|
| vanilla | a barra inteira é DADO: `createNavigationMenu(items, options)` recebe a árvore e monta lista, gatilhos, painéis e destinos. Não há subpeça pública — quem quer duas colunas mexe no painel devolvido (`MegaMenuGrid` e `WithHighlightedCard` acrescentam `nds-grid` e reagrupam os `-child` depois da fábrica). String entra por `textContent`. Registra `click` e `keydown` em `document`, removidos em `destroy()` |
| react | composição do base-ui: a raiz renderiza o `NavigationMenuPositioner` sozinha, então quem compõe não escreve portal nem viewport. O posicionador não é peça que se usa solta, embora seja exportado. `render` para trocar o elemento |
| vue | composição da reka, com o viewport montado pela raiz (`viewport`, padrão `true`). A lista reimplementa o foco por setas e Home/End (`NavigationMenuList.vue:26-60`) porque a reka não traz foco itinerante entre os gatilhos — o comentário registra que ela só trata a entrada no painel aberto |
| svelte | composição do bits; a raiz declara `value` vinculável (`navigation-menu.svelte:8-13`) para ele não cair no espalhamento como valor controlado e prender o painel aberto. O índice reexporta formas curtas (`Root`, `Trigger`…) ao lado das longas |
| angular | diretivas de atributo: `nav[ndsNavigationMenu]` é o host da raiz, para o `aria-label` morar no elemento que o exige. O miolo do painel é `ng-template[ndsNavigationMenuContent]`, instanciado pelo viewport compartilhado — elemento projetado não serviria, porque fechar o painel removeria o nó sem destruir as diretivas (`navigation-menu.ts:77-92`). `[ndsNavigationMenuPanel]` é a raiz VISUAL que o viewport mede, e é nela que mora o padding. `data-slot` por host binding, que apaga o atributo estático |

### Peças, por stack

| stack | peças |
|---|---|
| vanilla | `createNavigationMenu`; tipos `NavigationMenuItem`, `NavigationMenuChild`, `NavigationMenuOptions`, `NavigationMenuOrientation`, `NavigationMenuElement` |
| react | `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`, `NavigationMenuChild`, `NavigationMenuIndicator`, `NavigationMenuPositioner`, `navigationMenuTriggerStyle` |
| vue | `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`, `NavigationMenuChild`, `NavigationMenuIndicator`, `NavigationMenuViewport`, `navigationMenuTriggerStyle` |
| svelte | `Root`/`NavigationMenuRoot`, `List`, `Item`, `Trigger`, `Content`, `Link`, `Child`, `Indicator`, `Viewport` (com as formas longas), `navigationMenuTriggerStyle` |
| angular | `nav[ndsNavigationMenu]`, `ul[ndsNavigationMenuList]`, `li[ndsNavigationMenuItem]`, `button[ndsNavigationMenuTrigger]`, `ng-template[ndsNavigationMenuContent]`, `[ndsNavigationMenuPanel]`, `a[ndsNavigationMenuLink]`, `a[ndsNavigationMenuChild]`, `div[ndsNavigationMenuChildLabel]`, `p[ndsNavigationMenuChildDescription]`; o chevron `svg[ndsNavigationMenuChevron]` é exportado só por exigência do compilador (NG3004) e não entra em `NDS_NAVIGATION_MENU` |

**O React não exporta `NavigationMenuViewport`**, e o `anatomy.structureCode` de
react, vue e svelte termina com `<NavigationMenuViewport />` depois da lista. No
react a peça não existe; no vue e no svelte a raiz já monta um viewport por padrão,
e o snippet copiado produziria dois.

### Inconsistências entre stacks, medidas em 2026-09-17

Nenhuma delas é vista por portão como inconsistência entre stacks — o auditor
toca algumas pela borda, e isso está dito na linha.

1. **Nome acessível padrão.** vanilla escreve `Navegação principal` quando a opção
   falta; react, vue, svelte e angular não escrevem nada, e o angular recusa por
   escrito (duas barras nasceriam homônimas, `landmark-unique`). 4 de 5 sem padrão —
   a referência é a minoria.
2. **Fechamento por saída do ponteiro.** As quatro libs fecham; o vanilla não (§6).
   4 de 5 fecham — a referência é a minoria.
3. **Foco itinerante na barra.** angular: um ponto de tabulação na barra
   (`RdxCompositeItem` escreve `tabindex`); vanilla e vue: todo item é ponto de
   tabulação (nenhum `tabindex` escrito; a reka não traz foco itinerante, segundo o
   próprio `NavigationMenuList.vue`). react e svelte não medidos nesta escrita.
   O conteúdo (`accessibility.keyboard.tab`: "entra/sai do menu; foca o primeiro
   Trigger/Link") descreve o itinerante.
4. **Alvo de `aria-controls`.** vanilla: o painel DAQUELE item (`nav-menu-content-N-i`);
   react e angular: o popup COMPARTILHADO (as plays comparam com `popup.id`); vue e
   svelte: um elemento que existe, sem dizer qual (`getElementById` não nulo). 1 × 2 × 2.
5. **Enter leva o foco ao primeiro destino.** vanilla faz (`navigation-menu.ts:373-378`)
   e não afirma; angular faz e afirma; react, vue e svelte não afirmam e não foram
   medidos. Só 1 de 5 afirma.
6. **Fundo do gatilho aberto.** react e angular a 20% (a folha lê
   `data-popup-open`/`data-open`); vanilla, vue e svelte ficam sem destaque de
   aberto além do chevron. 2 de 5 pintam — a referência não.
7. **Painel da barra vertical.** vanilla e angular afirmam que abre ao lado; react
   tem gatilho na `Vertical` e não afirma o lado; vue e svelte montam a `Vertical`
   só com links e não têm regra de folha para o painel vertical (D4). 2 de 5 medem.
8. **Classe da lista vertical.** vanilla e angular TROCAM a classe no primitivo
   (`nds-stack nds-list-none`, e o vanilla ainda `nds-w-full`) e escrevem
   `data-spacing="xs"`; react, vue e svelte mantêm `nds-navigation-menu-list` e
   quem compõe acrescenta `nds-stack nds-w-sm` e o espaçamento. 2 × 3 — e dentro dos
   dois, `nds-w-full` só no vanilla.
9. **Onde mora o `data-slot` do item.** vanilla no `<div>` interno; as quatro com lib
   no `<li>`. 4 de 5.
10. **Rótulo do gatilho.** vanilla e angular envolvem o texto num `<span>`; react
    deixa texto + espaço literal + ícone; vue e svelte, slot + ícone. 2 × 1 × 2.
11. **Indicador.** vanilla não tem (não aplicável declarado); react o põe no
    posicionador, irmão do popup, com `aria-hidden` e o losango interno; vue e svelte
    o compõem na lista com o losango, e o bits não escreve `aria-hidden` na peça;
    angular o põe DENTRO do popup, com `aria-hidden` da lib e **sem** o
    `.nds-navigation-menu-indicator-arrow` — a classe de fora não tem fundo, então o
    losango não é desenhado. A play do angular afirma presença e `aria-hidden`, não o
    desenho. As de vue e svelte afirmam o losango; a do react, não.
12. **Onde o indicador é ligado.** react, svelte e angular têm `indicator` como
    opção (arg do Playground em svelte e angular); vue só por composição, e o
    Playground do vue não o expõe. 3 × 1 (+ vanilla sem).
13. **Resíduo `group` no gatilho.** vue e svelte acrescentam a classe `group`
    (`NavigationMenuTrigger.vue:25`, `navigation-menu-trigger.svelte:25`), sem regra
    em folha nenhuma do projeto. 2 de 5.
14. **Modo controlado afirmado.** vanilla (`ControlledValue`), react e angular
    (espião de `onValueChange`); vue e svelte não. 3 de 5.
15. **`destroy()` e prova de limpeza.** só vanilla — é a única stack que registra
    ouvinte em `document` à mão. Mecânica de stack, registrada, não alinhável.
16. **Esperas e seus nomes** (D12). `delayDuration`/`skipDelayDuration` com 200/300
    em vanilla, vue e svelte; `delay`/`closeDelay` com 50/50 em react e angular.
    API de lib — mas a docs page do react publica os nomes que a stack não tem.
17. **Espera usada nas stories.** 100ms em vanilla, react, vue e svelte; 50ms no
    angular. As docs pages de vue e svelte usam 80.
18. **Snippet que omite a espera.** o `navigation-menu.source.ts` do svelte trata
    100 como padrão (`delayDuration === 100 ? ''`), e o padrão do bits é 200 — o
    snippet copiado de uma story com 100 abre em 200. vue e vanilla comparam contra
    200, react contra 50 (os padrões reais das libs delas). 1 de 5 diverge.
19. **Construtores de snippet.** vanilla 9, vue 10, react 7, svelte 1, angular 1;
    teste do snippet em vanilla, vue e svelte, e NÃO em react e angular
    (`source_sem_teste`). As 9 stories do angular publicam o template no painel Code
    (`story_file_sem_transform`, 3 arquivos).
20. **Snippet de extensibilidade do angular.** a variante `angular` de
    `props.extensibilityCode` ensina `[delayDuration]`, `[skipDelayDuration]` e
    `<div ndsNavigationMenuViewport>`, que não existem na stack; a docs page
    contorna com a constante local `EXTENSIBILITY_CODE` (`NavigationMenuDocs.ts:261-265`)
    — o snippet ficou preso numa stack, que é a forma que o CLAUDE.md proíbe.
21. **Evento de analytics** (§9). angular dispara `navigation_click` na
    demonstração; as outras quatro não disparam nada e publicam `nav_menu_open` e
    `nav_link_click`, que stack nenhuma tipa. 1 × 4.
22. **Tabela de props da docs page.** vanilla, vue e svelte publicam as esperas com os
    nomes da stack; react publica nomes que não existem nela; angular sobrescreve
    com `delay`, `closeDelay` e `indicator`. vue publica o aviso como
    `@update:value`, e o `v-model` da reka é `modelValue`.
23. **Rótulos da demonstração.** react e angular leem os quatro
    `demonstration.labels.*`; vue lê três e não usa `withFeatured`
    (`demonstration_labels_divergent`); svelte e vanilla não leem a chave.
24. **Do & Don't.** vue e svelte instanciam o componente nos quatro previews;
    vanilla imita em 1 de 4, react em 4 de 4 (`dodont_preview_sem_componente`); a
    mensagem da regra não cita o angular, e ele não foi medido à mão.
25. **Valor de design em `style` inline.** docs pages de react (9 valores), vue (14),
    svelte (9) e vanilla (5); stories de react (5 em 4 arquivos) e vanilla (1);
    angular nenhum (`inline_style_design_value`). O gradiente do card destacado só
    existe nas docs pages, em `style` inline, e em nenhuma story.
26. **Identificador em português.** `estilo` nas fixtures de vue e svelte
    (`identificador_pt`).

## 8. Acessibilidade

**Atributos que as cinco escrevem**: `<nav>` com `aria-label` (padrão só no
vanilla, item 1); `aria-expanded` no gatilho; `aria-controls` no gatilho (alvos
diferentes, item 4); `aria-current="page"` no destino ativo; `aria-hidden` no
chevron. **Nenhuma escreve `role`**: o papel de navegação é o implícito do `<nav>`.
O conteúdo diz "`NavigationMenu` recebe `role="navigation"`"
(`accessibility.items.item1`, `anatomy.item1`, `accessibility.aria.navigation`) —
o papel existe, pelo elemento, não por atributo.

**Teclado, na referência** (`navigation-menu.ts:244-394`):

| tecla | onde | efeito |
|---|---|---|
| Seta do eixo | item da barra | foco no vizinho, com volta nas pontas |
| Home · End | item da barra | primeiro · último item da barra |
| Enter · Espaço | gatilho | abre (ou mantém aberto) e leva o foco ao primeiro destino. Enter não fecha: o `preventDefault` no `keydown` suprime o clique nativo que alternaria |
| Seta para baixo | gatilho aberto, barra horizontal | foco no primeiro destino |
| Seta para cima · baixo | dentro do painel | destino anterior · seguinte, com volta |
| Escape | gatilho, painel ou documento | fecha e devolve o foco ao gatilho |
| Tab | qualquer ponto | ordem nativa: atravessa os destinos do painel aberto e sai; **o painel não fecha quando o foco sai dele** |

**O que diverge disso nas libs e é registrado, não medido a fundo**: o radix-ng
declara seta-para-cima no primeiro destino devolvendo o foco ao gatilho e Tab
saindo do painel portalizado pela ordem lógica da barra (`angular/navigation-menu.ts:68-71`),
e fecha por foco fora; o base-ui fecha no `blur` de um link quando o foco sai do
menu (`NavigationMenuLink.js`, `onBlur`). O vanilla não tem ouvinte de `blur` nem de
`focusout`.

**Foco não abre o painel no vanilla.** A abertura é por clique, Enter/Espaço ou
ponteiro de MOUSE (`pointerType !== 'mouse'` retorna, `navigation-menu.ts:347`).
`accessibility.items.item6` e `states.open.trigger` prometem abertura por foco.

**O que deliberadamente NÃO se faz**:

- nenhum papel de menu, nenhum `aria-haspopup` (D1);
- o destino não recebe `tabindex="-1"` — todos ficam na ordem de foco, e as plays
  das cinco afirmam isso (C6, C16);
- a descrição do destino não recebe `aria-hidden`: ela é parte do nome acessível
  (C13). A guideline do angular diz o contrário — "o nome acessível do link é o
  rótulo, não a descrição inteira" (`05-navigation-components.md:227`) — e o
  primitivo e a story da mesma stack contradizem a guideline;
- o painel não é modal, não trava rolagem e não prende foco. As invariantes de
  modalidade e de véu de `18-overlay.md` não se aplicam, e a guideline de overlay
  não lista este componente na categoria (§11);
- a página atual não depende só de cor para quem vê: há peso semibold junto do
  fundo, e o atributo para quem ouve (D5).

**Em superfície de accent, o texto é `--accent-foreground`** (D6) — a regra da casa
para containers coloridos, aplicada a uma peça que não é container de feedback.

## 9. Analytics

| evento | quem dispara hoje | payload |
|---|---|---|
| `docs_page_view` | as cinco docs pages | `{ component_name: "navigation-menu", locale, page_title }` |
| `docs_section_viewed` | as cinco docs pages | `{ section_id, component_name: "navigation-menu", locale }` |
| `navigation_click` | **só a docs page do angular**, nos destinos da demonstração (`NavigationMenuDocs.ts:933-940`) | `{ component: "navigation-menu", label, destination, location }` — `label` é o id do destino, nunca o texto |

**O componente não dispara nada.** Nenhum dos cinco primitivos importa `track`.

**Três vocabulários para o mesmo clique**, medidos em 2026-09-17:

- **o tipo** — `navigation_click` existe nas cinco `analytics.ts`, com
  `component: 'breadcrumb' | 'navigation-menu' | 'sidebar'`, `label`,
  `destination` e `location` opcional. É o evento de
  `docs/shared/guidelines/07-analytics.md` §"Breadcrumb / Navigation Menu" e o da
  tabela transversal das guidelines de react e vue;
- **o conteúdo compartilhado** — `analytics.description` publica `nav_menu_open` e
  `nav_link_click` com `label` "texto do Trigger/Link" e `destination`. Nenhuma das
  cinco `analytics.ts` tipa os dois (`event_not_typed`, 10 achados) — e o `label`
  como TEXTO é a forma que a regra da casa proíbe, porque parte o evento em três
  no GA4;
- **as tabelas das docs pages** — react, vue, svelte e vanilla renderizam
  `nav_menu_open` e `nav_link_click` (o vanilla com `location` no primeiro, os
  outros sem); angular renderiza `navigation_click` e é a única que dispara.

**O `location` do angular está fora do vocabulário**: `docs-demonstration` não é
`docs_<section-id>` (`location_fora_do_vocabulario`). O snippet de extensibilidade
da mesma página ensina `location: 'header'`.

**Sem evento de abertura tipado.** Nenhuma stack tipa abertura ou fechamento do
painel; por isso também não há `reason` a cobrar, e a invariante de `reason` de
`18-overlay.md` não alcança este componente.

## 10. Reconstruir do zero

Ordem: folha → primitivo → stories → docs page. Na folha, **comece pelo docblock
certo** — o atual ensina menubar e menu (D1).

- **`<nav>` + `<ul>` + `<li>`, e o destino é `<a href>`.** Nenhum `role`. O
  gatilho é `<button type="button">` com `aria-expanded` e `aria-controls`.
- **Duas peças de destino**: `-link` na barra, `-child` no painel (D2). Juntar as
  duas devolve o painel de mega-menu a uma pílula que não quebra linha.
- **Quem pinta accent declara o texto** (D6), e o anel é interno em
  `--accent-foreground` (D7).
- **Página atual lê `aria-current`** e aceita `data-active` junto (D5). Não
  reproduza o filtro `data-active="false"` como se alguma lib o exigisse.
- **Escolher destino fecha sem olhar `defaultPrevented`** (D3).
- **Vertical abre ao lado**, derivado da orientação (D4) — e, se a stack usa
  viewport de lib, a regra vertical do invólucro ainda não existe na folha.
- **Nada de `height`** nos itens (D11).
- **Armadilha por stack**:
  - vanilla — dois ouvintes em `document` exigem `destroy()`; a guarda
    `nav.isConnected` só cobre a janela até o observador varrer
    (`navigation-menu.ts:404-415`). O painel é filho do item, então o
    `position: relative` do `.nds-navigation-menu-item` é o que o ancora;
  - react — as esperas se chamam `delay`/`closeDelay` (D12); `closeOnClick` nasce
    desligado no base-ui; o `Popup` renderiza `<nav>` por padrão e precisa de
    `render={<div />}`, senão dois painéis abertos colidem em `landmark-unique`
    (`navigation-menu.tsx:141-145`);
  - vue — a reka não traz foco por setas entre os gatilhos, e a lista precisa
    implementar (`NavigationMenuList.vue`); o viewport já vem da raiz;
  - svelte — `value` tem de ser declarado e religado com `bind:`, e o fechamento do
    `-child` precisa da ponte depois do `onclick` de quem consome; o degrau do bits
    soma `1rem` na folha, o da reka não;
  - angular — o miolo é `ng-template`, e o padding mora na primeira peça que o
    viewport mede (`[ndsNavigationMenuPanel]`), não no popup; `data-slot` por host
    binding apaga o estático; o indicador precisa do losango interno para aparecer
    (item 11).

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, estados, os três vocabulários de painel | `docs/shared/styles/nds/navigation-menu.css` |
| texto, props, tokens, critérios de teste | `docs/shared/content/navigation-menu/translations.json` (243 chaves × 3 idiomas) |
| comportamento de referência | `nortear-design-system-vanilla/src/components/ui/navigation-menu.ts` |
| evento e payload | `docs/shared/guidelines/07-analytics.md` §Breadcrumb / Navigation Menu + `src/lib/analytics.ts` das cinco |
| degrau de elevação | `docs/shared/guidelines/04-padroes-design-sistema.md` §Qual degrau |
| exceção da cadeia de origem | `CADEIA_ORIGEM_SEM_BITS` em `scripts/audit.mjs` (D9) |
| portões determinísticos | `node scripts/audit.mjs navigation-menu --json` |
| instrumento de tokens | `node scripts/tabela-tokens.mjs navigation-menu` |

**Não há link de Figma**: `docs/shared/figma/design-links.ts` não tem entrada para
navigation-menu, o arquivo do Figma não tem página do componente, e nenhuma das
cinco stacks declara `design:` nas stories dele (conferido em 2026-09-17).

**Nenhuma folha de stack declara regra sobre `.nds-navigation-menu*`** — a busca
por `.css` dentro dos cinco `src/` devolve zero.

### A guideline de overlay trata do componente pela borda, e é o certo

`18-overlay.md` delimita a categoria em dez componentes e **não inclui** o
NavigationMenu (linhas 3-5). Ele aparece em dois lugares, os dois corretos contra o
código: na tabela de camadas, como consumidor de `--z-popover` "fora desta
categoria" (125); e na tabela de invariantes, na linha da cadeia de
`transform-origin` ("`navigation-menu` fica de fora, declarado") e na do anel de
foco ("achou o navigation-menu sem anel em três peças, corrigido junto").

**O que ele deveria obedecer, por ter painel flutuante**: camada (`--z-popover`,
cumpre), degrau por tipo de superfície (`md`, cumpre), anel de foco (cumpre, D7),
guarda de movimento reduzido (cumpre, §5), e a cadeia de origem (exceção declarada,
premissa válida, D9). **O que não se aplica**, por ser não modal e não ter título,
véu, corpo que rola, formulário nem evento de fechamento: modalidade, véu, nível de
título, `reason`, rodapé. A invariante de foco que volta ao gatilho se aplica ao
Escape (C7) e é afirmada nas cinco — ela não é portão de audit em nenhum overlay.

### O `audit.mjs` NÃO está verde

Medido em 2026-09-17, ANTES deste arquivo existir:
`node scripts/audit.mjs navigation-menu --json` devolve **38 achados**.

| regra | severidade | stacks | o que diz |
|---|---|---|---|
| `event_not_typed` | medium | as cinco (2 cada, 10) | `nav_menu_open` e `nav_link_click` publicados no conteúdo sem tipo (§9) |
| `inline_style_design_value` | high · medium | react 5, vue 1, svelte 1, vanilla 2 (9) | docs pages de react, vue, svelte e vanilla (4, high); quatro arquivos de story do react e o Playground do vanilla (5, medium) — item 25 |
| `snippet_sem_lastro` | high · medium | react 6, vue 1, svelte 1 (8) | (4 high) quatro classes com forma de Tailwind no `anatomy.structureCode` do react (`grid`, `w-[400px]`, `gap-3`, `p-4`); `delayDuration` e `skipDelayDuration` no snippet de extensibilidade do react; `skip-delay-duration` no do vue e `skipDelayDuration` no do svelte, sem story que os exercite |
| `story_file_sem_transform` | medium | angular (3) | os três arquivos de story publicam o template (item 19) |
| `source_sem_teste` | medium | react, angular (2) | item 19 |
| `dodont_preview_sem_componente` | medium | react, vanilla (2) | item 24 |
| `identificador_pt` | low | vue, svelte (2) | item 26 |
| `demonstration_labels_divergent` | medium | vue (1) | item 23 |
| `location_fora_do_vocabulario` | medium | angular (1) | §9 |

> **PENDÊNCIA · 2026-09-17** — os 38 achados acima estão abertos; 8 são de
> severidade alta: quatro `inline_style_design_value` (as docs pages de react,
> vue, svelte e vanilla) e quatro `snippet_sem_lastro` que ensinam classe de
> Tailwind a quem copia a anatomia do react.
> **Fecha quando**: `node scripts/audit.mjs navigation-menu --json` devolver lista
> vazia.

> **PENDÊNCIA · 2026-09-17** — três vocabulários de analytics para o mesmo clique:
> o tipo e a guideline de analytics dizem `navigation_click`, o conteúdo
> compartilhado e quatro docs pages dizem outros dois nomes que ninguém tipa, e só
> o angular dispara (§9).
> **Fecha quando**: a dona escolher o evento, e `event_not_typed` e
> `location_fora_do_vocabulario` não reportarem navigation-menu.

**Com este arquivo escrito, a contagem é 42**, medida logo depois de salvá-lo: os
38 de cima mais quatro `catalogo_duplicado_com_prd` — um por stack que tem a seção
(react, vue, svelte e angular). O título que o portão procura é derivado do slug
(`Navigation Menu` e `NavigationMenu`), e as quatro seções usam `## Navigation Menu`,
que casa. `prd_token_sem_lastro` não reporta nenhum token da §5, e nenhuma pendência
cai em `prd_pendencia_ja_fechada`.

### O catálogo em guideline existe em QUATRO stacks, e a referência não tem

`## Navigation Menu` está em `05-navigation-components.md` de react (linha 104),
vue (109), svelte (55) e angular (187). **O vanilla não tem seção** — a
`05-navigation-components.md` dele cobre Breadcrumb, Tabs, Stepper e a mecânica de
Pagination, e nenhum outro arquivo da pasta menciona o componente. É o inverso do
que a regra "vanilla é a referência" pediria: as três stacks cujo markup vem de lib
documentam o componente, e a stack que define o markup não.

As quatro cópias divergem entre si e do código, medido em 2026-09-17:

- **react e vue mandam envolver o componente num `<nav aria-label>`**, e desenham a
  árvore com `NavigationMenu` DENTRO desse `<nav>` — a raiz já É `<nav>` nas cinco,
  e seguir a guideline produz dois landmarks aninhados;
- **react e vue dizem que "o componente aplica `role="navigation"`"** — nenhuma
  stack escreve o atributo (§8);
- **a guideline do vue aponta `navigation-menu/navigation-menu.vue`**, arquivo que
  não existe — o primitivo é `NavigationMenu.vue`;
- **a transversal de react e vue manda `.nds-focus-ring` com `--ring`** em todo
  elemento de navegação, e este componente desenha o anel interno em
  `--accent-foreground` (D7);
- **a do angular diz que o nome acessível do destino é só o rótulo**, contra o
  primitivo e a story da própria stack (§8);
- **a do svelte tem dezenove linhas**: propósito e uma árvore que põe
  `NavigationMenuLink` dentro do conteúdo, onde a peça é o `-child`;
- **react e vue nomeiam `navigation_click`**, o mesmo evento que o tipo, e o
  conteúdo compartilhado nomeia outros dois (§9).

> **FECHADA · 2026-09-17** — quatro `05-navigation-components.md` tinham seção
> `## Navigation Menu` e passou a haver PRD; o vanilla, que é a referência, não
> tinha. As cópias erravam o landmark aninhado, o papel explícito, o anel e o nome
> acessível do destino.
> **Fecha quando**: `catalogo_duplicado_com_prd` não reportar navigation-menu — as
> seções saem, a mecânica própria de cada stack (o `ng-template` do angular, a
> fábrica de dados do vanilla) fica no arquivo da stack, e a regra da categoria vai
> para a guideline compartilhada de navegação, que ainda não existe.
> **Como fechou (2026-09-17)**: as quatro seções viraram mecânica de stack com
> ponteiro para este PRD, e a regra da categoria foi para
> `docs/shared/guidelines/21-navegacao.md`, que nasceu no mesmo dia. O vanilla
> continua sem seção deste componente: a fábrica existe e não foi documentada
> nesta rodada, para não escrever conteúdo novo sem revisão.

### Afirmações do conteúdo compartilhado que o código contradiz

Não são decisões: são frases do dicionário que descrevem outra coisa que não o
código. A revisão decide, frase a frase, se corrige o texto ou o código.

1. `states.active.behavior` — "`--accent` a 50% [...] opacidade total no hover e no
   foco"; a folha diz 20% e 10% (D10). Nos três idiomas.
2. `states.open.trigger` — "Hover ou foco"; foco não abre no vanilla (§8).
3. `states.open.behavior` — `data-state="open"`; react e angular não escrevem esse
   atributo no gatilho (§6).
4. `notes.item1` — "papéis ARIA do menu"; não há papel de menu (D1).
5. `notes.item2` — "o NavigationMenu usa um único Viewport"; o vanilla tem um painel
   por item e nenhum viewport (D8).
6. `notes.item4` — manda `className="grid w-[600px] grid-cols-2 gap-3 p-4"`: sintaxe
   de Tailwind, fora do projeto.
7. `usage.guidelines.item5` — `NavigationMenuLink` no conteúdo "para herdar [...]
   tracking automático"; a peça do painel é `-child`, e nenhum primitivo rastreia (D2).
8. `anatomy.structureCode` de react, vue e svelte — `<NavigationMenuViewport />`
   solto (§7) e `NavigationMenuLink` no painel.
9. `props.extensibilityCode` de react e angular — nomes de espera que as duas stacks
   não têm (D12, item 20).
10. `tokens.customizationCode` — estiliza por `[data-slot]` e por
    `[data-state='open']` no gatilho; react e angular não escrevem `data-state` ali,
    e no angular o `data-slot` é disputado por host binding.
11. `variants.items.comCardDestacado.description` — "card hero [...] com gradiente";
    nenhuma story e nenhum snippet tem gradiente, só as docs pages em `style` inline.
12. `tokens.table.triggerHover.part` — "com o painel aberto"; vale em 2 de 5 (item 6).

> **PENDÊNCIA · 2026-09-17** — o docblock de `navigation-menu.css` (5-23) ensina
> `role="menubar"`, `role="menu"` e `aria-haspopup="true"`, que a referência recusa
> por escrito, e o comentário das linhas 246-251 diz que o accent "entra inteiro"
> sobre uma declaração a 20%.
> **Fecha quando**: o docblock descrever o markup do vanilla (divulgação, sem papel
> de menu) e o comentário do destaque da página atual descrever o alfa que a regra
> declara.
