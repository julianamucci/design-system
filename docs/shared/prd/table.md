# PRD — Table

> **Estado descrito**: 2026-09-16, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código vai usar este documento como base:
> o que está aqui foi medido nas cinco stacks, na folha compartilhada e no
> conteúdo, e as divergências entre stacks estão registradas em vez de resolvidas.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
>
> A regra da CATEGORIA — o que atravessa Table, DataTable e Pagination — está em
> [`20-tabelas.md`](../guidelines/20-tabelas.md). O que precisa de decisão da dona
> vai para a §"O que está aberto" de lá.

## 1. Identidade

Tabela de dados **semântica**: `<table>` nativo com as seções que o navegador e o
leitor de tela já entendem — `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`,
`caption` —, mais um contêiner que rola na horizontal quando a grade não cabe.

Não tem estado, não gerencia foco e não tem teclado próprio. O que ela acrescenta
ao HTML são três coisas: a folha `.nds-table`, o `data-slot` de cada peça, e dois
defaults de acessibilidade que ninguém precisa lembrar de escrever (`scope="col"`
no cabeçalho, `tabindex="0"` no contêiner que rola).

| vizinho | diferença que decide |
|---|---|
| DataTable | tem MOTOR: ordena, filtra, pagina e é dono do conjunto de linhas que aparece. No Table quem monta escreve as linhas, e a ordem é a do markup |
| Pagination | vive FORA da tabela, e navega entre recortes dos dados; nenhum arquivo `data-table*` de nenhuma stack o compõe |
| grade CSS | é o que se usa quando as células não se descrevem por uma linha ou coluna de cabeçalho — aí não é tabela, é layout |
| Chart | mesma família de "dado visto de uma vez", mas a informação vive no desenho; o Chart chega a vestir `.nds-table-wrapper` no modo de tabela de dados |

**A folha é a mais vestida por terceiros de toda a categoria.** Medido em
2026-09-16, `.nds-table` é composta por três outras folhas compartilhadas, e
nenhuma delas redeclara o que a `table.css` já diz:

- `data-table.css` — "Reusa .nds-table como base" (docblock), acrescenta toolbar,
  filtros, paginação e o `.nds-table-fixed` (`table-layout: fixed`);
- `markdown.css` — `.nds-markdown-table` delega o recorte e o `tabindex` ao
  wrapper do Table e fica só com o alinhamento que o TEXTO declarou (`|:--|--:|`);
- `docs-swatches.css` — eleva a especificidade para `.nds-table.nds-axis-density-table th`
  de propósito, porque o eixo de densidade precisa recomputar o padding a partir
  de um `--spacing-base` escopado.

Fora de `ui/table` e `ui/data-table`, os arquivos que mencionam `nds-table` são
**4 no react, 6 no vue, 5 no svelte, 4 no vanilla e 12 no angular**. E no vanilla
o consumo é mais forte que a classe: `DocsProps.ts` e `DocsTokens.ts` montam as
próprias tabelas com as fábricas do componente — editar `table.ts` alcança as
tabelas de propriedades e de tokens de **todas** as docs pages daquela stack.

## 2. Contrato de comportamento

Cada linha aponta a chave de `docs/shared/content/table/translations.json` que a
publica e a story que a mede. O conteúdo tem **265 chaves em cada um dos três
idiomas, sem nenhuma sobrando de um lado** (conferido em 2026-09-16), com
`testes.functional` em 7 itens, `testes.accessibility` em 4 e `testes.visual` em 6.

| # | o contrato | chave · onde é medido |
|---|---|---|
| C1 | A raiz é `<table>`, com `.nds-table` e `data-slot="table"`; `thead`, `tbody` e `tfoot` carregam `data-slot` próprio | `testes.functional.item1` · Playground das cinco — o `data-slot` é afirmado em react, vue, svelte e angular; o vanilla afirma a tag e a classe |
| C2 | O par é wrapper + tabela: `<div class="nds-table-wrapper" data-slot="table-container">` envolve a `<table>`, e é o wrapper que rola (`overflow-x: auto`) | `testes.functional.item5`, `notes.tip1` · `HorizontalScroll` das cinco, pelo `overflowX` COMPUTADO e por `scrollWidth > clientWidth` |
| C3 | O wrapper entra na ordem de tabulação (`tabindex="0"`) — região que rola e não recebe foco é inalcançável por teclado | `testes.functional.item5`, `accessibility.aria.tabIndex` · Playground e `HorizontalScroll` das cinco |
| C4 | Papel e nome do wrapper são CONDICIONAIS ao nome: com `regionLabel` saem `role="group"` e `aria-label`; sem ele, nenhum dos dois | — (o conteúdo não publica a prop) · `nortear-design-system-vanilla/src/components/ui/regiao-rolavel-nomeada.test.ts`, cinco casos de `table`. **Nenhuma story exercita** |
| C5 | O papel é `group`, nunca `region` — `region` com nome vira marco de página, e uma tela de relatório empilha tabelas | — · o mesmo portão, num caso que reprova `region` |
| C6 | `scope` nasce em `col` na peça de cabeçalho, nas cinco | `testes.accessibility.item1`, `accessibility.aria.scope` · Playground das cinco, que afirma o atributo sem nenhuma story o escrever |
| C7 | Coluna que não ordena NÃO emite `aria-sort` — nem `none` | `accessibility.aria.ariaSort` · Playground das cinco (`th.hasAttribute('aria-sort') === false`) |
| C8 | A legenda nunca sai do DOM: `nds-sr-only` a tira da tela e ela continua sendo o nome acessível da tabela | `testes.functional.item6`, `testes.accessibility.item2` · `CaptionSrOnly` das cinco, medida pelo EFEITO (`position: absolute` e caixa de no máximo 2px), nunca pelo nome da classe |
| C9 | A legenda é RENDERIZADA embaixo (`caption-side: bottom`) e LIDA antes das células, por ordem de DOM | `tokens.items.captionBottom` · nenhuma story mede — é declaração da folha |
| C10 | O cabeçalho tem PISO de 40px, nunca teto: `min-block-size`, para o rótulo não ser recortado quando a fonte do navegador cresce | `tokens.items.h10`, `anatomy.item6` · nenhuma story mede a altura do `th` |
| C11 | `nds-text-right` vale no `th` E no `td` — a coluna numérica alinha o rótulo junto com os números | `testes.visual.item1` · `Basic` e Playground das cinco, pelo `textAlign` COMPUTADO, com a coluna descritiva afirmada à esquerda no mesmo passo |
| C12 | O total vive no `tfoot`, com fundo próprio (`--muted` a 50%), e não entra na contagem de registros | `testes.functional.item3`, `testes.visual.item3`, `notes.tip4` · `WithFooter` das cinco, com a posição do `tfoot` conferida por `compareDocumentPosition` e o fundo comparado contra o do corpo |
| C13 | A linha marcada carrega `data-state="selected"` no `<tr>`, e quem pinta é a folha (`--muted` cheio) | `testes.functional.item4`, `testes.visual.item5`, `props.items.dataState` · `SelectedRow` das cinco, que também afirma a AUSÊNCIA do atributo nas outras linhas |
| C14 | Estado vazio é uma linha com `colspan` total e `.nds-table-empty`: 96px reservados, texto centralizado, cor apagada — e o cabeçalho continua de pé | `testes.functional.item2`, `testes.visual.item2`, `variants.items.withEmptyState`, `states.empty` · `Empty` das cinco; o angular mede só a centralização, porque não usa a classe (I2) |
| C15 | Carregando é esqueleto `aria-hidden` por célula dentro de uma região com `role="status"`, `aria-busy` e nome | `testes.functional.item7`, `testes.visual.item6`, `states.loading` · `Loading` das cinco |
| C16 | A última linha do corpo não desenha divisa, e a última do rodapé também não | — · nenhuma story mede |
| C17 | Célula com controle de marcação perde o padding à direita (`:has([role="checkbox"])`) | — · nenhuma story de `table` produz; o produtor vivo é o DataTable e a composição de seleção do angular |
| C18 | Linha com `aria-expanded="true"` pinta como se estivesse sob o ponteiro | — · **nenhum produtor em stack nenhuma** |
| C19 | O componente não dispara evento nenhum | `analytics.description` · — |

