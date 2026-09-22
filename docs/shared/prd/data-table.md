# PRD — DataTable

> **Estado descrito**: 2026-09-16, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código vai usar este documento como base:
> o que está aqui foi medido nas cinco stacks, na folha compartilhada e no
> conteúdo, e as divergências entre stacks estão registradas em vez de resolvidas.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
>
> **Este é o primeiro PRD da categoria Tabelas** (Table, DataTable, Pagination) e
> o maior componente do design system: 1257 linhas no Vanilla, 1102 no React,
> 1041 no Angular, 1025 no Vue, 716 no Svelte mais cinco módulos próprios, e uma
> folha compartilhada de 397 linhas.
>
> **Aviso sobre o portão**: ao contrário do que a ordem desta escrita supunha,
> `node scripts/audit.mjs data-table --json` **não devolve 0 achados** — devolve
> **18**, com código de saída 1 (medido em 2026-09-16). A lista está na §11. Nada
> do que está numerado na §7 é visto por portão nenhum; os 18 achados são um
> conjunto **diferente** e menor.

## 1. Identidade

Grade de dados **exploráveis**: o componente que existe para a pessoa ordenar,
buscar, filtrar, esconder coluna, marcar linha, paginar e editar célula sem sair
da tabela. Ele não desenha tabela nenhuma por conta própria — veste o primitivo
`Table` do design system e acrescenta barra de ferramentas, linha de filtros,
rodapé de paginação e a região viva que anuncia a contagem.