**Três contratos da folha não têm quem os prove** (C16, C17, C18) e **dois não têm
quem os exercite** (C4 e C5, a fiação do nome da região: o portão prova que as
cinco a têm, e nenhuma story, docs page ou snippet passa `regionLabel`).

## 3. Decisões fixadas

### D1 · `th` e `td` são seletores de ELEMENTO, de propósito

**Estado**: `:where(.nds-table) th` e `:where(.nds-table) td`, especificidade
(0,0,1). `:where()` não soma nada; a tag soma um elemento.
**Medição, registrada no comentário de `table.css:64-77`**: escrito
`.nds-table th` o seletor valia (0,1,1) e vencia qualquer utilitária, que é
(0,1,0) — `class="nds-text-right"` num `<th>` de coluna numérica era **inerte nas
cinco stacks** (react, vue, svelte e angular escreviam a classe; o vanilla nem
tentava). E empatar não bastava: `utilities.css` é importado **depois** de
`table.css` no `index.css` (linhas 123 e 58), então no empate quem vence é a
folha do componente. Rebaixar para elemento é o que devolve a última palavra a
quem escreve a classe no markup.
**Consequência medida**: as plays das cinco afirmam o alinhamento **computado**, e
não a presença da classe — markup verde com coluna torta foi o defeito real.
**O que ficou para trás**: a afirmação vencida ("não dá para alinhar o cabeçalho")
sobrevive em dois docblocks do DataTable do angular, e as próprias stories
daquela stack a contradizem.

### D2 · A altura do cabeçalho é PISO, e não teto

**Estado**: `min-block-size: var(--spacing-10)` (40px) no `th`, com o mesmo
padding do `td`, então a aparência no tamanho padrão não muda.
**Motivo**: com altura cravada o rótulo do cabeçalho é recortado quando a pessoa
aumenta a fonte do navegador (WCAG 1.4.4, guideline 12). É a regra da casa para
peça interativa, aplicada aqui à linha inteira.
**Onde está escrito**: comentário de `table.css:78-83`, e a linha `tokens.items.h10`
do conteúdo compartilhado diz "altura MÍNIMA … É piso, não teto" nos três idiomas.

### D3 · O estado vazio virou REGRA da folha

**Estado**: `.nds-table-empty` declara `block-size: var(--spacing-24)` (96px),
`text-align: center` e `--muted-foreground`.
**Medição que a criou, no comentário de `table.css:103-113`**: a altura existia
como medida solta em cada stack — `style="height:6rem"` no React (valor de design
em `style` inline, proibido aqui) e `h-24` no Svelte, **classe que não existe no
CSS**. A mensagem saía encostada à esquerda e sem caixa.
**Por que `block-size` e não `height`**: em célula de tabela `block-size` se
comporta como MÍNIMO — a caixa reserva a altura para o vazio não parecer defeito
de carregamento, e ainda acomoda mensagem de duas linhas.
**O que continua fora**: o angular não usa a classe (I2), e a docs page do próprio
vanilla crava `style.height = '4rem'` no lugar dela (I3).

### D4 · Uma só camada rola, e ela é a do primitivo

**Estado**: `.nds-table-wrapper` é dono do `overflow-x` e do `tabindex`. O
`.nds-data-table-scroll` do DataTable é MOLDURA — borda, raio e, no modo
virtualizado, a rolagem vertical.
**Medição registrada em `data-table.css:120-132`**: havia dois contêineres
roláveis aninhados; em duas stacks o interno era neutralizado por uma classe
criada para isso, e sobrava rolando um elemento **fora da ordem de tabulação** —
quem navega por teclado não alcançava as colunas fora da tela.
**Consequência prática**: nunca acrescentar wrapper próprio em volta do
componente. Nas quatro stacks de framework o wrapper vem de dentro — e a docs page
do react o envolve num segundo em 13 pontos (I1).

### D5 · O nome da região rolável é do CONTEÚDO, e sem nome não há papel

**Estado**: `regionLabel` existe nos cinco primitivos, **sem padrão**. Com nome
saem `role="group"` e `aria-label`; sem nome, nenhum dos dois.
**Três razões, escritas nos cinco docblocks**: (a) quem é nomeado é o WRAPPER, não
a `<table>` — um `aria-label` na tabela nomeia a TABELA, comportamento certo que
não se quer roubar; (b) padrão genérico ("Tabela") anunciaria sem informar: quem
chegou por Tab já sabe que rola, o que não sabe é O QUE rola; (c) `aria-label` em
elemento sem papel é atributo proibido, e o axe acusa `aria-prohibited-attr`.
**Por que `group` e não `region`**: `region` com nome vira marco de página, e uma
tela de relatório empilha várias tabelas — seriam vários marcos onde não há várias
seções. Quem quiser marco envolve a tabela num `<section>` nomeado.
**Portão**: `regiao-rolavel-nomeada.test.ts` mede a FONTE das cinco (o defeito é de
marcação e nasce no arquivo), com caso próprio para o papel, para a ausência de
`region`, para o nome vindo de variável e para nome genérico cravado.