**O vizinho que decide é o Table, e o critério é INTERAÇÃO, não tamanho.** Está
escrito nas guidelines de react e vue com essas palavras ("Use `Table` quando os
dados são estáticos e cabem na tela. Use `DataTable` quando o usuário precisa
explorar, filtrar ou editar") e no conteúdo compartilhado, em
`usage.scenarios.item2` — "Tabela simples sem interação → Não → Table".

| vizinho | diferença que decide |
|---|---|
| **Table** | é a camada semântica, e o DataTable a CONSOME (`.nds-table`, `.nds-table-wrapper`, `<th scope="col">`). Table não tem estado: nada nele ordena, filtra, marca ou pagina. Escolhe-se Table quando a leitura basta — e a troca não é de aparência, porque as duas desenham a mesma grade |
| **Pagination** | é o componente de navegação numerada (`.nds-pagination`, `<nav>` com `<ul>` e `aria-current="page"`). O rodapé do DataTable **não é ele**: as cinco stacks montam a navegação com quatro Buttons de ícone e classes `.nds-data-table-pagination-*`. São duas paginações no sistema, com markup e semântica diferentes (ver a pendência da §11) |
| **Chart** | comparação visual de tendência; o DataTable é detalhe linha a linha (`usage.scenarios.item4`) |
| lista de Card | leitura vertical densa em telas estreitas (`usage.scenarios.item6`, `usage.dont.item3`) |

**O componente é passivo em relação aos dados.** Ele nunca muta o array que
recebe: a edição em célula AVISA e quem consome atualiza a fonte. Isso está
escrito nos cinco primitivos e nas cinco guidelines, e é o que faz `data` poder
vir de um recorte de servidor.

**E é o único componente do sistema que não é o mesmo componente nas cinco
stacks.** Quatro rodam um motor de tabela externo; uma reimplementa o motor à
mão, e quatro recursos simplesmente não existem nela. A §3 (D1) mede isso, e a
§7 registra o tamanho da consequência.

## 2. Contrato de comportamento

Cada linha aponta a chave de `docs/shared/content/data-table/translations.json`
que a publica e a story que a mede. O conteúdo tem 313 folhas em pt-BR, nos três
idiomas, com 9 itens em `testes.functional`, 6 em `testes.accessibility` e 6 em
`testes.visual` (medido em 2026-09-16).

| # | o contrato | chave · onde é medido |
|---|---|---|
| C1 | A raiz é um `<div>` com `data-slot="data-table"` e classe `.nds-data-table` | — · passo "É uma tabela de verdade" do Playground das cinco |
| C2 | A grade é `<table>` semântica do primitivo Table, com `data-slot` em `table`, `table-header` e `table-body`, e `<th scope="col">` | `testes.accessibility.item1` · Playground das cinco |
| C3 | O nome acessível da tabela é uma `<caption>` fora da tela, PRIMEIRO filho de `<table>`, medida pela caixa computada (≤ 2px) e não pela classe | `testes.accessibility.item6` · Playground das cinco — e nenhuma docs page o exercita, salvo o angular (§7, item 17) |
| C4 | Exatamente UMA camada rola na horizontal, e ela está na ordem de tabulação: o `.nds-table-wrapper` do primitivo, com `tabindex="0"`. A moldura `.nds-data-table-scroll` fica em `overflow-x: visible` e `tabIndex -1` | `testes.accessibility.item5` · Playground das cinco, por `measureScroll` de `docs/shared/testing/data-table-probe.ts` |
| C5 | Coluna ordenável anuncia `aria-sort` no `<th>` com `none` explícito sem ordem aplicada; coluna não ordenável **não** emite o atributo | `testes.accessibility.item2` · Playground das cinco (o angular ainda afirma a ausência num `th` nomeado) |
| C6 | Ordenar percorre três estados — ascendente, descendente, nenhum — e o PRIMEIRO clique é ascendente em qualquer coluna, inclusive numérica | `testes.functional.item3` · Playground das cinco |
| C7 | A ordenação usa o valor BRUTO, não o texto formatado: dinheiro ordena como número | `testes.functional.item3` · Playground das cinco (asserção pelo identificador da primeira linha) e `Sorted` do angular |
| C8 | O nome do controle de seleção de cada linha é único e carrega o identificador daquela linha; o do cabeçalho difere dos das linhas | `testes.accessibility.item3` · Playground das cinco, com `new Set(names).size === names.length` |
| C9 | O cabeçalho de seleção é tri-state: `aria-checked="mixed"` com página parcial, e do misto o primeiro clique completa e o segundo esvazia | `testes.functional.item4` · Playground das cinco |
| C10 | A contagem de selecionadas sai por região viva (`role="status"`, `aria-live="polite"`, `.nds-sr-only`) que existe mesmo com a paginação desligada, e conta o conjunto FILTRADO, não a página | `testes.functional.item4`, `accessibility.screenReader.onSelect` · Playground das cinco |
| C11 | A marcação pertence à LINHA e não à posição: ordenar não move seleção nem muda a contagem | `testes.functional.item9` · Playground das cinco |
| C12 | A busca livre é `input[type="search"]` (papel `searchbox`), tem nome acessível, e casa em TODA coluna — inclusive nas escondidas pelo menu | `testes.functional.item1` · Playground das cinco; a parte "inclusive nas escondidas" só é medida no angular (`WithColumnVisibility`) |
| C13 | Os filtros por coluna se SOMAM entre si e à busca; todo `<th>` da linha de filtros carrega texto para leitor de tela, inclusive o da coluna sem filtro | `testes.functional.item2` · `WithColumnFilters` das cinco |
| C14 | A célula editável é um `<button>` com nome ("Editar ‹coluna›"); Enter confirma e avisa `(rowIndex, columnId, value)`, Escape descarta **sem** avisar; o campo recebe foco ao abrir | `testes.functional.item5`, `states.editing` · `WithInlineEditing` das cinco |
| C15 | O componente não muta `data` — quem consome atualiza o array a partir do aviso | `notes.tip4`, `props.table.data` · `WithInlineEditing` das cinco, que remonta com o valor novo |
| C16 | O estado vazio é UMA linha com a mensagem, e o `colspan` é derivado das colunas visíveis (mais a de seleção), nunca escrito à mão. A toolbar e o cabeçalho sobrevivem ao vazio | `testes.visual.item6`, `states.empty` · `NoResults` das cinco |
| C17 | A paginação tem quatro botões nomeados (primeira, anterior, próxima, última) e os dois do lado sem saída ficam desabilitados nos extremos; trocar o tamanho da página não deixa ninguém numa página inexistente | `testes.functional.item8` · `Paginated` das cinco |
| C18 | Virtualizar DESLIGA paginar, e as linhas fantasma (`aria-hidden="true"`) reservam a altura do que não está montado | `testes.functional.item7`, `notes.tip5` · `Virtualized1000Rows` de react, vue, svelte e vanilla — **não existe no angular** (D1) |
| C19 | `data-slot` sai em três pontos: `data-table`, `data-table-toolbar` e `data-table-pagination` | — · Playground das cinco (a raiz) |

**Três contratos só têm produtor em parte das stacks**, e não por decisão de
API: C18 (virtualização), mais o redimensionamento e a fixação de coluna, que
não têm linha própria acima porque o angular não os entrega. Ver D1.

## 3. Decisões fixadas

### D1 · Quatro stacks montam a tabela sobre TanStack; o Angular reimplementa o motor em signals

**Estado**, medido em 2026-09-16 nos cinco `package.json` e nos cinco primitivos:

| stack | motor | virtualizador |
|---|---|---|
| react | `@tanstack/react-table` ^9.1.2, por `useTable` | `@tanstack/react-virtual` ^3.14.8 |
| vue | `@tanstack/vue-table` ^9.1.2, por `useTable` | `@tanstack/vue-virtual` ^3.13.34 |
| svelte | `@tanstack/table-core` ^9.1.2, por `constructTable` — **sem adaptador** | `@tanstack/svelte-virtual` ^3.13.34 + `virtual-core` |
| vanilla | `@tanstack/table-core` ^9.1.2, por `constructTable` | `@tanstack/virtual-core` ^3.17.6 |
| angular | **nenhum** — zero dependências `@tanstack` no `package.json` | **nenhum** |

**Motivo registrado no Angular**, no cabeçalho de `nortear-design-system-angular/src/components/ui/data-table.ts`
(linhas 60-91): o Angular 22 é zoneless e signals-first, e o adaptador
`@tanstack/angular-table` publica estado por um `computed` próprio que espera
ciclo de detecção — seria um segundo modelo de reatividade sobreposto ao do
stack. Cada derivação (filtrar → ordenar → paginar) é um `computed` lido direto
pelo template.

**A consequência medida, e é ela que vale**: quatro recursos NÃO existem no
angular — redimensionar coluna, reordenar por arrasto, fixar coluna e
virtualizar. Não há flag para eles. O motivo declarado é o mesmo nos quatro: os
quatro dependem de medida em pixel escrita no próprio elemento (`width: 187px`,
`left` de coluna fixa, altura das linhas fantasma), e CSS inline é proibido no
stack. As outras quatro escrevem exatamente essa medida em `style` — é o
`pinStyle()` e o `width` por `header.getSize()` dos quatro primitivos.

**Onde está escrito**: cabeçalho de `angular/ui/data-table.ts`; a guideline do
angular (`08-display-components.md:96`) declara a lacuna como lacuna; o
`coversNotApplicable` de `angular/ui/data-table.stories.ts:24-29` nomeia os
quatro itens do contrato de teste que não têm story por isso; e a chave de
override `variants.angularScope`, na docs page do angular, diz o mesmo ao leitor
nos três idiomas.

**O que a divergência NÃO é**: divergência de aparência. O DOM que sai dos dois
lados é o mesmo — toolbar, moldura, `<table>` semântica, rodapé — e é ele que a
sonda compartilhada compara.

### D2 · O motor é o TanStack 9, e a folha e quatro guidelines ainda dizem 8

**Estado**: `^9.1.2` nos quatro `package.json`, e os quatro primitivos comentam
"No TanStack 9 os recursos deixam de vir todos ligados". No 9 cada recurso é
REGISTRADO — o bloco `RECURSOS_BASE` é, nas palavras dos próprios arquivos, "a
fonte de verdade sobre o que o DataTable faz" —, o estado de paginação sai de um
ÁTOMO (`table.atoms.pagination?.get()`) e os dois `meta` deixaram de ser
augmentação global de módulo para virar slots de tipo dentro do conjunto.

**Contradição medida**: o docblock de `docs/shared/styles/nds/data-table.css`
(linha 3) diz "tabela avançada sobre TanStack Table v8", e as guidelines de
react, vue, svelte e vanilla também diziam v8 até a migração do catálogo, em
2026-09-17, quando as quatro passaram a dizer 9 — uma delas ainda desaconselhava o adaptador do Svelte por incompatibilidade
com Svelte 5, que é verdade mas por outro caminho (hoje o svelte consome o
`table-core` direto e publica `createRecursos`).

**Por que importa mais que um número**: a migração para o 9 é o que explica os
DOIS conjuntos de recursos (D10) e o átomo de paginação nos três rodapés. Quem
ler "v8" na folha e for procurar `getPaginationRowModel` no código não acha.

### D3 · Uma camada só rola, e é a que o teclado alcança

**Estado**: `.nds-data-table-scroll` é MOLDURA — borda, raio e, no modo
virtualizado, a rolagem VERTICAL, porque é a altura máxima dele que o
virtualizador mede. A rolagem HORIZONTAL é do `.nds-table-wrapper` do primitivo
Table, único dos dois com `tabindex="0"` (medido nos cinco primitivos de Table:
`react/ui/table.tsx:35`, `vue/ui/table/Table.vue:40`, `svelte/ui/table/table.svelte:46`,
`vanilla/ui/table.ts:43`, `angular/ui/table.ts:58`).

**Medição que fixou a decisão**, registrada em três lugares (o comentário da
folha, linhas 120-132; o comentário do vanilla, linhas 398-410; e o docblock da
sonda): havia `overflow-x: auto` nos dois, e portanto dois contêineres roláveis
aninhados. Em duas stacks o interno era neutralizado por uma classe
`.nds-data-table-table-wrapper { overflow: visible }` e sobrava rolando o
EXTERNO — que não está na ordem de tabulação. Quem navega por teclado não
alcançava as colunas fora da tela (WCAG 2.1.1, regra `scrollable-region-focusable`
do axe). A classe de neutralização foi removida junto: sem ela, o dono do
overflow é um só, e é o alcançável.

**Portão**: `measureScroll` mede ESTILO COMPUTADO, nunca presença de classe, e o
contrato ("exatamente uma camada rola, e ela está no tabindex") é afirmado nas
cinco stacks. É o único invariante deste componente com medição compartilhada.

### D4 · A legenda é o nome da tabela, e ela é invisível

**Estado**: `caption` opcional vira `<caption class="nds-sr-only">`, PRIMEIRO
filho de `<table>`.
**Motivo escrito nos cinco primitivos**: a tag só é válida nessa posição — em
qualquer outra o parser de HTML a move ou a descarta, e o nome acessível some
junto. Fora da tela porque quem enxerga já lê o assunto no título da página, e
quem entra pela árvore de acessibilidade encontraria só "tabela, 6 colunas".
**Como é medido**: pela CAIXA COMPUTADA (posição absoluta, largura e altura ≤ 2px)
e pelo nome acessível — afirmar `.nds-sr-only` provaria só que alguém escreveu a
classe.

### D5 · A identidade da linha é do DADO, e o primeiro clique ordena ascendente

**Estado**: `rowKey` opcional alimenta o `getRowId` do motor nas quatro stacks
TanStack e o mapa de chaves no angular. Sem ele a identidade é a POSIÇÃO.
**Medição**: sem `getRowId`, "a terceira linha está marcada" continua verdade
depois de ordenar, apontando para outra fatura — é o que C11 cobra.
**E `sortDescFirst: false`**, nas quatro: sem isso o TanStack decide pelo TIPO do
primeiro valor e coluna de número começa DESCENDENTE, o que produzia uma tabela
em que "Cliente" subia e "Valor" descia sem nada na tela explicando. No angular a
mesma promessa é o ciclo explícito `asc → desc → nenhum` de `alternarOrdenacao`.

### D6 · O rótulo da linha tem três degraus, e nunca cai em nome repetido

**Estado**, idêntico nas cinco (comentário palavra por palavra em `lineLabel` de
react, vue, svelte, vanilla e em `linhasBrutas` do angular):

1. `rowLabel`, quando quem usa souber qual campo identifica a linha;
2. o valor da PRIMEIRA coluna de dados — `getAllCells`, não `getVisibleCells`,
   porque esconder coluna pelo menu é decisão de leitura e não pode renomear
   controle;
3. a chave da linha, quando a primeira coluna vem vazia.

**Medição**: nome repetido em dez controles é o mesmo que nome nenhum na lista do
leitor (WCAG 4.1.2), e era o defeito daqui. O degrau do MEIO é provado no
Playground das cinco (que de propósito não passa `rowLabel`) e o degrau
EXPLÍCITO tem story própria, `ExplicitRowLabel`, nas cinco.

### D7 · A contagem de seleção é região viva, e não depende do rodapé

**Estado**: `<div class="nds-sr-only" role="status" aria-live="polite">` com o
texto de `rowsSelected`, presente sempre que há seleção.
**Medição registrada nos cinco arquivos**: a linha marcada muda de FUNDO, e cor
sozinha não chega a quem não enxerga. A contagem existia só no rodapé da
paginação, num `div` mudo que sumia junto com ela quando `enablePagination` era
falso ou a tabela era virtualizada (WCAG 4.1.3, Status Messages, AA).
**Detalhe do vanilla que é mecânica, não decisão**: o nó é criado UMA vez e só o
texto muda — região viva que nasce junto com o conteúdo não é anunciada.

### D8 · Todo texto é substituível, e a FORMA disso diverge por framework

**Estado**: um objeto `labels` com 21 chaves nas quatro stacks TanStack, em que as
que dependem de um dado são FUNÇÕES (`selectRow(row)`, `sortBy(col)`,
`rowsSelected(s, n)`); e 19 chaves no angular, em que as mesmas são MOLDES com
marcador (`'Ordenar por {col}'`, `'Selecionar linha {row}'`).
**Motivo**: função permite ordem de palavras e concordância de número por idioma,
e o TS checa aridade; template Angular não declara função, e quem passa o objeto
o passa de dentro de um template.
**É divergência de API de framework — registrada, não alinhada** (regra do
CLAUDE.md da raiz), e está declarada nos cinco lugares: no tipo de cada stack, na
guideline do angular (`:160-162`) e no `data-table-labels.ts` do svelte.
**O que o angular NÃO tem, e com razão**: `pinLeft`, `unpin` e `resize` — rótulos
que nomeiam controles que aquele stack não entrega. Rótulo sem controle é promessa
de recurso inexistente.

### D9 · Cada recurso é uma flag, e não há variante

**Estado**: onze flags booleanas (`enableGlobalFilter`, `enableColumnVisibility`,
`enableColumnFilters`, `enableRowSelection`, `enableColumnResizing`,
`enableColumnOrdering`, `enableColumnPinning`, `enablePagination`, `virtualized`
mais `pageSize`/`pageSizeOptions`), com padrões idênticos nas cinco onde a flag
existe: busca e menu de colunas LIGADOS, paginação LIGADA, o resto desligado.
**Onde está escrito**: `variants.note` do conteúdo compartilhado — "o DataTable
não tem variantes `cva`" — e as cinco guidelines.

### D10 · Paginar e virtualizar são exclusivos, e isso é DOIS conjuntos de recursos

**Estado**: `virtualized` desliga a paginação automaticamente.
**Medição que explica a forma**: no TanStack 9 o modelo de linhas paginado é um
RECURSO, e recurso registrado é recurso ativo. Como a tabela virtualizada entrega
todas as linhas de propósito (quem recorta é o virtualizador), ela precisa de um
conjunto que simplesmente NÃO tenha o recurso — daí `RECURSOS_WITH_PAGINATION` e
`RECURSOS_NO_PAGINATION` em react e vue, e a fábrica `createRecursos(comPaginacao)`
em svelte e vanilla, que ainda precisa nascer por instância porque as ligações de
reatividade guardam estado (assinaturas, desmontagem) e compartilhar um conjunto
misturaria as assinaturas de todas as tabelas.

### D11 · O campo de edição não tem altura cravada — mas a célula vazia tem

**Estado**: `.nds-data-table-edit-input` não declara `height`, e o comentário da
folha (linhas 275-281) explica: a altura sai do `padding-block` mais o
`line-height` que `.nds-input` já define, dá os mesmos ~32px do `2rem` antigo e
cresce com a fonte do navegador (WCAG 1.4.4). O mesmo vale para
`.nds-data-table-th`, que usa `min-block-size` — "40px é PISO, não teto".
**O defeito que sobrou**: `.nds-data-table-empty` (linha 291) usa
`height: var(--spacing-24)`, enquanto `.nds-table-empty` do primitivo (linha 115)
usa `block-size` para o MESMO conceito — e o comentário do primitivo (linhas
103-113) diz por que `block-size` é o certo: numa célula de tabela ele se comporta
como MÍNIMO, então a linha cresce se o conteúdo pedir, o que acomoda mensagem de
duas linhas. Ver a pendência na §11.

### D12 · O menu de colunas do Vanilla é `role="group"`, de propósito

**Estado**: no vanilla o menu é um `div[hidden]` posicionado em absoluto ao lado
do gatilho, com `role="group"` e `aria-label`. Nas outras quatro é o DropdownMenu
do design system, em portal, com itens `menuitemcheckbox`.
**Motivo escrito no vanilla** (linhas 662-665): `role="menu"` obriga filhos
`menuitem*`, e dentro deste menu moram checkboxes E botões de fixar — o axe
reprovava a página inteira por `aria-required-children`, e ninguém via porque
nenhuma story chegava a ABRIR o menu.
**Consequência não resolvida**: react, vue e svelte põem um `<button>` de fixar
dentro do menu de portal (`.nds-data-table-pin-wrap`), que é exatamente o arranjo
que o vanilla evitou. Ver o item 5 da §7.

## 4. Anatomia

```
data-table                       <div>, coluna flex, gap de 8px
├── data-table-toolbar           opcional (busca OU menu de colunas)
│   ├── search                   moldura relativa do campo
│   │   ├── svg                  lupa, absoluta à esquerda, aria-hidden
│   │   └── search-input         input[type=search] — papel searchbox
│   └── columns-wrap             só vanilla e angular emitem este nó
│       ├── columns-btn          Button outline/sm, com ícone e rótulo
│       └── menu de colunas      vanilla: div[hidden] absoluto, role=group
│                                outras quatro: DropdownMenu em portal
│           ├── menu-header      só vanilla
│           ├── menu-row         linha: caixa de marcação + rótulo
│           │   ├── checkbox     visibilidade da coluna
│           │   ├── menu-label   só vanilla · menu-check nas outras quatro
│           │   └── pin-btn      opcional (pin-wrap nas stacks de portal)
├── data-table-scroll            MOLDURA: borda e raio. Não rola na horizontal
│   └── nds-table-wrapper        ← quem rola, e o único com tabindex="0"
│       └── table                .nds-table (+ .nds-table-fixed quando preciso)
│           ├── caption          opcional, sr-only, PRIMEIRO filho
│           ├── thead
│           │   ├── tr › th      data-table-th, scope=col, aria-sort
│           │   │   ├── th-inner grip opcional + conteúdo
│           │   │   │   ├── checkbox de seleção total (tri-state)
│           │   │   │   ├── sort-btn        quando a coluna ordena
│           │   │   │   └── th-label        quando não ordena
│           │   │   └── resize-handle       role=separator, 4px
│           │   └── tr.filter-row           opcional
│           │       └── th › filter-input | filter-select | texto sr-only
│           └── tbody
│               ├── tr fantasma  aria-hidden, só virtualizado
│               ├── tr.data-table-tr [data-state=selected]
│               │   └── td.data-table-td
│               │       ├── checkbox de linha
│               │       ├── editable › edit-btn ⇄ edit-input
│               │       └── conteúdo da célula
│               └── td.data-table-empty     estado vazio, colspan derivado
├── região viva                  sr-only, role=status, aria-live=polite
└── data-table-pagination        opcional
    ├── pagination-count         contagem do conjunto filtrado
    └── pagination-controls
        ├── page-size            rótulo + page-size-select
        ├── pagination-count     indicador "Página X de Y"
        └── pagination-nav       quatro Buttons de ícone
```

Três `data-slot` só: `data-table`, `data-table-toolbar`, `data-table-pagination`.
A moldura de rolagem, o `<table>` e as células são identificados por CLASSE — e
no angular isso é regra, porque duas diretivas no mesmo botão disputam
`data-slot` e quem escreve por último vence (o gatilho do menu de colunas é o
caso, documentado no template e na story).

**A ordem dos nós difere numa stack**: no vanilla e nas outras três de navegador a
região viva vem ANTES do rodapé; no angular ela vem DEPOIS. Nada na tela muda —
o nó é invisível —, mas a ordem de leitura do leitor de tela não é a mesma.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/data-table.css`, 397 linhas, lida linha a linha em
2026-09-16. O componente **não declara variável própria nenhuma**: ele consome os
tokens semânticos e os mesmos que o Table primitivo lê.

| propriedade | valor | token |
|---|---|---|
| raiz: direção e respiro | coluna, 8px | `--spacing-2` |
| toolbar: respiro | 8px, com `flex-wrap` | `--spacing-2` |
| busca: largura máxima | 24rem | **literal** |
| busca: largura mínima | 12rem | **literal** |
| busca: recuo do ícone | 32px | `--spacing-8` |
| menu de colunas: largura mínima | 16rem | **literal** |
| menu de colunas: largura (portal) | 16rem | **literal** |
| menu: camada | — | `--z-dropdown` (1000) |
| menu: fundo, borda, raio | — | `--background`, `--border`, `--radius` |
| menu: sombra | `0 8px 24px -4px rgba(0,0,0,0.1)` | **literal**, e a escada de elevação do projeto não é lida aqui — ver a pendência da §11, que nomeia o token e a exceção declarada |
| menu: cabeçalho | 12px, peso 600, caixa alta, `letter-spacing: 0.05em` | `--text-control-sm` + **três literais** |
| menu: linha e rótulo | 4px/8px, raio pequeno, 14px | `--spacing-1`, `--spacing-2`, `--radius-sm`, `--text-control` |
| botão de fixar | 24px × 24px | `--spacing-6` nas duas dimensões — é a única ALTURA cravada do componente, e ele é botão só de ícone, sem texto para crescer |
| moldura de rolagem | borda 1px, raio | `--border`, `--radius` |
| cabeçalho: altura | piso de 40px | `--spacing-10`, por `min-block-size` (D11) |
| cabeçalho: padding e cor | 8px, secundária | `--spacing-2`, `--muted-foreground` |
| cabeçalho: peso | 500 | **literal**, onde `table.css` usa o token de peso médio para a mesma coisa — ver a pendência da §11, que nomeia os dois |
| botão de ordenar: peso | 500 | **literal**, pelo mesmo motivo |
| botão de ordenar: hover | — | `--primary` |
| célula | 8px, cor de corpo | `--spacing-2`, `--foreground` |
| linha: hover | `--muted` a 50% | `--muted` |
| linha: selecionada | `--muted` cheio | `--muted` |
| linha de filtros: padding | 4px/8px | `--spacing-1`, `--spacing-2` |
| campo e select de filtro | altura 32px, 12px, borda de campo | `--spacing-8`, `--text-control-sm`, `--input`, `--radius-sm` |
| alça de redimensionar | largura 4px, altura 100% | **literal** (4px) |
| alça: hover e arraste | `--primary` a 50% | `--primary` |
| célula editável: botão | 4px, raio pequeno | `--spacing-1`, `--radius-sm` |
| célula editável: campo | 4px/8px, 14px, **sem altura** | `--spacing-1`, `--spacing-2`, `--text-control` (D11) |
| estado vazio | 96px por `height` | `--spacing-24` — e o primitivo usa `block-size` (D11) |
| rodapé: respiro | 8px e 16px, com `flex-wrap` | `--spacing-2`, `--spacing-4` |
| rodapé: contagem e indicador | 14px, cor secundária | `--text-control`, `--muted-foreground` |
| seletor de tamanho | altura 32px, 14px | `--spacing-8`, `--text-control` |
| navegação do rodapé | 4px | `--spacing-1` |
| coluna fixada | fundo opaco | `--background` |
| anel de foco (5 regras) | 2px a 50%, afastado 2px | `--ring` + **dois literais** |
| ícones (`.nds-dt-icon*`) | 0.875rem (14px) | **literal**; tom secundário por `--muted-foreground`, grip a 60% |
| ícone de fixar | rotação de −45° | **literal** |

**O docblock contradiz a própria folha.** A linha 5 afirma "Todos os valores
seguem o grid de 8", e a folha carrega `max-width: 24rem`, `min-width: 12rem`,
`min-width: 16rem`, `width: 16rem`, `width: 4px` e `0.875rem` — nenhum deles sai
da escada `--spacing-*`. A guideline do vanilla repete a promessa de forma ainda
mais forte ("Off-grid (3, 5, 7, 9) são bugs"). Os literais são defensáveis um a
um — largura de campo, largura de painel, traço de alça, tamanho de ícone —, mas
não estão declarados como exceção em lugar nenhum. Ver a pendência na §11.

**Duas geometrias saem em `style` inline, e são mecânica do recurso**: a largura
de coluna durante o redimensionamento (`width: NNNpx`) e a posição da coluna
fixada (`position: sticky`, `left`/`right` em pixel, `z-index: 1`). As quatro
stacks TanStack escrevem as duas; o vanilla é explícito sobre o corte — só a
GEOMETRIA sai inline, o FUNDO opaco vem da classe `-pinned`, porque escrito
inline ele sairia do tema. É por essas duas que o angular não entrega os
recursos (D1).

**Não há bloco `prefers-reduced-motion` nesta folha, e hoje isso não é defeito**:
a folha também não declara `transition` nem `animation` nenhuma — não há o que
zerar. O movimento que existe na tela vem das folhas compostas (Button, Input,
Checkbox, DropdownMenu), que têm o próprio bloco, mais a escada de
`docs/shared/tokens/motion.css`. A observação vale como guarda: a primeira
transição acrescentada aqui nasce sem cobertura.

**Sem sombra própria, exceto uma**: a única elevação da folha é a do menu de
colunas — e ela é o literal acima, no único nó que flutua.

## 6. Estados

| estado | quando ocorre | o que muda | tem produtor? |
|---|---|---|---|
| Repouso | sempre | grade neutra, cabeçalho secundário | sim, as cinco |
| Hover de linha | ponteiro sobre `tr` | fundo `--muted` a 50% | sim, as cinco (declaração da folha) |
| Ordenado | clique no botão do cabeçalho | seta asc/desc, `aria-sort` no `th` | sim, as cinco |
| Filtrado (busca) | campo de busca preenchido | recorte, contagem e paginação acompanham | sim, as cinco |
| Filtrado (coluna) | `meta.filter` + flag | segunda linha do cabeçalho, filtros somados | sim, as cinco |
| Selecionado | caixa de linha marcada | `data-state="selected"`, fundo `--muted` | sim, as cinco |
| Seleção parcial | página incompleta | `aria-checked="mixed"` no cabeçalho | sim, as cinco |
| Em edição | clique na célula editável | botão vira campo, com foco | sim, as cinco |
| Foco visível | `:focus-visible` em ordenar, filtrar, editar, seletor | anel de 2px em `--ring` a 50% | sim, as cinco |
| Vazio | `data` vazio ou recorte sem linha | uma linha com mensagem, `colspan` derivado | sim, as cinco |
| Redimensionando | arraste da alça (`.is-resizing`) | largura acompanha o ponteiro | **quatro** — o angular não entrega |
| Reordenando | arraste do cabeçalho | ordem das colunas E das células | **quatro** — o angular não entrega |
| Fixada | `pin` pelo menu (`-th-pinned`/`-td-pinned`) | `position: sticky` e fundo opaco | **quatro** — o angular não entrega (e no vanilla a classe é montada por template string, o que faz a busca literal por ela não achar nada) |
| Virtualizado | `virtualized` | só as linhas da janela existem, com fantasmas | **quatro** — o angular não entrega |
| Movimento reduzido | `prefers-reduced-motion` | nada, nesta folha | **não há o que produzir** — a folha não declara transição (§5) |

O conteúdo compartilhado publica SETE configurações em `states.*` — `empty`,
`sorted`, `filtered`, `selected`, `editing`, `resizing`, `virtualized`. As quatro
stacks TanStack renderizam as sete; o angular renderiza CINCO, deixando
`resizing` e `virtualized` de fora com o motivo escrito no código ("listá-los
prometeria comportamento inexistente"). É a decisão certa e é, ao mesmo tempo, a
única lista de estados que difere entre as cinco páginas.

## 7. API

O eixo é um só e ele é a lista de flags (D9). Os padrões abaixo são idênticos nas
cinco stacks onde a flag existe.

| prop | tipo | padrão |
|---|---|---|
| `columns` | definição das colunas | — (obrigatória) |
| `data` | lista de linhas | — (obrigatória) |
| `enableGlobalFilter` | booleano | `true` |
| `globalFilterPlaceholder` | texto | `'Buscar...'` |
| `enableRowSelection` | booleano | `false` |
| `enableColumnVisibility` | booleano | `true` |
| `enableColumnFilters` | booleano | `false` |
| `enableColumnResizing` | booleano | `false` — ausente no angular |
| `enableColumnOrdering` | booleano | `false` — ausente no angular |
| `enableColumnPinning` | booleano | `false` — ausente no angular |
| `enablePagination` | booleano | `true` |
| `virtualized` | booleano | `false` — ausente no angular |
| `virtualRowHeight` | número | `36` — ausente no angular |
| `maxHeight` | texto | `'480px'` — ausente no angular |
| `pageSize` | número | `10` |
| `pageSizeOptions` | lista de números | `[10, 20, 50, 100]` |
| `emptyMessage` | texto | `'Sem resultados.'` |
| `caption` | texto | — (`''` no angular) |
| `rowKey` | função de identidade | — (índice do array no angular) |
| `rowLabel` | função de rótulo | — |
| `labels` | parcial dos textos | padrão pt-BR |
| classe extra | texto | — |
| aviso de edição | `(rowIndex, columnId, value)` | — |
| acesso à instância | função que recebe a tabela | — · **não existe no angular** |
| mudança de seleção | lista de linhas marcadas | — · **só existe no angular** |

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| react | `DataTable` é função com props; `useTable` do adaptador React. O rodapé é exportado à parte (`DataTablePagination`) e tipado com `ReactTable`, não com o `Table` do core, porque no 9 quem publica `state` é o adaptador. A célula editável e o filtro de coluna são componentes locais (`EditableCell`, `ColumnFilter`). `className` |
| vue | props por `withDefaults`, e o estado da tabela entra em `useTable` por GETTERS (`get data()`, `get columns()`, `get sorting()`) — é assim que a reatividade do Vue chega ao motor. Dois eventos em vez de callbacks: `@cell-edit` e `@table-ready`. A célula editável é um `defineComponent` local. O rodapé é um `.vue` próprio, que recebe `labels` já mesclados de propósito — dois pontos de mescla divergem no dia em que só um mudar. `class` |
| svelte | runes: props destruturadas com `$props()`, estado em `$state`, tabela em `$state.raw` construída num `$effect.pre`. É a única stack com MÓDULOS próprios: `data-table-features.ts` (o conjunto de recursos, que mora fora do `.svelte` para não fechar ciclo de import com o índice) e `data-table-labels.ts` (os textos, fora porque arquivo de componente não exporta tipo). O virtualizador precisa de um contador de medições (`medicoes`) porque o store do adaptador reemite sempre o MESMO objeto e `$derived` nunca invalidaria. Índice reexporta `Root`/`Pagination` |
| vanilla | fábrica `createDataTable(options)` que devolve elemento destruível (`tornarDestruivel`). É a única com ciclo de vida explícito: o menu de colunas pendura ouvinte de clique no `document`, e a fábrica solta o anterior antes de pendurar o seu — antes era um ouvinte NOVO por interação, empilhado enquanto a pessoa usava a tabela. Os ícones são strings literais passadas por `DOMPurify.sanitize` no call site. Os campos de filtro e a toolbar são criados UMA vez e reaproveitados: recriá-los trocava o nó com foco a cada tecla, e só a primeira letra entrava. A tabela é exposta em `root.__table` para as plays |
| angular | componente de ATRIBUTO (`div[ndsDataTable]`), zoneless, `OnPush`, `ViewEncapsulation.None`. Sem motor externo (D1): o estado são nove signals e a derivação é uma cadeia de `computed` (bruto → filtrado → ordenado → paginado). A coluna é `DataTableColumn` com `id`/`header`/`accessor`/`format`/`sortable`/`hideable`/`editable`/`numeric`/`filter` — não é `ColumnDef`, e `accessor` devolve o valor bruto (é o que faz dinheiro ordenar como número). `pageSize` é lido em `ngOnInit`, nunca no construtor, porque `input()` no construtor devolve o default. Tem `selectionChange` e não tem acesso à instância — não há instância a expor |

### Divergências medidas que NÃO são de framework

| # | o que difere | quem faz o quê | a maioria |
|---|---|---|---|
| V1 | meta/definição de coluna | react e vue: `filter` + `editable`. vanilla: `filter`, `editable`, `headerLabel`, `renderCell`. svelte: `filter`, `editable`, `format`, `badgeVariant`, `cellClass`. angular: campos na própria coluna, com `format` | nenhuma maioria — cinco conjuntos diferentes |
| V2 | coluna de seleção | injetada como coluna `__select__` em react, vue, svelte e vanilla; no angular é um `th`/`td` condicional no template, fora de `columns` | 4 de 5 |
| V3 | célula numérica na docs page | vanilla `nds-font-medium nds-tabular-nums`; react `nds-font-medium` + `fontVariantNumeric` em `style` inline; vue `class="font-medium tabular-nums"` — **classes que não existem** no CSS compartilhado; svelte por `meta.format`, sem classe; angular por `[class.nds-text-right]` e `[class.nds-tabular-nums]` na célula | nenhuma maioria — cinco formas |
| V4 | `columns-wrap` | vanilla e angular emitem; react, vue e svelte não | 3 de 5 não emitem — e a folha compensa declarando `margin-left: auto` duas vezes |
| V5 | tri-state | vanilla escreve `aria-checked="mixed"` à mão; nas outras quatro o primitivo Checkbox resolve | 4 de 5 delegam |
| V6 | listas de teste renderizadas | completas em vanilla, vue e angular (9 funcionais, 6 de a11y); react e svelte param em 8 e 4 | 3 de 5 completas |
| V7 | `caption` nos previews da docs page | só o angular passa, e passa em todos os onze; nas outras quatro `caption` aparece apenas na tabela de props e no código de interface | 1 de 5 |
| V8 | `labels` na demonstração | vanilla e angular passam (12 chaves); react, vue e svelte passam só o placeholder da busca | 2 de 5 passam |
| V9 | previews do Do & Don't | componente vivo em react, vue, vanilla e angular; bloco de código imitando o uso no svelte | 4 de 5 |
| V10 | painel Code | react, vue, svelte e vanilla têm `data-table.source.ts` com um construtor por story e `data-table.source.test.ts`; o angular tem UM construtor, sem teste, e oito stories sem `transform` | 4 de 5 |
| V11 | fixture | react, vue, svelte e vanilla compartilham os mesmos doze registros (`INV-001`, campos em inglês); o angular usa outro conjunto (`#INV-001`, campos `cliente`/`metodo`/`value`, valores diferentes) | 4 de 5 |
| V12 | árvore de stories | react, vue, svelte e vanilla: Playground + Compositions + Settings + States; o angular troca Compositions por Variants e o conteúdo dela | 4 de 5 |

### Peças, por stack

| stack | peças |
|---|---|
| react | `DataTable`, `DataTablePagination`, tipos `DataTableProps`, `DataTableColumn`, `DataTableLabels`, `DataTableFeatures`, constante `DATA_TABLE_LABELS_DEFAULT` |
| vue | `DataTable`, `DataTablePagination`, `DATA_TABLE_LABELS_DEFAULT`, `RECURSOS_WITH_PAGINATION`, `RECURSOS_NO_PAGINATION`, tipos `DataTableProps`, `DataTableColumn`, `DataTableLabels`, `DataTableFeatures` |
| svelte | `DataTable`/`Root`, `DataTablePagination`/`Pagination`, `EditableCell` (interno), `createRecursos`, `DATA_TABLE_LABELS_DEFAULT`, tipos `DataTableProps`, `DataTableColumn`, `DataTableLabels`, `DataTableFeatures` |
| vanilla | `createDataTable`, tipos `DataTableOptions`, `DataTableColumn`, `DataTableLabels`, `DataTableFeatures` |
| angular | `NdsDataTable` (`div[ndsDataTable]`), `NdsDataTableIcon` (`svg[ndsDataTableIcon]`, interno), `DATA_TABLE_LABELS_DEFAULT`, tipos `DataTableColumn`, `DataTableColumnFilter`, `DataTableCellEdit`, `DataTableLabels` |

O rodapé de paginação é peça publicada em react, vue e svelte; no vanilla é
função interna da fábrica e no angular é um bloco do template. Nenhuma das cinco
usa o componente Pagination do design system (§1).

### Inconsistências entre stacks, medidas em 2026-09-16

> **LEIA ISTO ANTES DA LISTA — 2026-09-22.** A passagem de `fix` deste dia
> fechou boa parte do que está descrito abaixo, e a lista **não foi reescrita
> linha a linha de propósito**: ela é o registro do que foi medido naquele dia,
> e reescrevê-la apagaria a medição. O que mudou está aqui.
>
> **Fechados**: os itens **V7** (previews sem nome acessível — as cinco passam
> `caption` com sufixo por preview), **V8** e **15** (a demonstração só falava o
> idioma da página em duas stacks — agora nas cinco, e os dados carregam CHAVE
> ESTÁVEL em vez de texto traduzido), **V9**, **V10**, **V12**, **18** (a folha
> dizia v8) e **27** (as 21 chaves de rótulo duplicadas — viraram
> `docs/shared/primitives/data-table-labels.ts`).
>
> **D11 — "o defeito que sobrou" — foi corrigido**: a regra do vazio usa
> `block-size`.
>
> **Leitura que o item 15 exigia e se confirmou**: o portão
> `demonstration_labels_divergent` apontava vanilla e angular, que eram as duas
> stacks CERTAS, porque a maioria era quem passava menos rótulos. O alinhamento
> foi das outras três para elas, nunca o contrário. Enquanto as stacks migravam,
> o portão foi apontando a minoria em movimento — é o comportamento esperado de
> um portão que compara contra a maioria, e não motivo para desconfiar dele.
>
> **Continua de pé** o que a passagem declarou e não fechou: as cinco ainda não
> emitem a mesma árvore de toolbar (o nó `-columns-wrap` existe em duas), e três
> stories de comportamento (`Sorted`, `SelectedRows`, `WithColumnVisibility`)
> existem só no angular — esta está no `FIXES-NEEDED.md`, porque decidir se o
> contrato inclui esses casos não é conserto mecânico.

Medidas arquivo a arquivo, com leitura dos cinco `package.json` e da folha
compartilhada. Caminhos curtos: `react/…` é
`nortear-design-system-react/src/components/…`, e assim nas outras;
`ui/data-table/` no vue e no svelte. Nada aqui foi rodado em navegador, e **nada
aqui é visto pelos 18 achados do auditor**, salvo onde a linha diz o contrário.

**O motor e o contrato**

1. **O motor é externo em quatro stacks e escrito à mão em uma.** react
   `@tanstack/react-table ^9.1.2`, vue `@tanstack/vue-table ^9.1.2`, svelte e
   vanilla `@tanstack/table-core ^9.1.2`; o `package.json` do angular não tem
   **nenhuma** dependência `@tanstack`, e `angular/ui/data-table.ts:60-91`
   declara por quê. Maioria (4): TanStack. **Aceita por escrito como divergência
   de API de framework** — é o único item desta lista que já tem decisão.
2. **Quatro recursos existem em quatro stacks e em nenhuma medida no angular**:
   redimensionar, reordenar, fixar coluna e virtualizar. Não há flag para eles
   (`angular/ui/data-table.ts:631-670` declara 17 entradas e 2 saídas, contra as
   24 props de `DataTableProps` do react). Maioria (4): existem. Consequência:
   `enableColumnResizing`,
   `enableColumnOrdering`, `enableColumnPinning`, `virtualized`,
   `virtualRowHeight` e `maxHeight` são props que a documentação compartilhada
   descreve e uma stack não tem.
3. **A forma da coluna diverge, e ela é a API mais visível do componente.**
   `ColumnDef` do TanStack com `accessorKey`/`header`/`cell`/`size`/`meta` em
   quatro; `DataTableColumn` com `id`/`header`/`accessor`/`format`/`sortable`/
   `hideable`/`numeric` no angular. Maioria (4). Registrada no código, e é o que
   torna o item 13 desta lista um defeito de TEXTO e não de código.
4. **O meta da coluna é um conjunto diferente em cada stack.** react e vue leem
   dois campos (`filter`, `editable`); o vanilla quatro (`+ headerLabel`,
   `renderCell`); o svelte cinco (`+ format`, `badgeVariant`, `cellClass`); o
   angular tem os campos na coluna, com `format`. **Nenhuma maioria**, e a
   referência (vanilla) é a única que lê `headerLabel` — o campo que resolve o
   rótulo dos `aria-label` quando o cabeçalho não é string. **Decisão da dona.**
5. **O menu de colunas tem duas semânticas.** vanilla: `div[hidden]` absoluto com
   `role="group"`, e o comentário (`vanilla/ui/data-table.ts:662-665`) diz que
   `role="menu"` reprovava a página no axe por `aria-required-children`, porque
   dentro dele moram checkboxes E botões de fixar. react, vue, svelte e angular:
   DropdownMenu em portal, com `menuitemcheckbox` — e react, vue e svelte põem o
   `<button>` de fixar DENTRO do menu (`.nds-data-table-pin-wrap`), que é
   exatamente o arranjo que o vanilla evitou. Maioria (4): portal. A referência
   diverge com motivo escrito. **Decisão da dona.**
6. **A coluna de seleção é injetada em quatro e é template em uma** (item V2). A
   diferença aparece na contagem de colunas e no `colspan` do vazio, que as cinco
   derivam de fontes diferentes.
7. **O tri-state é escrito à mão numa stack e delegado em quatro.** vanilla
   escreve `aria-checked="mixed"` e `data-state="indeterminate"` no nó do
   checkbox; nas outras quatro o primitivo Checkbox resolve a partir de
   `indeterminate`. Maioria (4). O efeito medido é o mesmo — as cinco plays
   afirmam `mixed`.
8. **A ordem da região viva difere.** Antes do rodapé em react, vue, svelte e
   vanilla; depois dele no angular (`angular/ui/data-table.ts:621-627`). Maioria
   (4). Invisível na tela, diferente na leitura.

**A folha e as classes**

9. **A célula numérica é escrita de cinco formas** (item V3), e uma delas usa
   classes que não existem: `vue/docs/DataTableDocs.vue:170` emite
   `class="font-medium tabular-nums"`, e o CSS compartilhado só tem
   `.nds-font-medium` (`typography.css:70`) e `.nds-tabular-nums`
   (`utilities.css:375`). Na docs page do Vue a coluna de dinheiro não recebe
   peso nem numeral tabular. **Nenhuma maioria**, e o react resolve o mesmo com
   `style` inline (`react/docs/DataTableDocs.tsx:188`), que é o que a regra da
   casa proíbe — e o portão `inline_style_design_value` não o pegou.
10. **Cinco classes da folha têm produtor em parte das stacks.**
    `-columns-menu-header` e `-columns-menu-label`: só o vanilla (1 de 5).
    `-columns-menu-check` e `-columns-menu-content`: as outras quatro (4 de 5).
    `-pin-wrap`: react, vue e svelte (3 de 5). `-columns-wrap`: vanilla e angular
    (2 de 5). Nenhuma é classe morta no conjunto, e todas são classe morta em
    alguma stack.
11. **`.nds-data-table-columns-btn` é declarada duas vezes na mesma folha** —
    linha 51 (`inline-flex`, `align-items`, `gap`) e linha 345
    (`margin-left: auto`, sob o comentário "Composite (React/TanStack com
    primitivos compostos)") — e `.nds-data-table-columns-wrap` já carrega
    `margin-left: auto` na linha 48. O empurrão para a direita está escrito duas
    vezes porque duas stacks emitem o nó e três não (item 10).
12. **Nenhuma story das cinco declara `figmaDesign`**, e
    `docs/shared/figma/design-links.ts` não tem entrada para `data-table`. O
    componente não está registrado no desenho — 0 de 5.

**O texto e o que ele promete**

13. **A tabela de props do Angular descreve na tela uma API que aquele stack não
    tem.** A chave compartilhada `props.table.columns` diz "formato `ColumnDef` do
    TanStack Table. Inclui `accessorKey`, `header`, `cell`, `size` e `meta`", e a
    docs page do angular a renderiza para a linha `columns`
    (`angular/docs/DataTableDocs.ts:1033`), embora ela sobrescreva as nove chaves
    de coluna vizinhas. Mesma forma em `notes.tip2`, que ensina "Headless: a
    engine não renderiza nada" nas cinco páginas, inclusive na que não tem
    engine. 1 de 5 contradita, 5 de 5 renderizam.
14. **O comentário da docs page do Angular envelheceu em relação ao conteúdo.**
    `angular/docs/DataTableDocs.ts:220-227` afirma que
    `anatomy.structureCode.angular` "anuncia `@tanstack/angular-table` sobre o
    mesmo `table-core` e passa flags de pin e resize". Medido hoje, a chave já
    começa por "Sem lib de tabela: ordenação, filtro e paginação vivem no
    componente" e não passa flag nenhuma daquelas. O defeito é do comentário.
15. **A demonstração só fala o idioma da página em duas stacks** (item V8):
    vanilla e angular passam as chaves de `demonstration.labels` ao
    componente; react, vue e svelte passam só o placeholder da busca, então o
    rodapé da demonstração fica em pt-BR fixo em `en` e `es`. 2 de 5. O portão
    `demonstration_labels_divergent` reporta o contrário — aponta vanilla e
    angular como os divergentes, porque a maioria é quem passa menos.

    **Correção de 2026-09-22**: este item dizia "as doze chaves", e eram
    DEZOITO na data em que foi escrito. Contagem escrita por extenso no meio
    de um texto envelhece em silêncio — ninguém relê um numeral para
    conferir. Depois desta passagem são vinte e quatro: entraram cinco de
    método de pagamento (os valores estavam cravados em pt-BR nas CINCO) e
    uma de legenda (a demonstração não tinha nome acessível em nenhuma).
16. **Os previews da docs page não têm nome acessível em quatro stacks** (item
    V7). O angular passa `caption` nos onze previews em `ng-template` e na
    demonstração, e ainda compõe um sufixo por
    preview, com o motivo escrito ("meia dúzia de tabelas com o mesmo nome deixa
    a lista do leitor indistinguível"); em react, vue, svelte e vanilla a palavra
    `caption` aparece só na tabela de props. 1 de 5 — e a promessa contrária está
    em `testes.accessibility.item6`, que as cinco páginas publicam e as cinco
    stories medem (C3).
17. **FECHADA em 2026-09-17 — a guideline do Vanilla errava sobre o Vanilla.**
    `vanilla/guidelines/08-display-components.md` listava `cellClass` no meta de
    coluna, e o tipo do vanilla (`vanilla/ui/data-table.ts:69-75`) não o tem; a
    mesma tabela omitia `headerLabel`, que o primitivo lê em 8 pontos. Fechou com a
    migração do catálogo para este PRD: a seção do vanilla passou a descrever o
    `meta` real (`filter`, `editable`, `headerLabel`, `renderCell`), conferido no
    tipo. Fica registrado porque a forma do defeito é a da categoria inteira — a
    guideline da stack de REFERÊNCIA descrevendo uma API que a referência não tem.
18. **A folha diz "TanStack v8"** (D2): `data-table.css:3`. O instalado é
    `^9.1.2` nas quatro stacks que usam o motor. Até 2026-09-17 as guidelines de
    react, vue, svelte e vanilla diziam o mesmo — 5 documentos contra 4
    `package.json` —, e as quatro foram corrigidas na migração do catálogo. Sobra
    1 documento, e ele é folha.
19. **A guideline do Vue nomeia a classe da era anterior.**
    `vue/guidelines/08-display-components.md:261` diz que o componente aplica
    `table-fixed`; a classe é `.nds-table-fixed` (`data-table.css:140`), e é o que
    as quatro stacks emitem. 1 de 5.

**As stories e a cobertura**

20. **A mesma story mora em grupos diferentes da barra lateral.**
    `WithColumnFilters` e `WithInlineEditing` estão em `Compositions` em quatro
    stacks e em `Variants` no angular. 4 de 5 — **este é um dos 18 achados do
    auditor** (`story_group_divergent`).
21. **A cobertura declarada é a mesma nas cinco, e no angular quatro itens são
    declarados INAPLICÁVEIS** com motivo, em `coversNotApplicable`
    (`functional.item6`, `functional.item7`, `visual.item3`, `visual.item5`). É a
    forma correta de declarar exclusão, e é o único lugar do componente que a usa.
22. **As listas de teste renderizadas são curtas em duas stacks** (item V6):
    react publica 8 dos 9 itens funcionais e 4 dos 6 de acessibilidade; o svelte
    publica os mesmos 8 e 4. **O portão só vê o svelte**: a regra
    `lista_mais_curta_que_o_conteudo` reporta duas vezes para
    `DataTableDocs.svelte` e nada para o react, porque no react a lista é
    `[1,2,3,4,5,6,7,8].map(…)` e no svelte é uma lista literal de objetos. O item
    que some dos dois é o `functional.item9` — que é o contrato C11, o de a
    marcação não mudar de linha.
23. **O Do & Don't do Svelte mostra código, não componente** (item V9): os quatro
    previews são `<code>` com o texto da prop
    (`svelte/docs/DataTableDocs.svelte:287-306`), e são também os quatro valores
    de design em `style` inline que o auditor pega. 4 de 5 mostram componente
    vivo. **O mesmo achado aponta o vanilla, e ali é falso positivo**: as quatro
    fábricas de `vanilla/docs/DataTableDocs.ts:320-357` instanciam
    `createDataTable` de verdade — a regra não reconhece a forma de fábrica.
24. **A fixture do Angular é outra** (item V11), e por isso as asserções de
    ordenação das duas famílias de stories não são comparáveis: o menor valor é
    `INV-009` em quatro stacks e `#INV-010` no angular. 4 de 5.
25. **Só o Vanilla tem prova de limpeza.** A story `ListenerCleanup` e a sonda
    `leak-probe.ts` existem porque a fábrica é a única que pendura ouvinte no
    `document` (o fechamento do menu de colunas). 1 de 5, e é a única que
    precisa. Vale registrar porque é a décima story do vanilla contra nove das
    outras.
26. **O painel Code do Angular publica o andaime da story em oito de nove
    stories** (item V10). **Três dos 18 achados do auditor são este**
    (`story_file_sem_transform` ×3, mais `source_sem_teste`).
27. **Os textos do componente estão duplicados em quatro stacks.** As 21 chaves de
    `DataTableLabels` e os 21 valores padrão em pt-BR aparecem, palavra por
    palavra, em `react/ui/data-table.tsx:156-203`,
    `vue/ui/data-table/data-table.vue:98-148`,
    `svelte/ui/data-table/data-table-labels.ts:14-60` e
    `vanilla/ui/data-table.ts:200-246` — e o comentário do svelte diz
    explicitamente que "o contrato é o MESMO nas quatro stacks que rodam
    TanStack". É catálogo de rótulo, que é exatamente o que
    `docs/shared/primitives/` publica (e o que o pacote `@nortear/ds-core`
    entrega ao Flutter): não precisa de `HTMLElement` para funcionar. Hoje não
    está lá. 4 cópias, 0 fontes. **Decisão da dona.**
28. **`data-table-features.ts` é mecânica da stack, e fica onde está.** O outro
    módulo exclusivo do svelte existe para não fechar ciclo de import entre o
    índice e o componente, e devolve conjunto de recursos do TanStack por
    instância — precisa das ligações de reatividade, não é regra portável. 1 de
    5, e corretamente.

## 8. Acessibilidade

**Estrutura**: tabela semântica de verdade — `<table>`, `<thead>`, `<tbody>`,
`<th scope="col">`, `<td>` — herdada do primitivo Table, com `scope="col"` como
padrão nos cinco `TableHead`. É o que faz o leitor anunciar "tabela, N colunas";
a mesma grade em `div` sairia da árvore de acessibilidade sem mudar um pixel.

**Nome da tabela**: `<caption>` fora da tela, primeiro filho (D4, C3).

**Ordenação**: `aria-sort` no `<th>` — `ascending`, `descending` ou `none`
explícito. Coluna que não ordena NÃO emite o atributo: prometeria capacidade
inexistente. O gatilho é um `<button>` nativo com `aria-label` que carrega o nome
da coluna.

**Seleção**: cada caixa carrega o identificador da própria linha (D6); o
cabeçalho é tri-state com `aria-checked="mixed"`; a contagem sai por região viva
polida (D7), e conta o conjunto filtrado.

**Filtros**: todo campo tem `aria-label` com o nome da coluna, tirado do
CABEÇALHO e nunca do id — o id é chave de dados (`customer`, `amount`) e virava
"Filtrar customer" numa interface em português. E todo `<th>` da linha de filtros
carrega texto para leitor de tela, inclusive o da coluna sem filtro: o VALOR de
um campo não entra no nome acessível da célula, então uma célula que só tem o
campo chega ao axe como cabeçalho vazio (`empty-table-header`). O texto nomeia a
coluna porque "Sem filtro" repetido em três células é o mesmo que célula vazia.

**Busca**: `type="search"`, que é o que dá o papel `searchbox`. Sem ele o leitor
anuncia "campo de edição" e o filtro global fica indistinguível de um campo
qualquer.

**Edição**: o botão e o campo têm o MESMO rótulo ("Editar ‹coluna›") — quem abriu
a edição precisa ouvir de que coluna é o campo que recebeu foco (WCAG 4.1.2). O
foco é programático nas cinco, porque `autofocus` é atributo que o navegador só
honra no primeiro parse do documento.

**Rolagem**: uma camada, e ela recebe foco (D3, WCAG 2.1.1).

**Redimensionamento**: a alça é `role="separator"` com `aria-orientation="vertical"`
e `aria-label` com o nome da coluna — nas quatro stacks que a entregam.

**Teclado**, como o conteúdo publica em `accessibility.keyboard`: `Tab` percorre
toolbar, cabeçalhos, linhas, células editáveis e paginação; `Enter` ativa;
`Espaço` marca e alterna; `Escape` cancela a edição e fecha menu; as setas
navegam DENTRO de select e menu — e não entre células. **Não há navegação em
grade** (`role="grid"`, setas entre células): a tabela é de leitura e controles,
não uma planilha navegável, e está escrito assim na chave `arrowKeys`.

**O que deliberadamente NÃO se faz**:

- não se usa `role="grid"` nem se captura as setas;
- não se põe `aria-sort` em coluna que não ordena;
- não se deixa a contagem de seleção só no rodapé (D7);
- não se nomeia controle de linha com texto fixo (D6);
- não se põe `role="menu"` num menu que contém checkbox e botão — no vanilla, com
  o motivo medido (D12), e é justamente aqui que as outras quatro divergem.

## 9. Analytics

| evento | quem dispara hoje | payload |
|---|---|---|
| `docs_page_view` | as cinco docs pages | `{ component_name: "data-table", locale, page_title }` |
| `docs_section_viewed` | as cinco docs pages | `{ section_id, component_name: "data-table", locale }` |
| `language_switched` | o seletor de idioma das cinco | `{ previous_language, new_language }` |

**O componente não dispara nada, e isso é decisão declarada.** Nenhum dos cinco
primitivos importa `track` (medido em 2026-09-16). O conteúdo compartilhado diz
ao leitor, em `analytics.description`, que "o DataTable é uma camada de UI — não
dispara eventos de produto por padrão", e as guidelines de react, vue e svelte
completam o caminho: para rastrear ordenação, exportação ou edição confirmada,
consome-se a instância da tabela e instrumenta-se no caller.

`analytics.table.*` publica exatamente três linhas, e são as três acima — o que
significa que a tabela de analytics das cinco páginas **não anuncia evento que
não exista**. É o oposto do defeito que o `badge_click` foi.

**Onde o caminho do caller não existe**: o angular não expõe a instância (não há
instância a expor) e publica `selectionChange` em vez disso. Instrumentar
ordenação naquele stack exigiria uma saída nova.

## 10. Reconstruir do zero

Ordem: folha → primitivo Table → motor (ou os signals) → toolbar → cabeçalho →
corpo → rodapé → stories → docs page.

- **Comece pelo Table**, não por aqui. O DataTable não desenha tabela: se
  `<th scope="col">`, `tabindex="0"` no wrapper e `.nds-table-empty` não
  estiverem de pé, metade dos contratos desta página não tem onde apoiar.
- **Um dono de overflow, e ele é o do tabindex** (D3). Devolver `overflow-x` à
  moldura é o defeito de volta, e ele é invisível sem medir estilo computado.
- **A legenda é o primeiro filho de `<table>`** (D4) — em qualquer outra posição o
  parser a move e o nome da tabela some.
- **Registre os recursos do motor explicitamente** e faça DOIS conjuntos, um com
  paginação e um sem (D10). Registrar e desligar por opção deixa o código do
  recurso no pacote de quem nunca pagina.
- **`sortDescFirst: false`** (D5), ou coluna numérica começa descendente e a
  tabela contradiz a própria documentação.
- **`getRowId` a partir de `rowKey`** (D5), ou a marcação pertence à posição.
- **A cadeia de rótulo tem três degraus** (D6), e o segundo usa TODAS as células,
  não só as visíveis.
- **A região viva nasce vazia e só o texto muda** — região viva criada junto com o
  conteúdo não é anunciada.
- **Nada de altura cravada** em campo de edição nem em cabeçalho (D11): `piso`, e
  `block-size` quando o alvo é célula de tabela.
- **Armadilha por stack**: no react `labels` e `columns` precisam de referência
  estável, senão o motor remonta as colunas e perde largura, ordem e pin no meio
  do arraste; no vue o estado entra por GETTERS, e o rodapé recebe os rótulos já
  mesclados (mesclar duas vezes divergem no dia em que só um mudar); no svelte o
  store do virtualizador reemite o MESMO objeto, então é preciso um contador de
  medições para `$derived` invalidar; no vanilla a toolbar e os campos de filtro
  são criados uma vez e reaproveitados (recriar troca o nó com foco a cada tecla),
  o cabeçalho NÃO é reconstruído ao filtrar nem ao paginar, e o ouvinte de clique
  fora precisa ser soltado antes de pendurar o próximo; no angular `input()` no
  construtor devolve o default (leia em `ngOnInit`), o item de menu emite TRÊS
  estados e não dois, e o `data-slot` do botão do menu é disputado por duas
  diretivas — identifique por CLASSE.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, classes, camadas | `docs/shared/styles/nds/data-table.css` (397 linhas) |
| a grade que este componente veste | `docs/shared/styles/nds/table.css` |
| texto, props, tokens, critérios de teste | `docs/shared/content/data-table/translations.json` (313 folhas, 3 idiomas) |
| medição de rolagem | `docs/shared/testing/data-table-probe.ts` — `measureScroll`, e só ele |
| referência de markup e comportamento | `nortear-design-system-vanilla/src/components/ui/data-table.ts` |
| portões determinísticos | `node scripts/audit.mjs data-table --json` |
| regra de CATEGORIA (display) | `nortear-design-system-<stack>/guidelines/08-display-components.md`, seção `## DataTable` |

**O que o auditor reporta hoje — 18 achados, exit 1** (medido em 2026-09-16, e
não 0 como a ordem desta escrita supunha):

| regra | stack | quantos |
|---|---|---|
| `lista_mais_curta_que_o_conteudo` | svelte | 2 (alta) |
| `inline_style_design_value` | svelte | 1 (alta, 4 valores) |
| `story_group_divergent` | cross-stack | 2 |
| `demonstration_labels_divergent` | vanilla, angular, svelte | 3 |
| `dodont_preview_sem_componente` | svelte, vanilla | 2 |
| `source_sem_teste` | angular | 1 |
| `story_file_sem_transform` | angular | 3 |
| `identificador_pt` (`estilo`) | as cinco | 5 (baixa) |

Dois deles merecem leitura antes de conserto: o `dodont_preview_sem_componente`
do **vanilla é falso positivo** (as quatro fábricas instanciam o componente), e o
`demonstration_labels_divergent` aponta como divergentes as **duas stacks que
fazem o certo** (item 15 da §7). O `identificador_pt` é o mesmo `const estilo` de
`getComputedStyle` nas cinco plays da legenda.

**E o que nenhum portão vê**: as 28 linhas da §7. Nem a folha dizer v8, nem as
classes inexistentes do Vue, nem a ausência de `caption` nos previews de quatro
stacks, nem as 21 chaves de rótulo copiadas quatro vezes.

> **REMEDIÇÃO DE 2026-09-22 — as doze pendências de 2026-09-16, uma por uma.**
>
> Antes de corrigir qualquer coisa, a passagem remediu as doze contra o HEAD.
> **Nenhuma tinha caído sozinha em seis dias, e uma tinha PIORADO** — a do
> comentário vencido do angular, que passou a descrever uma chave que a página
> nem lia mais. Vale como calibragem: pendência escrita e não endereçada não
> decai, e às vezes apodrece.

> **FECHADA · 2026-09-22 — a folha dizia "TanStack Table v8".** O docblock de
> `data-table.css` diz **9**, e registra por que a leitura errada custava: quem
> procura `getPaginationRowModel` não acha, porque no 9 o modelo paginado é
> recurso registrado. As quatro guidelines já tinham sido corrigidas em
> 2026-09-17; era só a folha que faltava.

> **FECHADA · 2026-09-22 — "todos os valores seguem o grid de 8" era falso, e a
> folha carregava seis exceções.** Cada uma agora se declara NA PRÓPRIA REGRA,
> como `badge.css` faz com os 12px do ícone: os limites do campo de busca
> (24rem/12rem) são medida de linha de texto; a largura do menu de colunas
> (16rem, em dois pontos) é medida de conteúdo; os 4px da alça de resize são
> área de agarre do ponteiro; os 14px do ícone acompanham o `--text-control` ao
> lado. O docblock parou de prometer o que a folha não cumpre.

> **FECHADA · 2026-09-22 — `height` numa célula virou `block-size`.** É o que
> `.nds-table-empty` já fazia, e o motivo está agora escrito na regra: numa
> célula `block-size` se comporta como MÍNIMO, então a mensagem de duas linhas
> cabe em vez de vazar (D11).

> **FECHADA · 2026-09-22 — dois pesos e uma sombra literais.** Os pesos leem
> `var(--font-weight-medium, 500)`, como `table.css` já fazia. A sombra leu
> `var(--elevation-md)` e a folha entrou na classificação da escada.
>
> **E o portão tinha uma exceção de premissa FALSA**, que era o que segurava a
> sombra: `SOMBRA_CRAVADA_DECLARADA` isentava o data-table como "sombra de
> rolagem do cabeçalho fixo", e `position: sticky` não aparece nesta folha uma
> vez sequer. A exceção saiu. Exceção com premissa que ninguém confere é como
> portão sem dentes: parece cobertura e não é.

> **FECHADA PELA METADE · 2026-09-22 — `-columns-btn` declarada duas vezes.**
> A folha tem **uma declaração por classe**, com a margem automática dentro
> dela e o motivo escrito: duas stacks emitem o nó de embrulho `-columns-wrap`
> e três não, e a margem é inerte para quem tem embrulho, porque o botão é
> `inline-flex` e margem automática não desloca elemento em linha.
>
> **A outra metade NÃO fechou, e fica declarada**: as cinco continuam sem
> emitir a mesma árvore de toolbar. Alinhar o embrulho é mudança de markup nas
> cinco e não coube nesta passagem.

> **FECHADA · 2026-09-22 — listas de teste mais curtas que o conteúdo.** react e
> svelte publicavam 8 dos 9 itens funcionais e 4 dos 6 de acessibilidade, e o
> que sumia era o `functional.item9`, que é o contrato C11. As cinco páginas
> agora **derivam os índices do dicionário**, como o angular já fazia — ninguém
> conta à mão, e por isso a próxima chave nova aparece sozinha.

> **FECHADA · 2026-09-22 — os previews não tinham nome acessível.** A
> demonstração e os previews das cinco recebem `caption`, com a fórmula
> idêntica `${demonstration.labels.caption} — ${sufixo}` e um sufixo por
> preview, no molde que o angular já usava (meia dúzia de tabelas com o mesmo
> nome é, na lista de tabelas, meia dúzia de tabelas sem nome).
>
> A chave base `demonstration.labels.caption` nasceu nesta passagem. E como o
> `regionLabel` lê a legenda, a camada que rola ganhou nome junto — o que fecha
> também a metade que `20-tabelas.md` cobrava e que nenhuma das cinco cumpria.

> **FECHADA · 2026-09-22 — duas classes que não existiam e um style inline.** O
> vue emitia `font-medium tabular-nums`, resíduo da era Tailwind sem regra por
> trás — não pintavam nada —, e o react resolvia o mesmo com `fontVariantNumeric`
> em `style` inline. As duas pontas agora usam `.nds-font-medium` e
> `.nds-tabular-nums`.

> **FECHADA · 2026-09-22 — as 21 chaves de rótulo copiadas em quatro stacks.**
> Decisão da dona: viraram `docs/shared/primitives/data-table-labels.ts`, e as
> quatro passaram a importar. O **angular segue com os moldes** dele (D8) —
> divergência de API de framework, registrada e não "alinhada".
>
> A premissa foi CONFERIDA antes de unificar, e não assumida: as quatro cópias
> eram idênticas a menos do estilo de aspas, e cada agente confirmou zero
> divergência ao apagar a sua. A do vanilla era a mais escondida — vivia dentro
> de `ui/data-table.ts`, sem nome de arquivo que a anunciasse.

> **PENDÊNCIA · 2026-09-16, REMEDIDA E DE PÉ em 2026-09-22** — o DataTable
> continua sem entrada em `docs/shared/figma/design-links.ts` e sem
> `figmaDesign` em story nenhuma. O maior componente do sistema é o que não tem
> component set.
>
> **Não a fechei registrando "a ausência é decisão"**, que era a segunda saída
> escrita aqui: ninguém decidiu isso, e dar nome de decisão a uma lacuna é a
> forma mais cara de fechá-la — some do radar sem ninguém ter escolhido nada.
> **Fecha quando**: uma rodada de `/figma-sync-component data-table` criar o
> component set e as stories declararem `figmaDesign`. Está no `FIXES-NEEDED.md`.

> **DECIDIDA E AGENDADA · 2026-09-22 — o rodapé de paginação passa a compor o
> componente Pagination.** A dona decidiu, e escolheu entre três formas a que
> **preserva a tela**: o `Pagination` cresce, o `DataTable` não se mexe.
>
> O que a rodada própria precisa fazer, já medido: `Pagination` ganha
> `showFirstLast` e `showPages`, mais um eixo de APARÊNCIA — sem ele a tela
> mudaria, porque `.nds-pagination-icon` é 36×36 transparente e o rodapé de hoje
> usa botão `outline`, com borda. O eixo mora no `Pagination`, não num seletor
> descendente em `data-table.css`: aparência é decisão do componente, não do
> vizinho que o hospeda.
>
> **Ponto aberto por decisão da dona**: o `Pagination` renderiza `<a href="#">`
> sem rota, e o rodapé da tabela nunca tem rota (confirmado: zero
> `nds-pagination` em arquivo `data-table` das cinco). Trocar `<button>` por
> âncora vazia num controle que age na própria página é recuo de semântica
> dentro de um avanço — e a decisão é da rodada do Pagination, não desta.

> **FECHADA · 2026-09-22 — o comentário vencido da docs page do angular, que
> tinha PIORADO.** Ele descrevia um `anatomy.structureCode.angular` já
> corrigido; a remedição achou o resto: a página **nem usava a chave** — passava
> um `ANATOMY_CODE` local, então a chave compartilhada, que estava correta, era
> invisível para quem lê. O contorno tinha virado permanente. O local saiu, o
> comentário saiu, e a página voltou a ler a chave compartilhada.

> **FECHADA · 2026-09-17** — a guideline do vanilla listava `cellClass` no meta de
> coluna, que o vanilla não lê, e omitia `headerLabel`, que ele lê em 8 pontos; a
> do vue nomeava `table-fixed` em vez de `.nds-table-fixed`. Com este PRD, a seção
> `## DataTable` das cinco guidelines passou a ser catálogo duplicado — é o que a
> regra `catalogo_duplicado_com_prd` cobra.
> **Fecha quando**: as cinco seções `## DataTable` saírem das guidelines de stack,
> ficando nelas só a mecânica própria daquela stack, e a regra da CATEGORIA
> (display) permanecer.
> **Como fechou (2026-09-17)**: as cinco seções viraram ponteiro para este PRD e
> para `docs/shared/guidelines/20-tabelas.md`, que é onde a regra da categoria
> ficou. A do vanilla passou a descrever o `meta` real, conferido no tipo; a do
> vue saiu inteira, com o nome errado da classe junto.