### D6 · `scope` nasce na peça, e por isso não se escreve no markup

**Estado**: default `col` nas cinco (`createTableHead(..., scope = 'col')`,
`scope = "col"` em react e svelte, `withDefaults` no vue, `input('col')` no
angular). Cabeçalho de linha escreve `scope="row"` e sobrescreve — a forma nativa
continua sendo a forma certa de escrever.
**Motivo**: tabela sem `scope` é grade muda — o leitor de tela lê os valores sem
dizer de que coluna vieram (WCAG 1.3.1). O default está na peça, e não em cada
chamada, porque era exatamente o que cada story tinha de lembrar de escrever, e a
docs page não lembrava.
**Consequência medida**: dois arquivos de teste de snippet afirmam a AUSÊNCIA do
atributo de propósito (`table.source.test.ts` do vue e do svelte) — repetir o
default no exemplo ensinaria que a acessibilidade depende de alguém lembrar.
**O que contradiz isso hoje**: `notes.tip2` do conteúdo compartilhado, nos três
idiomas (§11).

### D7 · `aria-sort` só existe onde a coluna de fato ordena

**Estado**: nenhuma peça emite `aria-sort` por padrão. No angular há o input
`sort`, com default `undefined`; nas outras quatro o atributo é escrito à mão na
composição.
**Motivo, no docblock do `NdsTableHead`**: emitir `aria-sort="none"` em coluna que
não ordena anuncia uma capacidade que não existe.
**Onde é provado**: o Playground das cinco afirma `hasAttribute('aria-sort') === false`
em todo `th`.

### D8 · A legenda é obrigatória, e some da tela sem sair do DOM

**Estado**: `nds-sr-only` quando o título já está visível na página; nunca
`display: none`, que tiraria também da árvore de acessibilidade.
**Medição que endureceu a asserção**: o vanilla passava `'sr-only'`, sem prefixo —
classe que não existe neste projeto —, a legenda ficava VISÍVEL duplicando o
título, e a story antiga conferia o NOME da classe e ficava verde guardando o
defeito. Hoje as cinco medem o efeito: `position: absolute` e caixa de no máximo
2px.

### D9 · O total do rodapé é DERIVADO, nunca escrito à mão

**Estado**: `table.fixtures.ts` deriva o total das linhas em react, vue e vanilla
(no vanilla por `totalOf(rows)`, que serve também aos recortes de três linhas).
**Motivo, escrito nos três cabeçalhos de fixture**: número fixo continua verde
depois de alguém acrescentar uma linha, e o rodapé passa a mentir em silêncio —
"foi o que aconteceu na stack Svelte, com um `R$ 1.000,00` que não fechava com
conjunto de dados nenhum".
**Onde a decisão não valeu**: o angular crava `TOTAL = 'R$ 1.250,00'`, o svelte não
tem fixture, e o `R$ 1.000,00` citado ainda está vivo — num snippet da docs page
do svelte (I6).

### D10 · No angular a família inteira é DIRETIVA de atributo, e o wrapper é escrito por quem usa

**Estado**: nove diretivas de atributo, nenhuma com markup próprio nem
`<ng-content>`.
**Duas razões, no docblock de `table.ts`**: um `@Component` com
`template: '<ng-content />'` criaria view e ciclo de detecção para reemitir o que
já estava lá; e um `<ng-content>` dentro de `<tr>` arriscaria o parser de HTML
mover o conteúdo para fora da tabela. O DOM resultante é idêntico ao do Vanilla.
**A consequência é declarada como divergência de API, não de markup**: diretiva de
atributo tem o `<table>` como host e **não pode criar um pai**, então o
`<div ndsTableWrapper>` aparece no template de quem usa. O HTML final é o mesmo
nas cinco, e o snippet `anatomy.structureCode.angular` do conteúdo compartilhado
já contrata essa forma.
**Sem primitivo da lib**: `@radix-ng/primitives` não publica subcaminho `table`, e
não haveria o que compor — tabela é markup semântico nativo.

### D11 · No angular o `data-state` escrito à mão sobrevive ao host binding

**Estado**: `NdsTableRow` lê o atributo estático `data-state` **no construtor** e o
devolve quando `selected` é falso.
**Motivo**: host binding roda depois do atributo estático e o apagaria em
silêncio, e ler um `input()` no construtor não serviria — o binding de quem
consome ainda não foi aplicado. É a mesma raiz da regra de estilizar por classe e
nunca por `[data-slot]`.
**Onde é provado**: a `SelectedRow` do angular marca uma linha pelo input e outra
pelo atributo escrito, e afirma que as duas produzem o mesmo estado e a mesma cor.

### D12 · O componente não declara variável própria

**Estado**: `table.css` não define nenhuma custom property — só consome os tokens
globais (`--foreground`, `--muted-foreground`, `--muted`, `--border`,
`--spacing-*`, `--text-control`, `--font-weight-medium`).
**Consequência**: personalizar é redefinir o token no tema, e a tabela acompanha.
É o que o bloco de customização da docs page do angular diz por escrito, e o que
as outras quatro mostram ao redefinir `--muted` e `--muted-foreground`.

## 4. Anatomia

```
table-container              <div>, dono do overflow-x e do tabindex="0"
└── table                    <table>, .nds-table, border-collapse, 14px
    ├── table-caption        <caption> — obrigatória; renderizada EMBAIXO,
    │                        lida ANTES; .nds-sr-only quando o título já existe
    ├── table-header         <thead>
    │   └── table-row        <tr> — divisa inferior
    │       └── table-head   <th> — scope="col" por padrão, piso de 40px,
    │                        --muted-foreground, peso médio
    ├── table-body           <tbody>
    │   └── table-row        <tr> — realce sob o ponteiro; [data-state="selected"]
    │       └── table-cell   <td> — padding de 8px, --foreground
    └── table-footer         <tfoot> — fundo --muted/0.5, peso médio
        └── table-row        <tr>
            └── table-cell   <td> — o total, com colspan sobre as descritivas
```

Nove `data-slot`: `table-container`, `table`, `table-header`, `table-body`,
`table-footer`, `table-row`, `table-head`, `table-cell`, `table-caption`.

**O `data-slot` é atributo de CONTRATO, nunca de estilo** — nenhuma folha casa com
ele. O docblock do `table.ts` do vanilla registra por que ele existe: era a única
stack sem o atributo, e a diferença aparecia no DataTable, cujas plays procuram
`[data-slot="table"]` para provar que a grade é uma TABELA de verdade e não uma
pilha de divs.

**Duas peças que não são estruturais e aparecem nos exemplos**: a mensagem de vazio
(uma `table-cell` com `colspan` e `.nds-table-empty`) e o esqueleto de
carregamento (filho da célula, dentro de uma região que anuncia). Nenhuma das duas
é peça publicada — exceto no vue, que tem `TableEmpty` (I5).

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/table.css`, 139 linhas, lida linha a linha.
Instrumento: `node scripts/tabela-tokens.mjs table` — em 2026-09-16 ele compara 35
linhas (7 por stack) e fecha com **0 linhas que não fecham com a folha**.

| propriedade | valor | token |
|---|---|---|
| largura do wrapper e da tabela | 100% | **literal** `100%` — é a mecânica de ocupar o bloco, não medida de design |
| rolagem | horizontal, automática | **literal** `auto`, no wrapper |
| corpo do texto | 14px | `--text-control` |
| família | herdada | **literal** `inherit` |
| colapso da borda | colapsado | **literal** `collapse` — mecânica de tabela |
| divisa entre linhas | 1px sólidos | `--border`, com o `1px` **literal**: é hairline, o traço mínimo do sistema |
| divisa da última linha do corpo e do rodapé | nenhuma | **literal** `0` |
| realce sob o ponteiro | `--muted` a 50% | `--muted`, com a opacidade **literal** `0.5` |
| linha selecionada | `--muted` cheio | `--muted` |
| linha com disclosure aberto | `--muted` a 50% | `--muted` |
| fundo do rodapé | `--muted` a 50% | `--muted` |
| peso do cabeçalho e do rodapé | 500 | `--font-weight-medium`, com literal `500` de fallback |
| cor do cabeçalho | — | `--muted-foreground` |
| cor da célula | — | `--foreground` |
| piso de altura do cabeçalho | 40px | `--spacing-10` (D2) |
| padding do cabeçalho | 8px nos dois eixos | `--spacing-2` |
| padding da célula | 8px | `--spacing-2` |
| alinhamento do cabeçalho | à esquerda, vertical ao meio | **literais** `left` e `middle` — e é a declaração que a utilitária precisa vencer (D1) |
| quebra de linha em `th` e `td` | permitida | **literal** `normal` — e foi ela que vencia `.nds-whitespace-nowrap` antes do rebaixamento |
| padding da célula com controle de marcação | zerado à direita | **literal** `0` |
| legenda · margem superior | 16px | `--spacing-4` |
| legenda · cor e corpo | — | `--muted-foreground`, `--text-control` |
| legenda · lado | embaixo | **literal** `bottom` (C9) |
| estado vazio · caixa | 96px de piso | `--spacing-24` (D3) |
| estado vazio · alinhamento e cor | centralizado, apagado | **literal** `center` e `--muted-foreground` |

**Não há literal de COR e não há `height` em lugar nenhum da folha** — as duas
medidas de bloco são `min-block-size` no cabeçalho e `block-size` no estado vazio,
e as duas são piso (D2, D3).

**Sem sombra, sem raio e sem camada**: a tabela vive no plano da página, não lê
nenhum degrau de elevação nem `z-index`, e o único raio da categoria é o da
moldura do DataTable. É o que a separa da família de superfícies flutuantes.

**Um token lido e não listado por nenhuma das cinco tabelas de docs page**:
`--foreground`, que o `td` lê. O instrumento o aponta como candidato; hoje as
cinco páginas concordam em não listá-lo.

**Três tokens de escala global** entram por herança e não são ponto de
customização da peça: `--text-control`, `--spacing-4` e `--spacing-24`. A escada
de espaçamento inteira resolve a partir de uma base única, que os modos da coleção
de dimensão redefinem — é por ela que a tabela responde à densidade, e não por
atributo próprio.

**As cinco tabelas de tokens listam as mesmas 8 linhas**, e a divergência está só
na coluna "parte do componente", em três delas — o instrumento mede: `--border` é
atribuído a `TableHeader / TableBody / TableRow` em react e angular e a
`TableHeader / TableBody` em vue e svelte; `--muted` da linha selecionada aparece
como `TableRow`, `TableRow selected` e `TableRow[data-state="selected"]`; e
`--muted-foreground` inclui "empty state" em react, vanilla e angular e só
`TableCaption` em vue e svelte.

## 6. Estados

| estado | quando ocorre | o que muda | tem produtor? |
|---|---|---|---|
| Repouso | sempre | divisa entre linhas, cabeçalho apagado, célula em `--foreground` | sim, as cinco |
| Sob o ponteiro | `tbody tr:hover` | fundo `--muted` a 50% | sim na folha; **nenhuma story mede** |
| Selecionada | `data-state="selected"` no `<tr>` | fundo `--muted` cheio | sim — `SelectedRow` das cinco |
| Vazia | array sem itens | linha única com `colspan` total, 96px reservados, texto centralizado e apagado | sim — `Empty` das cinco, mas o angular sem a classe (I2) |
| Carregando | busca em curso | esqueleto por célula, `aria-hidden`, dentro de região `role="status"` + `aria-busy` + nome | sim — `Loading` das cinco. **Não há regra de folha**: o estado é inteiramente de composição |
| Rolando | tabela mais larga que a caixa | o wrapper rola e recebe foco | sim — `HorizontalScroll` das cinco |
| Com controle de marcação | `th`/`td:has([role="checkbox"])` | padding à direita zerado | **não** em `table`: o produtor vivo é o DataTable e a composição de seleção do angular |
| Com disclosure aberto | `tr:has([aria-expanded="true"])` | fundo `--muted` a 50% | **não — nenhum produtor em stack nenhuma** |

**`states` do conteúdo publica três configurações** (`empty`, `selected`,
`loading`), e a tabela acima tem oito linhas: as outras cinco são mecânica da
folha ou composição, não configuração da tabela.

## 7. API

O componente não tem eixo de variante. O que existe é a composição das peças, e
ela é igual nas cinco: wrapper → tabela → legenda → cabeçalho → corpo → rodapé.

| prop | onde | tipo | padrão |
|---|---|---|---|
| `regionLabel` | raiz | string | — (sem padrão, por decisão: D5) |
| `scope` | cabeçalho | `col \| row \| colgroup \| rowgroup` | `col` (D6) |
| `colspan` / `rowspan` | célula | number | — (atributo nativo) |
| `data-state` | linha | `"selected"` | — |
| classe extra | todas as peças | string | — |
| conteúdo | todas as peças | células, linhas, texto | — |

Não existe `size`, não existe densidade, não existe variante de cor, e nenhuma
peça declara custom property própria (D12).

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| react | oito componentes de função sobre a tag nativa, cada um com `React.ComponentProps<"tag">` e `cn(className)`. O `Table` é o único que renderiza dois elementos (wrapper + tabela) e o único com prop própria (`regionLabel`). Não usa `useRender` do base-ui: não há o que trocar de elemento |
| vue | nove SFCs, `class` + `<slot />`, sem `Primitive` da reka-ui — a tag é literal no template, porque trocar a tag mudaria a semântica. `TableHead` usa `withDefaults` para o `scope`; `TableEmpty` é peça própria que embrulha `TableRow` + `TableCell` e centraliza por `.nds-cluster`, com `colspan` padrão 1 |
| svelte | oito componentes com `ref` bindável, `class` e `restProps`; o índice exporta as formas curtas (`Root`, `Body`, `Head`…) ao lado das longas. O wrapper carrega `<!-- svelte-ignore a11y_no_noninteractive_tabindex -->`, porque a regra do compilador só aceita papel de widget e nem `region` nem `group` a dispensam |
| vanilla | sete fábricas, e o `createTable(extraClass?, regionLabel?)` devolve **o par** `{ wrapper, table }` — é a forma que torna impossível esquecer o contêiner que rola. `createTableHead(text, extraClass?, scope='col')` e `createTableCell(text, extraClass?, lang?)`; o `lang` existe só aqui, para célula cujo texto é identificador em outro idioma (WCAG 3.1.2), e é usado em quatro pontos das seções de docs |
| angular | nove diretivas de ATRIBUTO (D10), sem `@Component` e sem projeção. O wrapper é escrito por quem usa; `NdsTableRow` tem o input `selected` (`booleanAttribute`) e lê o `data-state` estático no construtor (D11); `NdsTableHead` tem `scope` e `sort`, e o tipo `TableSortDirection` só existe aqui. `colspan`, `rowspan` e `lang` não viram input — são atributos nativos |

**Onde a semântica é a mesma nas cinco**: as tags. Nenhuma stack renderiza `div`
no lugar de elemento de tabela, nenhuma injeta nó a mais, e o `data-slot` de cada
peça é idêntico — é o que faz a regressão visual comparar tabelas equivalentes e a
play do DataTable poder perguntar se a grade é uma tabela de verdade.

### Divergências medidas que NÃO são de framework

| # | o que difere | quem faz o quê | a maioria |
|---|---|---|---|
| V1 | peça publicada para o estado vazio | vue tem `TableEmpty` (nona peça, com `colspan` e centralização própria); react, svelte, vanilla e angular escrevem a linha à mão no call site | 4 de 5 sem a peça — e a referência é uma delas |
| V2 | classe do estado vazio | react, vue, svelte e vanilla emitem `.nds-table-empty`; o angular emite `nds-text-center nds-text-muted-foreground` em cinco pontos | 4 de 5 |
| V3 | árvore de stories | react, vue, svelte e vanilla têm 9 stories em 3 arquivos (1 + 5 + 3); o angular tem 12 em 4, com um `table-compositions.stories.ts` que só ele tem | 4 de 5 |
| V4 | painel Code | vanilla, vue e svelte têm construtor por story COM teste (16, 19 e 15 casos); o react tem oito construtores SEM teste; o angular tem UM, sem teste, e 11 das 12 stories publicam o template da story | 3 de 5 com teste |
| V5 | fixture | react, vue, vanilla e angular têm `table.fixtures.ts`; o svelte não tem — os dados vivem inline em nove componentes `.svelte` | 4 de 5 |
| V6 | total da fixture | derivado em react, vue e vanilla; cravado no angular (`TOTAL = 'R$ 1.250,00'`); escrito em cada arquivo no svelte | 3 de 5 derivam (D9) |
| V7 | `data-slot` nas asserções | react, vue, svelte e angular afirmam o atributo no Playground; o vanilla afirma só a tag e a classe — sendo a stack que introduziu o atributo | 4 de 5 |
| V8 | conjunto da demonstração | angular: cinco colunas, badge de status e botão de ação; react, vue, svelte e vanilla: quatro colunas de texto | 4 de 5 |
| V9 | dados da demonstração | vue lê 26 das 26 chaves publicadas, vanilla 19, svelte 14, angular 10 e react **7** — o react crava os dados em português no arquivo, e a demonstração dele não troca de idioma | nenhuma maioria (`demonstration_labels_sem_consenso`) |
| V10 | lista de testes renderizada | angular DERIVA do dicionário e publica 7 funcionais e 6 visuais; react, vue, svelte e vanilla param em 6 e 5, com a lista literal | 1 de 5 completo (`lista_mais_curta_que_o_conteudo`) |
| V11 | itens de `accessibility.aria.*` | react, svelte, vanilla e angular publicam os cinco; o vue não passa `items` para o container de acessibilidade | 4 de 5 |
| V12 | título da lista de teclado | `common.keyboardNav` em react e angular; `nav.accessibility` em vue e vanilla; literal `'Navegação por teclado'` no svelte | nenhuma maioria |
| V13 | tabelas de props | angular 10 (com `TableWrapper`, `selected` e `sort`), react 8, vue 5 (com `TableEmpty`), svelte 5, vanilla 5 (na forma de fábrica, com `text`/`extraClass`) | nenhuma maioria |
| V14 | `scope` como obrigatório | react, vue, svelte e vanilla marcam `Sim`; o angular marca `Não` com default `'col'` — e as cinco peças TÊM o default (D6) | 4 de 5 contra o próprio código |
| V15 | itens relacionados | angular publica 6 (é o único que publica `related.dataTable`, a chave que nomeia o irmão); vue, svelte e vanilla 5; react 4 (sem Avatar) | nenhuma maioria |
| V16 | descrição da seção de analytics | só o vue passa `analytics.description` ao container; as outras quatro publicam a tabela sem a frase que diz que a tabela é passiva | 4 de 5 omitem |

### Peças, por stack

| stack | peças |
|---|---|
| react | `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption` |
| vue | `Table`, `TableBody`, `TableCaption`, `TableCell`, **`TableEmpty`**, `TableFooter`, `TableHead`, `TableHeader`, `TableRow` |
| svelte | `Root`/`Table`, `Body`, `Caption`, `Cell`, `Footer`, `Head`, `Header`, `Row` (as duas formas exportadas pelo índice) |
| vanilla | `createTable` (devolve `{ wrapper, table }`), `createTableHeader`, `createTableBody`, `createTableFooter`, `createTableRow`, `createTableHead`, `createTableCell`, `createTableCaption`, tipo `Invoice` na fixture |
| angular | `NdsTableWrapper`, `NdsTable`, `NdsTableHeader`, `NdsTableBody`, `NdsTableFooter`, `NdsTableRow`, `NdsTableHead`, `NdsTableCell`, `NdsTableCaption`, tipo `TableSortDirection` |

### Inconsistências entre stacks, medidas em 2026-09-16

Nenhuma delas é vista por portão (§11), e nenhuma é defeito de texto: é o estado
do código hoje.

1. **A docs page do react envolve a tabela num SEGUNDO contêiner rolável, em 13
   pontos** — `<div className="nds-w-full nds-overflow-x">`, e
   `.nds-overflow-x` declara `overflow-x: auto`. O componente já traz o seu, que é
   o único focável; o de fora rola e não entra na ordem de tabulação. É exatamente
   o defeito que `data-table.css:120-132` registra como corrigido e que a
   guideline da categoria chama de erro mais caro. 1 de 5 (vue, svelte, vanilla e
   angular têm zero ocorrências). **Referência (vanilla): não envolve.**
2. **O angular não usa `.nds-table-empty`** (V2): a story `Empty`, a composição
   `FilterToolbar`, o snippet `EMPTY_CODE` e dois previews da docs page usam
   `nds-text-center nds-text-muted-foreground`. Os 96px de piso não são
   reservados, e a asserção daquela stack mede só a centralização — portão que não
   pode reprovar a parte que falta. 4 de 5 usam a classe.
3. **A docs page do vanilla crava altura em `style` inline no estado vazio** —
   `emptyCell.style.height = '4rem'` e `style.textAlign`, no par Do/Don't. É a
   referência, é o único caso de valor de design inline num estado vazio, e a
   classe existe **justamente** para matar esse defeito (D3). O `audit.mjs` vê
   quatro valores inline nessa página, sem saber que um deles é este.
4. **O botão de ação da docs page do vanilla usa classes mortas** —
   `btn btn-ghost btn-sm`, **zero declarações** em toda a `docs/shared/styles/nds/`.
   O mesmo arquivo importa `createButton` e o usa em três outros pontos. Resíduo da
   era shadcn, na stack de referência. 1 de 5.
5. **O svelte é a única stack sem fixture** (V5): nove componentes `.svelte` de
   story repetem os mesmos cinco registros, e os totais são escritos à mão em cada
   um. 4 de 5 têm `table.fixtures.ts`.
6. **O total do rodapé não fecha em quatro lugares, cada um por um motivo
   diferente**: a demonstração do react soma R$ 1.400,00 em dados locais e exibe a
   chave de R$ 1.250,00; o preview da variante "com rodapé" mostra R$ 1.250,00
   sobre três linhas no vanilla e no angular e sobre duas no svelte; e o snippet
   `codeWithFooter` da docs page do svelte ainda diz **R$ 1.000,00**, o número que
   a fixture do react cita por escrito como o defeito que a derivação veio
   resolver (D9). Fecham: a demonstração de vue, svelte, vanilla e angular, e os
   previews de react e vue.
7. **`regionLabel` existe nos cinco e é exercido em zero**: nenhuma story, docs
   page ou snippet passa a prop, então o contêiner que rola nunca recebe papel nem
   nome em exemplo publicado (C4, C5). O portão prova a FIAÇÃO das cinco, não o
   uso — e o axe não cobra nada quando falta o nome.
8. **Três contratos da folha não têm produtor nenhum**: o realce sob o ponteiro
   (sem story que o meça), a célula com controle de marcação e a linha com
   `aria-expanded="true"` — esta última sem produtor em stack alguma, em nenhum
   arquivo de `table`.
9. **O angular é a única stack com stories de composição** (V3), e o comentário do
   arquivo afirma que a quarta composição ficou de fora porque "o componente
   Pagination ainda não existe aqui" — o `pagination.ts` daquela stack publica
   oito diretivas, e a própria `TableDocs.ts` dela importa sete delas. Premissa
   vencida sobrevivendo em comentário. 1 de 5.
10. **A demonstração não tem dois conjuntos iguais de rótulos** (V9), e a
    consequência visível é do react: "Pago", "Cartão de crédito" e os valores saem
    em português nos três idiomas, porque a página crava os dados em vez de ler as
    26 chaves publicadas. Vue lê todas as 26.
11. **A lista de testes é truncada em quatro das cinco** (V10): o `functional.item7`
    (carregando) e o `visual.item6` (esqueletos preservando a grade) existem no
    conteúdo, são medidos pela story `Loading` das cinco, e **não existem para
    quem lê** a página em react, vue, svelte e vanilla. Só o angular deriva do
    dicionário.
12. **O painel Code do angular publica o template da story em 11 das 12** (V4) —
    incluindo `@for`, binding de renderer e o andaime das fixtures —, e é a única
    parte da página feita para ser copiada. React e angular não têm
    `table.source.test.ts`.
13. **As tabelas de props descrevem cinco componentes diferentes** (V13), e quatro
    delas afirmam que `scope` é obrigatório (V14) contra o default que as cinco
    peças têm. O angular é o único que documenta o wrapper explícito — e ele
    precisa documentar, porque naquela stack quem o escreve é quem usa (D10).
14. **A grafia do rótulo de ação diverge**: "Ações para fatura #INV-001" em react,
    vue, svelte e vanilla; "Editar fatura #INV-001" no angular, que também troca o
    conteúdo do botão por ícone de lápis. 4 de 5.
15. **O método de pagamento das fixturas não é nenhuma das chaves publicadas**:
    react, vue, svelte e vanilla usam "Boleto bancário", e o conteúdo publica
    `bankTransfer` = "Transferência bancária" — que é o que o angular usa. 4 de 5
    contra a chave.
16. **A seção de acessibilidade do vue não publica os cinco itens de ARIA** (V11),
    e o título da lista de teclado sai de três lugares diferentes nas cinco (V12).
17. **Só o vue publica a frase que diz que a tabela é passiva** (V16) — as outras
    quatro mostram a tabela de três eventos sem a descrição.
18. **`lang` na célula só existe no vanilla** e `sort` só no angular: divergência
    de API de framework, registrada e não alinhada. Nas outras stacks os dois são
    atributos nativos escritos no markup.
19. **A composição "cabeçalhos ordenáveis" é escrita de três formas**: `aria-sort`
    à mão na docs page (react, vue, svelte, vanilla), input `sort` na diretiva
    (angular), e no vanilla o botão do cabeçalho recebe `style.marginLeft` e
    `style.height` inline — dois dos quatro valores de design inline daquela
    página.

## 8. Acessibilidade

**Atributos**: os que o HTML já tem, mais três que a peça escreve. `scope="col"`
por padrão no cabeçalho (D6); `tabindex="0"` no contêiner que rola (C3); e
`role="group"` + `aria-label` no mesmo contêiner **somente** quando `regionLabel`
chega (D5). `aria-sort` sai apenas onde a coluna de fato ordena (D7).

**Teclado**: nenhum próprio. `Tab` alcança o contêiner que rola (e as setas rolam
a caixa) e os controles dentro das células; `Enter` ativa o controle com foco;
`Espaço` marca o controle de seleção. Célula de dado passiva não recebe foco — é
o que o conteúdo compartilhado publica em `accessibility.keyboard.noKeyboard`.

**Leitor de tela**: a legenda é anunciada antes das células e dá o nome da tabela;
o `scope` liga cada valor à coluna de onde veio; a mensagem de vazio é lida como
conteúdo da linha; o esqueleto é mudo e quem anuncia a espera é a região em volta.

**O que deliberadamente NÃO se faz**:

- **não se acrescenta wrapper próprio** em volta do componente (D4) — duas camadas
  roláveis aninhadas deixam rolando a de fora, que não está na ordem de tabulação;
- **não se emite papel sem nome** no contêiner que rola, porque `aria-label` em
  elemento sem papel é atributo proibido (`aria-prohibited-attr`);
- **não se usa `region`** onde o componente se repete na tela (D5);
- **não se crava nome genérico** ("Tabela", "Área de rolagem"): quem chegou por Tab
  já sabe que rola, o que não sabe é o que rola — e o portão reprova os genéricos
  por nome;
- **não se emite `aria-sort="none"`** em coluna que não ordena (D7);
- **não se esconde a legenda com `display: none`** (D8), que a tiraria também da
  árvore de acessibilidade;
- **não se deixa a coluna de ações sem cabeçalho**: sem ele a coluna existe para
  quem vê e some para quem navega por cabeçalhos. Quem sai da tela é o RÓTULO, num
  `<span class="nds-sr-only">` — a classe no próprio `th` tiraria a célula do
  fluxo e desmontaria a grade;
- **não se repete o nome do controle de ação**: cinco botões "Ações" são cinco
  controles indistinguíveis na lista do leitor de tela (WCAG 4.1.2), então o nome
  carrega o identificador da linha;
- **não se usa tabela para layout**: sem cabeçalho que descreva as células, o
  leitor anuncia coordenadas para conteúdo que não tem eixo.

**Movimento**: `table.css` não anima nada — não há `transition`, `animation` nem
bloco de `prefers-reduced-motion`, e não há o que reduzir.

## 9. Analytics

| evento | quem dispara hoje | payload |
|---|---|---|
| `docs_page_view` | as cinco docs pages | `{ component_name: "table", locale, page_title }` |
| `docs_section_viewed` | as cinco docs pages | `{ section_id, component_name: "table", locale }` |
| `language_switched` | o seletor de idioma das cinco | `{ previous_language, new_language }` |

**O componente é passivo e não dispara nada.** Nenhum dos cinco primitivos importa
`track`, e as três linhas publicadas são o tracking da própria docs page. O que
acontece DENTRO da tabela é instrumentado por quem compõe: `button_click` no botão
de ação por linha, `navigation_click` no link em célula — é o que
`analytics.description` do conteúdo compartilhado diz, e essa frase só chega ao
leitor na página do vue (V16).

**Ordenação, filtro e seleção não têm evento próprio**, e isso é decisão de
categoria: quem sabe o que a tabela mostra é quem a monta.

## 10. Reconstruir do zero

Ordem: folha → peças → stories → docs page.

- **Comece pelo par wrapper + tabela**, e faça a fábrica (ou o componente)
  devolver os dois juntos (D4). Quem deixa o contêiner para o call site ganha, na
  primeira semana, ou uma tabela que empurra a página para o lado ou dois
  contêineres roláveis aninhados.
- **Rebaixe `th` e `td` para especificidade de ELEMENTO** com `:where()` (D1) —
  sem isso toda utilitária de alinhamento e de quebra de linha escrita no markup é
  inerte, e nenhum compilador reprova.
- **`min-block-size`, nunca `height`** no cabeçalho (D2); e no estado vazio,
  `block-size`, que em célula é mínimo (D3).
- **`scope` nasce na peça** (D6) e `aria-sort` só onde ordena (D7).
- **O nome da região é do conteúdo** e vem com papel `group`, os dois
  condicionais (D5). Se a prop não chegar, não escreva nem um nem outro.
- **A legenda é obrigatória** e só desaparece por `nds-sr-only` (D8).
- **O total é derivado dos dados** (D9), e mora no `tfoot`.
- **Meça o EFEITO, não a classe**: alinhamento computado, `position` da legenda,
  cor de fundo da linha marcada. Três defeitos desta família passaram verdes
  afirmando markup — a classe sem prefixo, a classe inexistente e a utilitária
  vencida.
- **Armadilha por stack**: no react o `Table` é o único que renderiza dois
  elementos, e a prop de nome é dele; no vue a tag é literal de propósito (trocar
  mudaria a semântica, não o estilo); no svelte o `tabindex` no wrapper exige a
  diretiva que cala a regra do compilador, que só aceita papel de widget; no
  vanilla `createTable` devolve `{ wrapper, table }` e é o `wrapper` que vai para
  a página; no angular a família é de diretiva de atributo, o wrapper é escrito por
  quem usa, e o `data-state` estático precisa ser lido no construtor, senão o host
  binding o apaga.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, divisas, estado vazio, rodapé | `docs/shared/styles/nds/table.css` |
| texto, props, tokens, critérios de teste | `docs/shared/content/table/translations.json` |
| regra da CATEGORIA (tabelas) | [`20-tabelas.md`](../guidelines/20-tabelas.md) |
| mecânica de cada stack | `nortear-design-system-<stack>/guidelines/08-display-components.md` |
| nome e papel da região que rola | `nortear-design-system-vanilla/src/components/ui/regiao-rolavel-nomeada.test.ts` |
| portões determinísticos | `node scripts/audit.mjs table --json` |
| instrumento de tokens | `node scripts/tabela-tokens.mjs table` |
| desenho e anotações | **não existe**: nenhuma das 22 páginas do arquivo do Figma é de tabela, e `docs/shared/figma/design-links.ts` tem 51 entradas e nenhuma para `table` |

**O `audit.mjs` NÃO está verde neste slug**, e isto corrige a premissa com que esta
escrita começou. Medido em 2026-09-16, ANTES de este arquivo existir,
`node scripts/audit.mjs table --json` já saía com código 1 e **22 achados**: oito
de `lista_mais_curta_que_o_conteudo` (I11), quatro de `inline_style_design_value`
(I3, I19), quatro de `identificador_pt` (`meses`), três de
`story_file_sem_transform` (I12), dois de `source_sem_teste` (react e angular) e um
de `demonstration_labels_sem_consenso` (I10).

**Com este arquivo são 27**, e os cinco novos são os do
`catalogo_duplicado_com_prd` da pendência abaixo — previstos aqui antes de medir, e
confirmados um por stack. A primeira versão desta seção causou mais dois, de
`prd_token_sem_lastro`: a tabela da §5 nomeava `--elevation-*` (para dizer que a
folha NÃO o lê) e `--spacing-base` (que a folha alcança apenas por dentro da
escada). A regra lê só a §5 e não distingue menção de afirmação — está certa, e
quem estava frouxo era o texto: os dois nomes saíram da tabela de geometria e o
fato ficou.

**O que nenhum portão vê é o resto.** Das 19 inconsistências da §7, o auditor
enxerga quatro — e sempre pela borda: ele conta itens de lista, acha `style`
inline e nota a ausência de um arquivo de teste. **Não existe portão** para a
segunda camada rolável (I1), para a classe de estado vazio não usada (I2), para as
classes mortas (I4), para o total que não fecha (I6), para a prop de nome nunca
exercida (I7), para o contrato de folha sem produtor (I8) nem para a premissa
vencida em comentário (I9).

**A tabela de tokens fecha, e é o único eixo que fecha**:
`node scripts/tabela-tokens.mjs table` dá 0 linhas divergentes nas cinco, com as
mesmas 8 linhas publicadas — a divergência que sobra é de descrição, na coluna
"parte do componente" (§5).

### O conteúdo compartilhado se contradiz em quatro pontos

Medido em 2026-09-16, nos três idiomas:

1. **`notes.tip2` afirma o oposto do código**: "`scope="col"` no `TableHead` não é
   adicionado automaticamente pelo componente — você deve incluir em cada `<th>`
   manualmente". As cinco peças têm o default `col` (D6), o Playground das cinco
   afirma o atributo **sem nenhuma story o escrever**, e dois testes de snippet
   cobram a AUSÊNCIA dele no exemplo. A mesma orientação redundante está em
   `usage.guidelines.item3`, `anatomy.item6`, `props.items.scope` e
   `accessibility.aria.scope` — e é ela que faz quatro docs pages marcarem `scope`
   como obrigatório (I13).
2. **`anatomy.item2`, `item3` e `item7` descrevem a folha em sintaxe Tailwind**:
   `[&_tr]:border-b`, `[&_tr:last-child]:border-0`, `p-2`, `align-middle`. Nada
   disso existe no projeto desde a migração `.nds-*`; a folha declara
   `border-bottom` por descendência e `padding: var(--spacing-2)`. O `item6`, ao
   lado, já foi corrigido e diz "altura MÍNIMA de 40px".
3. **`related.dataTable` nomeia uma lib que duas stacks não usam**: "usa Table
   internamente com TanStack Table". O DataTable do angular é escrito em signals,
   sem lib de tabela headless, e o do vanilla também não a usa. Texto descritivo
   compartilhado não pode citar a API de um subconjunto das stacks.
4. **`seo.aiSummary` crava "8 subcomponentes"**, e a contagem depende da stack: 8
   em react e svelte, 9 no vue (com `TableEmpty`) e 9 diretivas no angular (com o
   wrapper explícito). No vanilla são 7 fábricas para 8 nós, porque a primeira
   devolve duas peças.

> **FECHADA · 2026-09-17** — escrever este PRD ARMOU o
> `catalogo_duplicado_com_prd` contra as cinco guidelines de stack: a regra só
> cobra quando o arquivo `docs/shared/prd/<slug>.md` existe, e as cinco
> `08-display-components.md` tinham a seção `^## Table$` (41 linhas no angular, 46
> no react, 25 no svelte, 43 no vanilla, 47 no vue). O auditor passou a reportar
> cinco achados novos para o slug.
> **Fecha quando**: `catalogo_duplicado_com_prd` não reportar `table` — isto é,
> quando as cinco seções `## Table` tiverem saído, ficando em cada stack só a
> mecânica própria (fábricas, diretivas, wrapper local) sob outro título.
> **Como fechou (2026-09-17)**: as cinco seções viraram ponteiro para este PRD e
> para `docs/shared/guidelines/20-tabelas.md`, com a mecânica da stack sob título
> próprio. O regex exato do portão não casa o título novo, mas quem prova o
> fechamento é o CONTEÚDO que saiu, não o contador — o título renomeado sozinho
> escaparia do mesmo jeito com o catálogo inteiro dentro.

> **PENDÊNCIA · 2026-09-16** — a prop `regionLabel` existe nas cinco stacks e não
> é passada em nenhum exemplo publicado: o contêiner que rola nunca ganha papel
> nem nome em story, docs page ou snippet (I7). Falta decidir se a docs page deve
> nomear a região — e com que texto, já que o nome é do CONTEÚDO e não do
> componente.
> **Fecha quando**: as cinco stories de rolagem horizontal passarem `regionLabel`
> e afirmarem `role="group"` mais o nome acessível, ou a decisão de não nomear em
> exemplo ficar escrita aqui com a premissa verificada.

> **PENDÊNCIA · 2026-09-16** — três regras da folha não têm produtor (I8), e uma
> delas, `tr:has([aria-expanded="true"])`, não tem produtor em stack nenhuma nem no
> DataTable. Falta decidir se ela descreve um recurso que o Table deve ter (linha
> expansível) ou se é resíduo a remover.
> **Fecha quando**: existir story que produza a linha com disclosure aberto nas
> cinco, ou a regra sair de `table.css`.
