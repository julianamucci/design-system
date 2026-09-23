# PRD — Pagination

> **Estado descrito**: 2026-09-16, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código vai usar este documento como base:
> o que está aqui foi medido nas cinco stacks, na folha compartilhada e no
> conteúdo, e as divergências entre stacks estão registradas em vez de resolvidas.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
>
> **É a primeira descrição unificada do componente, mas não a primeira descrição.**
> Ao contrário do que a abertura da categoria supôs, o Pagination TEM catálogo em
> guideline: `## Pagination` existe nas cinco `05-navigation-components.md` — é
> componente de **navegação**, não de tabelas, e é por isso que ninguém o
> encontrava em `08-display-components.md`. As cinco cópias divergem entre si e
> do código; a medição está na §11, e o `catalogo_duplicado_com_prd` passa a
> reportá-las no minuto em que este arquivo existe.

## 1. Identidade

Faixa de navegação entre páginas de um conjunto **finito e conhecido** de
resultados. Publica a página atual, as vizinhas, os extremos e dois controles
direcionais; o que ela não faz é guardar qual página está aberta — esse estado é
de quem consome, nas cinco stacks.

É um `<nav>` nomeado, e é a única peça da categoria cujo conteúdo é uma lista de
destinos numerados: `<ul>` de `<li>`, cada um com um controle. A numeração é o
ponto — quem só precisa avançar não precisa de Pagination.

| vizinho | diferença que decide |
|---|---|
| Breadcrumb | também é `<nav>` com `aria-current="page"`, mas descreve a posição numa HIERARQUIA; aqui as páginas são irmãs e intercambiáveis |
| Tabs | alterna painéis presentes na mesma tela; a paginação troca o CONTEÚDO por um recorte novo, e o total dela é aritmética, não um conjunto redigido |
| Stepper | tem ordem obrigatória e progresso; aqui a pessoa pode pular para a página 12 sem passar pelas onze |
| Carregar mais / rolagem infinita | servem quando o total é desconhecido; o conteúdo compartilhado manda usar os dois nesse caso (`usage.dont.item3`) |
| DataTable | consome esta faixa no rodapé (`enablePagination`, default `true`, nas cinco guidelines de display) — é o consumidor interno, não um irmão |

**O consumidor interno é o rodapé de tabela, e ele é a razão de metade das
decisões desta folha.** O `data-align` (D1) existe para esse caso, e a
composição que o demonstra é a única story da família que monta um layout em
volta da faixa.

## 2. Contrato de comportamento

Cada linha aponta a chave de `docs/shared/content/pagination/translations.json`
que a publica e a story que a mede. O dicionário tem **235 chaves em cada um dos
três idiomas** (pt-BR, en, es — conferido em 2026-09-16, contagem idêntica nos
três). A sonda compartilhada é `docs/shared/testing/pagination-probe.ts`, e as
dez stories que a consomem são as `-states` e as `-variants` das cinco stacks.

| # | o contrato | chave · onde é medido |
|---|---|---|
| C1 | A raiz é `<nav>` com `role="navigation"` explícito e nome acessível em português (`Paginação` por padrão nas cinco) | `accessibility.items.item1`, `accessibility.aria.navLabel` · Playground das cinco |
| C2 | O conteúdo é `<ul>`, e cada controle mora num `<li>` próprio | `anatomy.item2`, `anatomy.item3` · Playground das cinco, pela sonda (`list.tag`, `list.items`) |
| C3 | Sete `data-slot` compõem o contrato de markup: `pagination`, `-content`, `-item`, `-link`, `-previous`, `-next`, `-ellipsis` | `anatomy.item1` a `item6` · `measurePagination` busca por esses seletores, e campo `null` é o achado |
| C4 | Exatamente UM link carrega `aria-current="page"`, e ele também recebe `data-active="true"` | `accessibility.items.item2`, `accessibility.aria.current` · `Active` das cinco — o vanilla afirma a contagem (`querySelectorAll` igual a 1) |
| C5 | Todo link numerado tem nome com contexto (`Ir para página N`); o número sozinho não é nome | `accessibility.items.item3`, `accessibility.aria.linkLabel` · Playground das cinco |
| C6 | Prev e Next estão SEMPRE presentes; nos extremos ficam desabilitados, nunca escondidos | `usage.guidelines.item4`, `states.lastPage.behavior` · `Disabled` (react, vue, svelte), `DisabledFirst`/`DisabledLast` (vanilla), `FirstPage`/`LastPage` (angular) |
| C7 | Desabilitado barra o PONTEIRO e o TECLADO — os dois, por mecanismos diferentes | `notes.item2` · as mesmas stories, medindo `pointerEvents` computado mais `tabindex="-1"` ou `disabled` nativo |
| C8 | Clique no controle desabilitado não chama o callback de quem consome | `testes.functional.item2`, `item3` · as mesmas stories, com espião de módulo |
| C9 | A página atual não navega para si mesma | — · `Active` do vanilla (`fireEvent.click` no `[aria-current]`, espião não chamado). A guarda é de quem trata o clique, não do CSS (D4) |
| C10 | As reticências são decorativas (`aria-hidden="true"`) e o conteúdo é o caractere `…` (U+2026) como TEXTO | `accessibility.items.item5`, `notes.item3`, `usage.uxWriting.table.ellipsis` · sonda (`reticencias.text`, `ariaHidden`) |
| C11 | Até 7 páginas a faixa mostra todos os números; de 8 em diante colapsa e mantém primeira, última, atual e as duas vizinhas | `usage.guidelines.item3`, `variants.items.simple`, `variants.items.withEllipsis` · `WithEllipsis` das cinco |
| C12 | O texto de todo controle alcança 4.5:1 contra o fundo em que ele aparece | `testes.accessibility.item2` · `Contrast` das cinco, por `rangeContrastes` — o vanilla afirma sete controles medidos e lista vazia abaixo de 4.5 |
| C13 | Todo controle alcança o alvo de toque de 24×24 px CSS (WCAG 2.5.8) | `testes.accessibility.item6` · `Contrast` das cinco, por `minimumTargetsBelow` |
| C14 | O foco por teclado desenha anel visível em qualquer controle, inclusive no da página atual | `testes.accessibility.item3`, `accessibility.items.item6` · `Focus` (react, vue, svelte, vanilla), `FocusVisible` (angular) |
| C15 | Tab percorre os controles na ordem do DOM, que é a ordem visual, e salta o desabilitado | `testes.functional.item4`, `accessibility.keyboard.tab` · `Focus` do vanilla e Playground de react, vue, svelte e angular |
| C16 | O rótulo textual de Prev/Next some abaixo de 40rem e o nome acessível NÃO muda | `notes.item4` · `Directional` de react e angular afirmam o texto do rótulo; **ninguém afirma o ponto de quebra** |
| C17 | Alinhada a uma ponta, a faixa ocupa só o que precisa e divide a linha com o contador de resultados | — (sem chave publicada) · `CompleteTable` de react, vue, svelte e vanilla, medindo `justifyContent` e a largura contra a do pai |
| C18 | Nenhuma stack guarda a página: quem muda é quem consome, e a faixa é remontada ou re-renderizada com o valor novo | `variants.items.interactive` · `Controlled` (react, vue, svelte), `Interactive` (vanilla, angular) |

**Três afirmações do conteúdo compartilhado não têm produtor em nenhuma stack** e
ficam registradas aqui em vez de na §6: o ponto de quebra de 40rem (C16), a
guarda de `prefers-reduced-motion` da folha, e o alinhamento `start` do
`data-align` — o snippet de anatomia do vanilla ensina `align: 'start'`, e
nenhuma story ou docs page renderiza esse valor.

## 3. Decisões fixadas

### D1 · `data-align` governa TRÊS propriedades de uma vez

**Estado**: sem atributo, a faixa é um bloco de largura total, centrado
(`width: 100%`, `margin-inline: auto`, `justify-content: center`). Com
`data-align="start"` ou `"end"`, os três mudam juntos: `width: auto`,
`margin-inline: 0`, e o `justify-content` vai para a ponta.
**Motivo, escrito no comentário da própria regra**: num rodapé de tabela a faixa
divide a linha com o contador de resultados, e aí os três defaults trabalham
CONTRA — a largura total empurra o contador, a margem automática recentra e o
`justify-content` ignora a borda. Quem alinha a faixa a uma ponta quer que ela
ocupe só o que precisa, então o atributo não pode governar um dos três.
**Medição que o justifica**: antes disto o rodapé era escrito com três
utilitários de força de um framework que saiu do projeto — classes inertes. O
layout que a composição documentava **nunca chegou à tela**: a faixa ocupava a
linha inteira e ficava centrada. Está escrito nos comentários das quatro
composições `CompleteTable` e no `PaginationStory.svelte`.
**Onde está escrito**: bloco de comentário antes de
`.nds-pagination[data-align="start"]`, em `docs/shared/styles/nds/pagination.css`.

### D2 · `min-height: var(--size-lg)` é PISO de alvo de toque, não teto

**Estado**: `min-height`, com o comentário `36px de alvo de toque, nao teto` na
mesma linha. Nenhum `height` na regra do link.
**Regra da casa que isso executa**: peça interativa nunca tem altura fixa — ela
cresce com a fonte do navegador (WCAG 1.4.4, Resize Text 200%). O piso responde
por WCAG 2.5.8, que é o que a `Contrast` das cinco mede por
`minimumTargetsBelow`.
**Onde o piso é conferido por densidade**: a
`escala-de-espacamento.stories.ts` do vanilla usa `.nds-pagination-link` como
uma das sondas da escada, medindo `min-height` contra `--size-lg`. É a única
stack com essa prova, porque é a única que emite a classe (D6).
**Consequência não resolvida**: nas outras quatro o número é 36px **fixo**, de
altura e de largura, porque o link numerado herda `.nds-button-icon` — e ali o
`height` é cravado, com o comentário do `button.css` dizendo que não viola 1.4.4
"porque não há texto a ser cortado". No link de paginação há texto: é o número
da página. Ver V6.

### D3 · O realce da página atual é o accent a 20%, e o hover a 10%

**Estado**: `:hover` pinta `--accent / 0.1` com texto `--accent-foreground`;
`[aria-current="page"]` pinta `--accent / 0.2` com o mesmo texto. Os dois alfas
são literais, na folha, e a diferença entre eles é a única coisa que separa
"sob o ponteiro" de "é aqui que você está".
**Medição que o alfa exige**: a sonda compõe as camadas antes de medir
(`backgroundEffective`), e o docblock dela registra por quê — enquanto ela
descartava o alfa, a página atual era medida contra o accent OPACO e dava
2,2:1, o mesmo número que o portão de paleta já havia marcado como par opaco.
Composta, a mesma superfície dá 9,9:1.
**Onde está escrito**: regra `.nds-pagination-link:hover` e
`[aria-current="page"]` da folha; a aritmética está em
`docs/shared/testing/pagination-probe.ts`.
**O que NÃO vale nas outras quatro**: elas não passam por essa regra. O realce
delas é a variante `outline` do botão — fundo de página, borda visível e relevo.
Ver V5.

### D4 · `pointer-events: none` SAIU do `[aria-current="page"]`

**Estado**: a regra da página atual pinta e nada mais.
**Motivo registrado na folha**: o bloqueio valia só para a forma standalone —
nas quatro stacks que compõem o link em cima do botão, o mesmo link continuava
clicável e hoverável, porque a regra que o barraria não alcança aquele elemento.
E, no único stack em que se aplicava, ela ainda tirava o hover.
**Quem impede a página atual de navegar para si mesma**: a guarda de quem trata
o clique. No vanilla é `if (!isCurrent) onPageChange?.(page)`, dentro do próprio
ouvinte da fábrica; é o que a `Active` do vanilla mede (C9).
**Forma de defeito que isso corrige**: CSS que promete comportamento. O bloqueio
de ponteiro é visual-adjacente e não impede Enter, clique por script nem
`click()` de teste — o mesmo raciocínio que sustenta D8.

### D5 · O seletor do recuo assimétrico precisou de `.nds-button` para EXISTIR

**Estado**: `.nds-pagination-prev, .nds-button.nds-pagination-prev` — e o par
equivalente para `-next`.
**Medição, e é o achado mais caro desta folha**: sozinhas, essas classes são
(0,1,0) e perdiam para `.nds-button:has(> svg)`, que é (0,1,1) e declara o
padding lateral do botão com ícone. O recuo de `--spacing-1-5` do lado do ícone
— a razão de as duas classes existirem — **nunca se aplicou** em react, vue,
svelte nem angular, que são justamente as quatro stacks que as emitem. Com
`.nds-button.` o seletor vira (0,2,0) e ganha.
**A forma sem `.nds-button` ficou na folha, e hoje não tem produtor nenhum**: o
vanilla não usa essas classes (D6), e as outras quatro sempre as escrevem ao
lado de `.nds-button`. O comentário declara a intenção — "para o caso de o
elemento não ser botão" —, o que a torna uma regra de reserva, não uma regra
morta; mas é reserva sem instância viva.
**Por que ninguém viu**: não há compilador, suíte nem folha que reprove uma
regra perdedora de especificidade. O padding existia, era válido, e era
sobrescrito.

### D6 · O controle é o BOTÃO, nas cinco

**Decisão da dona, 2026-09-23.** Até essa data conviviam dois sistemas de
controle, e a pendência abaixo esperava exatamente esta escolha. O vanilla
passou a compor o botão; as regras de `.nds-pagination-link` saíram da folha,
que encolheu de 190 para 137 linhas.

**O que a decisão NÃO é**: ela é sobre a CLASSE, não sobre a tag. A tag é
assunto de D10, e mudou no mesmo dia por outra razão.

**O estado que a motivou, medido em 2026-09-16 por varredura de `.nds-*` no
código das cinco:**

| classe | quem emite |
|---|---|
| `.nds-pagination` (raiz) | as cinco |
| `.nds-pagination-list` (`<ul>`) | as cinco |
| `.nds-pagination-ellipsis` | as cinco |
| `.nds-pagination-link` e `.nds-pagination-icon` | **só o vanilla** (`pagination.ts`, duas atribuições) |
| `.nds-pagination-prev` / `.nds-pagination-next` | react, vue, svelte e angular — **nunca o vanilla** |

Ou seja: a moldura da faixa é compartilhada pelas cinco, e o CONTROLE tem duas
implementações visuais. O vanilla veste `.nds-pagination-link`, que é onde vivem
a altura mínima, os paddings, o raio, a tipografia, o hover, o anel de foco, o
realce da página atual, o quadrado do ícone e o estado desabilitado. As outras
quatro vestem `.nds-button` com variante (`ghost` para inativo, `outline` para a
página atual) e tamanho (`icon` para os números, `default` para os direcionais).
**Consequência**: a maior parte de `pagination.css` — tudo que é
`.nds-pagination-link*`, cerca de 70 das 190 linhas — só tem efeito em UMA das
cinco stacks. E a tabela de tokens que as cinco docs pages publicam nomeia
`.nds-pagination-link` como a classe de aplicação de cinco dos sete tokens, o
que descreve a realidade de uma stack para leitores de todas.
**Onde a convivência está registrada hoje**: o comentário de D5 diz que ela
"está registrada como material de cross-stack". **Esse registro não existe.** Em
2026-09-16, varrendo `.md` do repositório inteiro, `nds-pagination` não aparece
em arquivo de documentação nenhum — nem em `docs/shared/guidelines/`, nem nas
guidelines por stack, nem em `.claude/commands/cross-stack.md`. O único lugar
onde os dois sistemas estão descritos é a própria folha e, agora, este PRD.
**Qual é a referência**: o vanilla, pela regra da casa — ele não tem lib, e o
que está nele é o que o design system define. A divergência aqui não é de API de
framework: é de markup e de classe, e tem fonte de verdade.

> **FECHADA · 2026-09-23 — a dona decidiu, e foi pelo segundo caminho**: o
> vanilla passou a compor o botão e as regras do link saíram da folha.
>
> O que saiu, com produtor zero confirmado por varredura: `.nds-pagination-link`
> e `.nds-pagination-icon`, com hover, foco, realce da página atual, quadrado do
> ícone e estado desabilitado. Saiu junto a variante SEM `.nds-button` do recuo
> assimétrico (D5), que estava ali "para o caso de o elemento não ser botão" e
> nunca teve instância viva — e a guarda de `prefers-reduced-motion`, que só
> desligava a transição do controle standalone e ficou sem o que desligar.
>
> A tabela de tokens das cinco docs pages deixou de nomear a classe morta.
> **E o comentário que dizia existir um registro cross-stack saiu**: ele nunca
> existiu, e agora não há convivência a registrar.
>
> **Achado de vizinhança que a remoção quase enterrou**: a sonda de densidade de
> `escala-de-espacamento.stories.ts` usava `.nds-pagination-link` como consumidor
> de `--size-lg`. Sem retarget, ela mediria NADA — verde, silenciosa e inútil.
> Quem a achou foi a stack que mudou, não o portão.

### D7 · O rótulo textual de Prev/Next é ESCONDIDO por media query, nunca removido

**Estado**: `.nds-pagination-label` nasce `display: none` e só aparece a partir
de `min-width: 40rem`. O nome acessível não depende dele: vive no `aria-label`
do controle, nas cinco.
**Motivo**: em tela estreita a faixa numerada já é larga; tirar duas palavras é
o que a mantém numa linha. E o rótulo tem de sair da TELA sem sair da árvore de
acessibilidade, senão o controle passa a ser anunciado pelo ícone.
**Medição de por que o esconderijo importa**: o docblock de
`minimumTargetsBelow` registra o caso que a função nasceu para pegar — "um
direcional de 32×16, encolhido porque o rótulo textual estava escondido por uma
classe morta e não sobrava nada para o padding crescer". Esconder texto muda a
caixa, e a caixa é alvo de toque.
**Quem renderiza o rótulo**: react, vue, svelte e angular. O vanilla não tem
rótulo textual nenhum — os direcionais dele são quadrados de ícone em qualquer
largura. Ver V7.

### D8 · O mecanismo do desabilitado segue a TAG

**Reescrita em 2026-09-23**, quando D10 passou a decidir a tag pela rota. A
regra virou o espelho dela, e vale nas cinco:

- **`<button>`** (sem rota): `disabled` nativo. O navegador resolve antes de
  tudo — sai da tabulação, não dispara clique, e `elemento.click()` é no-op por
  especificação;
- **`<a>`** (com rota): `aria-disabled="true"` MAIS `tabindex="-1"` MAIS guarda
  de clique em JS, porque em âncora não existe `disabled` e `.click()` dispara.

**O vanilla guardava os DOIS caminhos, e isso foi corrigido junto.** O
comentário dele admitia o motivo: a guarda existia para que a story provasse o
extremo, porque a story usava `fireEvent`, que é `dispatchEvent` e atravessa
`disabled`. Era **a asserção ditando o código de produção** — em vez de trocar
o método do teste, o primitivo ganhou uma linha para o teste funcionar. O
angular tinha chegado ao mesmo fato e resolvido pelo lado certo, com
`elemento.click()`.

**Estado anterior, nas três stacks de `<a>`** (vanilla, react, angular): `aria-disabled="true"`
mais `tabindex="-1"`, mais uma guarda de clique em JavaScript.
**Motivo, escrito nos três primitivos**: `pointer-events: none` barra só o
mouse. Sem o tabindex negativo o controle inerte continua na ordem de tabulação
e o Enter navega; e sem a guarda de clique, Enter no teclado, clique disparado
por script e o `click()` de um teste continuavam chamando o callback de quem
consome.
**A forma da guarda difere por stack, e as duas razões estão medidas**: no react
ela é o `onClick` do próprio `<a>`, com `preventDefault` e `stopPropagation`; no
angular ela é registrada no CONSTRUTOR com `addEventListener` na fase de
captura, porque — medido neste projeto e registrado em
`13-system-design.md` §Eventos do angular — um listener declarado no `host` da
diretiva entra DEPOIS do `(click)` que o consumidor escreveu no mesmo elemento,
e daí `stopImmediatePropagation` já não alcança ninguém.
**Detalhe do react que vale registrar**: `aria-disabled={false}` deixava o
atributo no elemento com o valor `"false"`, e `[aria-disabled]` passava a casar
o controle HABILITADO. Hoje o atributo só existe quando é verdade — a mesma
regra vale para `data-active`.
**Onde vue e svelte divergem**: neles Prev/Next são `<button>` da lib, com
`disabled` nativo; o navegador barra clique e tabulação sozinho, e as plays
afirmam `toBeDisabled()`. É outro mecanismo para o mesmo contrato (C7), e o
conteúdo compartilhado (`notes.item2`) documenta só o primeiro. Ver V3.

### D9 · O angular não usa o primitivo de paginação da lib, e o motivo registrado estava errado

**Estado**: `pagination.ts` do angular declara oito peças sem
`@radix-ng/primitives`. O comentário do arquivo, e esta decisão até 2026-09-17,
diziam que o pacote não publica um `pagination`. **Publica**: a versão instalada,
1.1.2, tem `pagination/` e `fesm2022/radix-ng-primitives-pagination.mjs`, com as
diretivas `rdxPaginationRoot`, `-List`, `-ListItem`, `-First`, `-Prev`, `-Next`,
`-Last` e `-Ellipsis`. Quem achou foi a medição do PRD do Stepper, que encontrou o
mesmo erro sobre o primitivo de stepper da mesma lib.
**O motivo medido para não usar**, em 2026-09-17, lendo o `.mjs`:
- o nome acessível é CRAVADO em inglês por host binding — `"First Page"`,
  `"Previous Page"`, `"Next Page"`, `"Last Page"` e `"Page " + value`. No angular o
  host binding de diretiva vence o atributo estático do template, então quem
  compõe não sobrescreve o nome, e a página é pt-BR, en e es;
- a desabilitação é `[attr.disabled]`, que só existe em `<button>`. Num `<a>` o
  atributo não tem efeito: o link segue tabulável e o Enter navega, que é o
  defeito que a regra de indisponível da categoria existe para impedir;
- `aria-current="page"` na página atual está correto — é o único ponto em que o
  primitivo faz o que a paginação precisa.

**O comentário de `pagination.ts` segue afirmando que o pacote não publica
pagination**: é código, e fica para a revisão.
**E não haveria muito o que compor**: a paginação não guarda estado próprio, não
gerencia foco e não tem interação de teclado além da que `<a>` já traz. O que a
torna acessível é markup nativo (`nav` + `ul` + `li` + `a`) mais três atributos
ARIA.
**O que o angular faz no lugar**: chama `btnClass()`, a mesma função pura que o
`NdsButton` usa, sem herdar componente e sem wrapper no DOM. Cada peça é seletor
de ATRIBUTO no elemento nativo correspondente, então o DOM sai com a mesma
estrutura das outras stacks e o CSS casa sem invólucro.
**Forma de casa que isso confirma**: o react também não usa lib aqui — ele
compõe o `Button` do design system com `nativeButton={false}` e `render`. Só vue
e svelte têm primitivo (reka e bits), e é de lá que vem a régua de páginas
deles. Ver V11.

### D10 · A TAG segue a rota, nas cinco

**Decisão da dona, 2026-09-23.** Com endereço de página o controle é `<a>` —
destino de verdade, abre em nova aba, é indexável. Sem endereço ele é
`<button type="button">`, porque âncora vazia que age na própria página engana
quem navega por teclado e por leitor de tela.

Antes disso a tag era escolha de stack: `<a>` em vanilla, react e angular,
`<button>` em vue e svelte — e o svelte tinha uma pendência aberta por causa
disso. A decisão fecha as duas pontas de uma vez.

**Custo medido antes de decidir**: 119 consultas `getByRole('link')` nas
stories das cinco. Depois da mudança, quase todas viraram `button`, e as que
ficaram `link` são as que exercitam rota de verdade — que passaram a existir,
porque antes o caminho com rota tinha story em uma stack só.

**O que isto habilita**: o rodapé de paginação do DataTable pode compor este
componente sem herdar âncora vazia. Era a razão de a decisão ter sido adiada
para esta passagem.

#### `hrefForPage` existe para o link ser destino de verdade (vanilla)

**Estado**: sem a função, todo link nasce `href="#"` e o clique é anulado — o
que serve à paginação que vive só na memória. Com ela, o link ganha endereço e o
clique **segue**: abrir em nova aba funciona, a página é compartilhável e
indexável, e quem usa roteador de cliente o intercepta como faria com qualquer
link.
**Motivo de `#` não seguir**: é âncora vazia; deixá-la seguir levaria a rolagem
ao topo sem trocar página nenhuma. E, com rota, anular o clique seria pior —
apagaria o "abrir em nova aba" e o roteador junto.
**Nos extremos, o direcional desabilitado recebe `#` mesmo com rota**: um
endereço válido convidaria a abrir em nova aba uma página que não existe.
**O equivalente nas outras quatro**: react e vue recebem `href` por link (o vue
com default `#` na prop, escrito para que o elemento tenha papel de link e entre
na tabulação); o angular integra por `routerLink` no próprio host, que é o que a
extensibilidade publica. O svelte **não tem href** — o controle numerado dele é
um `<button>` (V1), e a promessa de `usage.do.item4` ("a URL deve refletir a
página atual para compartilhamento") não tem como ser cumprida ali.

## 4. Anatomia

```
pagination                     <nav>, role="navigation", aria-label, [data-align]
└── pagination-content         <ul>, flex em linha, gap de 4px, sem marcador
    ├── pagination-item        <li>
    │   └── pagination-previous   controle direcional, ícone + rótulo escondível
    ├── pagination-item
    │   └── pagination-link       número da página; aria-current quando é a atual
    ├── pagination-item
    │   └── pagination-ellipsis   <span> decorativo, caractere U+2026
    ├── pagination-item
    │   └── pagination-link
    └── pagination-item
        └── pagination-next       controle direcional, rótulo + ícone
```

Sete `data-slot`, e os sete saem nas cinco stacks. A árvore acima é a do vanilla
e é a que a sonda busca; o `<li>` é estrutura obrigatória, não invólucro
opcional — o CSS estiliza o item por `.nds-pagination-list > li`, e é por isso
que o `PaginationItem` do vue e do angular não têm classe própria (uma classe
ali seria invenção, e está escrito nos dois).

**O que é conteúdo de quem compõe**: o número dentro do link, a lista de
números, e onde entram as reticências. Só vanilla, vue e svelte calculam a régua
sozinhos (V11).

**O ícone não é peça publicada em quatro das cinco**: é um SVG filho que o CSS
dimensiona — `.nds-pagination-link.nds-pagination-icon > svg` no vanilla, e
`.nds-button > svg` nas outras. O angular é a exceção e publica
`svg[ndsPaginationIcon]`, porque cada ícone do lucide é uma lista `[tag, attrs]`
com tag variável e template Angular exige tag estática; os nós são criados por
`createElementNS`, sem `innerHTML` no caminho.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/pagination.css`, **137 linhas** depois de DD1,
lida linha a linha em 2026-09-23. Instrumento de conferência cruzada:
`node scripts/tabela-tokens.mjs pagination`.

> **A tabela abaixo encolheu em 2026-09-23, e o motivo é DD1.** Até essa data
> ela tinha vinte e oito linhas, e dezoito descreviam o CONTROLE — padding,
> peso, cor em repouso, hover, realce da página atual, anel de foco, quadrado do
> ícone, opacidade do desabilitado, transição. Nada disso é mais desta folha: o
> controle passou a ser `.nds-button`, e quem declara essas propriedades é
> `button.css`.
>
> **Quem apontou foi o portão, contra mim.** `prd_token_sem_lastro` acusou seis
> tokens nomeados aqui que a folha já não lê — `--spacing-4`, `--spacing-2`,
> `--font-weight-medium`, `--foreground`, `--background` e `--duration-fast` —,
> e quem os deixou sem lastro foi a limpeza que eu mesma fiz na folha, na mesma
> rodada. É a forma mais barata de descobrir que a documentação ficou para trás:
> uma regra que compara os dois lados em vez de confiar em quem escreveu.

| propriedade | valor | token |
|---|---|---|
| faixa · largura padrão | 100% | **literal** — é o que a torna um bloco de linha própria (D1) |
| faixa · centragem padrão | automática | **literal** `auto` em `margin-inline` (D1) |
| lista · distância entre controles | 4px | `--spacing-1` |
| recuo do lado do ícone | 6px | `--spacing-1-5` (D5) |
| reticências · lado | 36px | `--size-lg` |
| reticências · corpo do texto | 14px | `--text-control` |
| reticências · cor | — | `--muted-foreground` |
| rótulo textual · ponto de aparição | 40rem | **literal** — ver abaixo |

**O que esta folha deixou de declarar, e onde foi parar.** Estas linhas saíram
da tabela porque saíram do arquivo; quem quiser conferi-las agora lê
`button.css`, e a tabela de tokens que as cinco docs pages publicam já aponta
para lá:

| propriedade | quem declara agora |
|---|---|
| altura mínima do controle (piso de 36px, D2) | `.nds-button` |
| padding lateral e vertical | `.nds-button`, por tamanho |
| raio, corpo do texto, peso e família | `.nds-button` |
| texto em repouso, hover e realce da página atual | `.nds-button-ghost` e `.nds-button-outline` |
| anel de foco | `.nds-button:focus-visible` |
| opacidade do desabilitado | `.nds-button[aria-disabled="true"]` e `:disabled` |
| quadrado do ícone | `.nds-button-icon` |
| transição | `.nds-button` |

**Consequência que vale registrar**: o realce da página atual deixou de ser
`--accent` a 20% e passou a ser a variante `outline` do botão (D3 foi
reescrita). Não é a mesma cor, e a mudança é deliberada — o que o componente
promete é que a página atual se distingue das demais, não um matiz específico.
**Nenhuma cor literal na folha.** As duas únicas quantidades de cor escritas à
mão são os alfas `0.1` e `0.2`, que são força de composição e não matiz: a cor
vem sempre do token.

**Os literais, um por um, e por que cada um é literal**:

- `100%` e `auto` da raiz — são o comportamento padrão que o `data-align` desliga
  (D1); não há token de "ocupa a linha";
- `0.1` e `0.2` — força de realce, e a diferença entre as duas É a informação
  (D3). Um token único não poderia carregar dois degraus;
- `2px` e `5px` do anel — geometria de foco compartilhada com o botão, escrita
  igual nas duas folhas; o `button.css` registra a medição que a fixou (o anel
  precisa ser OPACO, porque a meia opacidade dava 1,87:1 a 2,42:1 contra a
  superfície e WCAG 1.4.11 pede 3:1);
- `0.5` de opacidade do desabilitado — mesmo valor e mesma razão do botão;
- `500` — fallback do peso, para o caso de o token não existir no escopo;
- `inherit` na família — decisão explícita de não escolher fonte;
- `40rem` — ponto de quebra do rótulo textual (D7). É o único media query de
  largura da folha, e não há escada de breakpoint tokenizada para ele.

**A folha lê quinze tokens e nenhum deles é de elevação, camada ou movimento
além da duração.** A faixa vive no plano da página: não tem sombra, não tem
`z-index` e não entra na classificação de degraus de elevação. É o que a separa
de toda a família de superfícies flutuantes, e é por isso que ela não aparece na
tabela `ELEVACAO_POR_TIPO` de `scripts/audit.mjs`.

**As cinco docs pages publicam SETE linhas de token**, e as sete concordam entre
si (medido em 2026-09-16): texto, fundo sob o ponteiro, texto sob o ponteiro,
anel de foco, cor das reticências, raio e distância entre controles. O angular
chega às mesmas sete por uma lista derivada; as outras quatro escrevem as chaves
uma a uma.

**Oito tokens que a folha lê e a tabela publicada não lista**: os quatro degraus
de espaçamento usados como padding e como lado do ícone, a altura mínima, o
corpo do texto, o peso e a duração da transição. A omissão é consistente nas
cinco páginas, e o instrumento de tokens os aponta como candidatos.

**A tabela publicada descreve a stack de referência, não as cinco.** Cinco das
sete linhas nomeiam `.nds-pagination-link` como classe de aplicação, e essa
classe só existe no vanilla (D6). Nas outras quatro o mesmo pixel sai de
`button.css`: o raio vem do token de raio do botão (que aponta para o degrau
`lg` da escada, hoje o mesmo valor), o quadrado do número vem do tamanho de
ícone do botão — com altura CRAVADA, não mínima —, e o hover do `ghost` pinta o
mesmo accent a 10%, por coincidência de valor e não por leitura da mesma regra.

## 6. Estados

> **Reescrita em 2026-09-23, por DD1.** Quatro linhas desta tabela descreviam
> o controle standalone — repouso, ponteiro, página atual e foco —, e o
> controle passou a ser o botão nas cinco. O que muda em cada estado é agora
> do `.nds-button`; o que esta folha ainda governa é a faixa, a lista, as
> reticências e o rótulo que some em tela estreita.

| estado | quando ocorre | o que muda | tem produtor? |
|---|---|---|---|
| Repouso | sempre | a variante `ghost` do botão: fundo transparente e texto herdado | sim, as cinco |
| Sob o ponteiro | `:hover` | o hover da variante `ghost` do botão | sim nas cinco como story (`Hover` em quatro; no angular não há story de hover) — mas **a cor não é afirmada em lugar nenhum**: o vanilla registra por escrito que `:hover` computado é frágil no harness e afirma o cursor e a alcançabilidade no lugar |
| Página atual | `aria-current="page"` | a variante `outline` do botão, nas CINCO desde 2026-09-23 — antes o vanilla usava fundo accent a 20% e era a única fora do botão (D6) | sim, as cinco |
| Desabilitado | Prev na página 1, Next na última | opacidade 0.5 e ponteiro barrado; teclado sai por `tabindex="-1"` ou `disabled` nativo | sim, as cinco |
| Foco por teclado | `:focus-visible` | o anel do botão | sim, as cinco, medindo `boxShadow` diferente de `none` |
| Rótulo escondido | largura abaixo de 40rem | o texto de Prev/Next sai da tela; o nome acessível fica | **não** — nenhuma story muda a largura do viewport (C16) |
| Faixa alinhada à ponta | `data-align="end"` | largura automática, sem margem automática, justificação na borda | sim em react, vue, svelte e vanilla; **não no angular** |
| Faixa alinhada ao início | `data-align="start"` | o espelho do anterior | **não** — o valor aparece só no snippet de anatomia do vanilla |
| Movimento reduzido | `prefers-reduced-motion: reduce` | nada nesta folha — a única transição que ela tinha era a do controle standalone, e saiu com ele. Quem desliga o movimento do botão é a guarda de `button.css` | **não se aplica mais aqui** |

O conteúdo compartilhado publica SEIS configurações em `states`
(`default`, `hover`, `active`, `disabled`, `focus`, `lastPage`), e as cinco docs
pages renderizam as seis — o angular derivando a lista, as outras quatro
nomeando as chaves. `lastPage` e `disabled` descrevem o mesmo mecanismo por dois
ângulos: o primeiro conta o caso do Next na última página, o segundo o de Prev
na primeira.

## 7. API

O eixo compartilhado é pequeno e concorda nas cinco: **um** modificador de
estado (`isActive`, ou a página atual calculada pela lib), **um** de tamanho
herdado da escala do botão, e o texto dos direcionais.

| prop | tipo | padrão | onde existe |
|---|---|---|---|
| `isActive` | booleano | `false` | react, vue, svelte, angular — no vanilla é derivado de `current` |
| `size` | escala do botão (`default`, `sm`, `lg`, `icon`) | `icon` no link numerado, `default` nos direcionais | react, vue, svelte, angular |
| `text` | string | `Anterior` / `Próxima` | react, vue, svelte, angular |
| `disabled` | booleano | `false` | react (por `aria-disabled`), angular, e implícito pela posição em vue, svelte e vanilla |
| nome acessível do landmark | string | `Paginação` | as cinco |
| classe extra | string | — | as cinco |

`Paginação` é o default do nome acessível nas CINCO, e em todas ele é
sobrescrevível — a razão é a mesma e está escrita em todas: uma docs page de
paginação mostra a faixa meia dúzia de vezes, e sem nomes distintos o axe acusa
`landmark-unique` e o leitor de tela anuncia "navegação" várias vezes sem dizer
qual é qual.

### Divergências de framework, registradas

| stack | como difere |
|---|---|
| react | Sete componentes, sem lib headless. O link é o `Button` do design system com `nativeButton={false}` e `render={<a …>}`, o que dá ao `<a>` a aparência do botão sem um segundo elemento. `isActive` escolhe entre `outline` e `ghost`. `aria-disabled` e `data-active` são normalizados para só existirem quando verdadeiros. A régua de páginas é de quem consome |
| vue | Sete SFCs; a raiz e os direcionais vêm da reka (`PaginationRoot`, `PaginationPrev`, `PaginationNext`), a lista vem de `PaginationList` com `as="ul"`, e o link numerado é um `<a>` escrito à mão — não há primitivo de página em uso. `href` tem default `#` por uma razão medida: sem ele a âncora não recebe papel de link, não entra na tabulação e o Enter não a alcança, e a faixa numerada inteira ficava fora do teclado. O `as` do `PaginationEllipsis` precisa ser DEFAULT e não atributo, porque o `v-bind` delegado é aplicado depois e um `as: undefined` devolvia o `div` do primitivo em silêncio |
| svelte | Sete peças; a raiz, o link e os direcionais vêm do bits-ui. A raiz usa o snippet `child` para trocar a tag — o primitivo renderiza `<div>` e a anatomia pede `<nav>` —, e por isso os `snippetProps` (`pages`, `range`, `currentPage`) têm de ser repassados à mão. O link usa `child` por outro motivo: o bits fixa `aria-label="Page N"` em inglês nos próprios props e vence o que o consumidor passa, então escrever depois do merge da lib é a única forma. O índice exporta as formas curtas (`Root`, `Content`, `Link`…) ao lado das longas. Há um `PaginationStory.svelte` que é andaime de story, não peça publicada |
| vanilla | Fábrica ÚNICA: `createPagination(options)` devolve a faixa inteira montada. É a única stack com régua embutida, com `showPrevNext`, com `hrefForPage` e com `align` como opção. Tem o apelido depreciado `label` para o nome acessível, e o canônico vence quando os dois vêm. Os rótulos são constantes em português no módulo |
| angular | Oito peças num arquivo, todas seletor de ATRIBUTO no elemento nativo, sem `@radix-ng/primitives` (D9). O nome acessível do `<nav>` é lido do atributo estático na CONSTRUÇÃO, com `Paginação` de fallback, porque host binding roda depois de atributo estático e sobrescreveria em silêncio o rótulo que a pessoa escreveu. A guarda de clique é registrada no construtor na fase de captura (D8). As reticências aceitam `label` e, com ele, passam de `aria-hidden` para `role="img"` — a única stack em que o vão pode ser anunciado |

**Onde a forma NÃO é divergência**: o número de arquivos não diz nada aqui. Vue
e svelte têm sete arquivos, o vanilla tem uma função e o angular tem um arquivo
com oito classes — e as quatro produzem a MESMA árvore de sete `data-slot`
(§4). A anatomia é única; o que muda é o idioma em que ela é escrita, e isso é
API de framework. O que É divergência de anatomia está na lista abaixo, e o
critério foi sempre o markup que sai: qual TAG, qual atributo, qual classe.

### Peças, por stack

| stack | peças |
|---|---|
| react | `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis` |
| vue | `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis` |
| svelte | `Root`/`Pagination`, `Content`, `Item`, `Link`, `Previous`, `Next`, `Ellipsis` (nomes curtos e longos) |
| vanilla | `createPagination`, tipo `PaginationOptions` |
| angular | `nav[ndsPagination]`, `ul[ndsPaginationContent]`, `li[ndsPaginationItem]`, `a[ndsPaginationLink]`, `a[ndsPaginationPrevious]`, `a[ndsPaginationNext]`, `span[ndsPaginationEllipsis]`, `svg[ndsPaginationIcon]`, tipo `PaginationIconKind` |

**Duas stacks já apagaram peças que ninguém entregava**, e as duas escreveram o
motivo no índice: o vue removeu `PaginationFirst` e `PaginationLast`, o svelte
removeu `PrevButton`/`NextButton` exportados como "old". Nos dois casos nada os
renderizava — nem story, nem docs page, nem outro componente — e a frase é a
mesma: peça exportada que ninguém entrega é promessa que o produto não cumpre.

### Inconsistências entre stacks, medidas em 2026-09-16

Nenhum dos itens abaixo é visto por portão. Os que TÊM portão estão na §11.

| # | o que difere | quem faz o quê | lados |
|---|---|---|---|
| V1 | tag do link numerado | `<button>` no svelte (snippet `child` do bits); `<a>` em react, vue, vanilla e angular | 4 × 1 — e o conteúdo compartilhado (`notes.item1`) afirma `<a>` por padrão, então a exceção contradiz a documentação que ela publica |
| V2 | tag dos direcionais | `<button>` em vue e svelte (primitivos da lib); `<a>` em react, vanilla e angular | 3 × 2 |
| V3 | mecanismo de desabilitado | **resolvido em 2026-09-23**: o mecanismo segue a TAG nas cinco (D8) — `disabled` nativo no botão, `aria-disabled` + `tabindex="-1"` + guarda em JS na âncora. Antes era escolha de stack | 3 × 2 — `notes.item2` documenta só o segundo |
| V4 | quem veste o controle | `.nds-pagination-link` standalone no vanilla; `.nds-button` + variante em react, vue, svelte e angular | 4 × 1 (D6) |
| V5 | realce da página atual | accent a 20% no vanilla; borda e relevo da variante `outline` nas outras quatro | 4 × 1 — e `props.table.isActive.description` do conteúdo descreve a variante outline, isto é, documenta a maioria e não a referência |
| V6 | caixa do link numerado | 36×36 com altura CRAVADA nas quatro (tamanho de ícone do botão, cujo comentário justifica o height fixo por "não haver texto"); no vanilla, 36px de piso com 16px de padding lateral | 4 × 1 — o link numerado tem texto, que é o número |
| V7 | rótulo textual dos direcionais | react, vue, svelte e angular renderizam "Anterior"/"Próxima" escondíveis; o vanilla renderiza só o ícone, em qualquer largura | 4 × 1 |
| V8 | nome acessível do link numerado | automático no vanilla (constante da fábrica) e no svelte (derivado, para vencer o rótulo inglês do bits); escrito pelo consumidor em react, vue e angular | 3 × 2 |
| V9 | `role="link"` redundante no `<a>` | react e vue escrevem; vanilla, svelte e angular não | 3 × 2 |
| V10 | `role="list"` redundante no `<ul>` | vue escreve; as outras quatro não | 4 × 1 |
| V11 | quem calcula a régua de páginas | o componente em vanilla (`getPages`), vue (reka) e svelte (bits); o consumidor em react e angular | 3 × 2 |
| V12 | `data-align` produzido | react, vue, svelte e vanilla escrevem `end`; o angular não escreve nenhum, em story nem em docs page | 4 × 1 |
| V13 | composição de rodapé de tabela | `CompleteTable` existe em react, vue, svelte e vanilla; o angular não tem a story — e é a única que demonstra o motivo de D1 | 4 × 1 |
| V14 | árvore de arquivos de story | quatro arquivos (raiz, `-variants`, `-states`, `-compositions`) em react, vue, svelte e vanilla; TRÊS no angular, sem `-compositions` | 4 × 1 |
| V15 | nomes de story do mesmo estado | `Disabled` em react/vue/svelte, `DisabledFirst`+`DisabledLast` no vanilla, `FirstPage`+`LastPage` no angular; `Focus` em quatro e `FocusVisible` no angular; `Active` em três, `ActivePage` no react | nenhuma maioria em duas das três |
| V16 | stories por arquivo de estado | seis em react, vue, svelte e vanilla (`Default`, `Hover`, `Active`, desabilitado, `Focus`, `Contrast`); quatro no angular, sem `Default` nem `Hover` | 4 × 1 |
| V17 | construtores de snippet | 11 no vue, 9 no react, 6 no vanilla, 1 no svelte (uma função parametrizada que serve as quatro arquivos), 1 no angular | react/vue de um lado, svelte/angular do outro |
| V18 | teste do construtor de snippet | vue, svelte e vanilla têm `pagination.source.test.ts`; react e angular não | 3 × 2 |
| V19 | lista de acessibilidade renderizada | o angular deriva os seis itens do dicionário; react, vue, svelte e vanilla param em cinco, com lista literal | 4 × 1, e o item que some é o alvo de toque (C13) |
| V20 | evento ensinado pelo snippet | o snippet da seção de importação do vanilla ensina `pagination_change`, que NENHUMA das cinco `analytics.ts` tipa; as cinco demonstrações disparam `page_change` | 1 × 4 (§9) |
| V21 | rótulos da demonstração | svelte e angular usam `demonstration.labels.current`; react e vue não; o vanilla não o lê | react/vue de um lado |
| V22 | Do & Don't com componente vivo | vue e svelte instanciam o componente nos quatro previews; o react imita em 1 de 4 e o vanilla em 2 de 4 | 2 × 2, com o angular fora da medição do portão |
| V23 | fixture compartilhada por stories | só o vanilla tem `pagination.fixtures.ts`, extraída porque três cópias idênticas conviviam nos três arquivos de story | 1 × 4 |
| V24 | opção de esconder os direcionais | `showPrevNext` existe só no vanilla; nas outras quatro, quem não quer os controles não os escreve | 1 × 4 — e este é legítimo de registrar, porque nas quatro a composição é do consumidor |

## 8. Acessibilidade

**Atributos que as cinco escrevem**: `role="navigation"` e `aria-label` na raiz;
`aria-current="page"` no link da página atual; `aria-label` com contexto em todo
controle; `aria-hidden="true"` nas reticências e no SVG de cada chevron. Nenhuma
stack escreve `aria-live`, e nenhuma anuncia a troca de página — o anúncio é de
quem renderiza a lista nova.

**Teclado**: só Tab, Shift+Tab e Enter. Não há navegação por setas, não há
`roving tabindex` e não há atalho de primeira/última página. A faixa é uma lista
de links (ou de botões, em uma stack) e a ordem de foco é a do DOM, que é a
ordem visual — é o que a `Focus` do vanilla afirma explicitamente, tabulando na
sequência anterior, 1, 2. O conteúdo publica `Espaço` como "ativa o link focado
quando o trigger é botão", que é a única linha do dicionário que reconhece a
existência da forma em `<button>`.

**O que deliberadamente NÃO se faz**:

- não se esconde Prev/Next nos extremos (C6) — controle que desaparece muda o
  layout a cada página, e está escrito assim na guideline do angular;
- não se dá rótulo especial ao link da página atual: quem anuncia "página atual"
  é o `aria-current`, nativamente e em qualquer idioma. Está escrito no vanilla
  e no svelte, e o svelte registra que um rótulo especial ali divergia das
  outras stacks e duplicava o anúncio;
- não se põe texto `sr-only` DENTRO das reticências. Um `sr-only` sob
  `aria-hidden` não é lido por leitor de tela nenhum — era conteúdo invisível
  para todo mundo, e em inglês. O comentário está no react, no svelte e no
  angular, e o angular registra que o defeito foi corrigido primeiro no
  Breadcrumb;
- não se confia em `pointer-events: none` para barrar ação (D4, D8);
- não se usa emoji nem seta de texto no lugar do ícone: a guideline de UX
  writing rejeita `<`, `>`, `Ant.` e `Próx.`, e `usage.uxWriting` publica a
  tabela de correto/evitar nos três idiomas.

**Contraste**: o texto da faixa tem 14px, tamanho normal pela WCAG, então o
limite é 4.5:1 — e a `Contrast` das cinco mede CADA controle contra o fundo
composto, não contra o token (D3). O alvo de toque é medido na mesma story, com
o piso de 24×24 de WCAG 2.5.8; a função devolve a lista dos faltantes com a
medida, e não um booleano, porque quando falha o teste precisa dizer qual
controle e por quanto.

**O anel de foco alcança a página atual.** É a consequência acessível de D4: com
`pointer-events: none` no `[aria-current]`, o link da página atual deixava de
receber hover, e a descrição da story do vue registra que o anel tem de aparecer
"em qualquer link da faixa — inclusive no da página atual".

## 9. Analytics

| evento | quem dispara hoje | payload |
|---|---|---|
| `page_change` | as cinco docs pages, na demonstração | `{ component: "pagination", page, total_pages, location: "docs_demo" }` |
| `docs_page_view` | as cinco docs pages | `{ component_name: "pagination", locale, page_title }` |
| `docs_section_viewed` | as cinco docs pages | `{ section_id, component_name: "pagination", locale }` |

**O componente não dispara nada.** Nenhum dos cinco primitivos importa `track`;
quem dispara é a docs page, que é o produto consumidor. O payload leva número e
slug, nunca texto traduzido — o angular registra a razão no comentário do
método: texto traduzido partiria um evento em três no GA4.

**`page_change` está tipado nas cinco** `src/lib/analytics.ts`, com a mesma
assinatura de cinco campos opcionais (`component`, `trigger_id`, `page`,
`total_pages`, `location`), e o conteúdo compartilhado publica UMA linha de
tabela, que é essa. Até aqui as cinco concordam.

**`pagination_change` não existe em tipo nenhum, e é ensinado em dois lugares.**
Medido em 2026-09-16:

- o snippet secundário da seção de importação da docs page do **vanilla** mostra
  `onPageChange: (page) => track('pagination_change', { page })`. É código para
  ser copiado, num painel feito para ser copiado, e o evento não compila no
  projeto de quem copiar;
- as guidelines de navegação do **vanilla** e do **angular** mandam emitir
  `pagination_change` com `{ from, to, total }`. As de react e vue mandam
  `page_change` com `page` e `total_pages`, que é o que o código faz, e o
  `docs/shared/guidelines/07-analytics.md` §Pagination concorda com essas duas.

É a forma de defeito que nenhum portão vê: não é erro de tipo (a string está
dentro de um template de snippet), não é violação de axe, e o evento "existe"
porque está escrito em dois documentos.

> **FECHADA · 2026-09-23** — o snippet do vanilla diz `page_change`, e
> `pagination_change` não aparece mais em código nenhum das cinco stacks. O que
> resta são os documentos que registram o defeito, incluindo este parágrafo.
>
> Vale guardar o mecanismo, porque ele não é do Pagination: `event_not_typed` lê
> só o conteúdo COMPARTILHADO, então nome de evento inventado dentro de um
> snippet de docs page passa por todos os portões. O leitor copia o snippet e
> recebe um evento que não existe no catálogo — e ninguém fica vermelho.

## 10. Reconstruir do zero

Ordem: folha → árvore de `data-slot` → régua de páginas → controles → stories →
docs page.

- **Comece pela raiz e pelo `data-align`** (D1). Quem implementar o atributo
  mexendo em uma só das três propriedades devolve o defeito que ele existe para
  corrigir: a faixa ocupando a linha inteira dentro de um rodapé.
- **Altura é PISO** (D2). `min-height`, nunca `height` — e se o controle for
  vestido pelo botão, confira qual tamanho está sendo pedido: o tamanho de ícone
  crava altura, e o link numerado tem texto.
- **`aria-current` PINTA e mais nada** (D4). A guarda contra navegar para si
  mesma é de quem trata o clique.
- **Desabilitado são duas coisas, não uma** (D8): barrar o ponteiro e sair da
  tabulação. Em `<a>`, isso é `aria-disabled` mais `tabindex="-1"` mais uma
  guarda de clique; em `<button>`, o `disabled` nativo faz os três.
- **Reticências são texto decorativo** (C10): o caractere U+2026, `aria-hidden`,
  sem `sr-only` dentro.
- **O rótulo dos direcionais se esconde, não se remove** (D7), e o nome
  acessível não depende dele.
- **Nome acessível do landmark tem de ser sobrescrevível** nas cinco, ou a
  primeira página que mostrar duas faixas reprova no `landmark-unique`.
- **Armadilha por stack**:
  - **react** — `aria-disabled={false}` deixa o atributo no elemento valendo
    `"false"`, e `[aria-disabled]` passa a casar o controle habilitado; o mesmo
    vale para `data-active`. Só escreva quando for verdade;
  - **vue** — o `href` precisa de default, senão a âncora não é link, não tabula
    e o Enter não a alcança; e a prop de elemento (`as`) precisa ser DEFAULT, não
    atributo, porque o `v-bind` delegado a reinjeta como `undefined` depois;
  - **svelte** — o bits fixa o rótulo em inglês nos próprios props da página e
    vence o consumidor; o snippet `child` é a única forma de escrever depois do
    merge. E é o `child` da raiz que troca `<div>` por `<nav>`, o que obriga a
    repassar `pages`, `range` e `currentPage` à mão;
  - **vanilla** — a fábrica não guarda estado: trocar de página é remontar o
    elemento. E `#` só existe quando não há rota; com rota, o clique SEGUE (D10);
  - **angular** — o nome acessível estático tem de ser lido na construção, senão
    o host binding o apaga; e a guarda de clique tem de ser registrada no
    construtor na fase de captura, senão ela entra depois do `(click)` do
    consumidor e não alcança ninguém (D8).

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, estados, alinhamento, recuo assimétrico | `docs/shared/styles/nds/pagination.css` |
| texto, props, tokens, critérios de teste | `docs/shared/content/pagination/translations.json` (235 chaves × 3 idiomas) |
| colhedor cross-stack, contraste e alvo de toque | `docs/shared/testing/pagination-probe.ts` |
| evento e payload | `docs/shared/guidelines/07-analytics.md` §Pagination + `src/lib/analytics.ts` das cinco |
| tom dos rótulos | `docs/shared/guidelines/05-tom-de-voz.md`, linha de Pagination |
| regra de CATEGORIA (navegação) | `nortear-design-system-<stack>/guidelines/05-navigation-components.md` |
| portões determinísticos | `node scripts/audit.mjs pagination --json` |
| instrumento de tokens | `node scripts/tabela-tokens.mjs pagination` |

**Não há link de Figma registrado**: `docs/shared/figma/design-links.ts` não
menciona pagination (conferido em 2026-09-16). Onde os outros componentes têm
conjunto e página anotados, aqui não há nada a conferir contra o código.

**Nenhuma folha de stack declara regra sobre `.nds-pagination*`** — a busca por
`.css` dentro dos cinco `src/` devolve zero. A folha compartilhada é a única
fonte de geometria, o que é o caso feliz e vale registrar.

### O `audit.mjs` NÃO está verde, e a abertura desta rodada supôs que estivesse

Medido em 2026-09-16, ANTES deste arquivo existir:
`node scripts/audit.mjs pagination --json` devolve **21 achados**, não zero. A
suposição de partida era o contrário, e ela mudaria a leitura de tudo que está
acima — então fica registrada aqui com a contagem por regra:

| regra | severidade | stacks | o que diz |
|---|---|---|---|
| `lista_mais_curta_que_o_conteudo` | high | react, vue, svelte, vanilla | `testes.accessibility` tem 6 itens e a página renderiza 5 (V19) |
| `story_group_divergent` | medium | cross-stack (4×) | `Simple`, `WithEllipsis` e `Interactive` caem em `variants` no angular e em `compositions` nas outras; `LastPage` cai em `states` no angular (V14) |
| `inline_style_design_value` | high | vanilla | quatro valores de design em `style` inline no `PaginationDocs.ts` (linhas 279 e 330: `height` e `width` de 2.25rem) |
| `source_sem_teste` | medium | react, angular | `pagination.source.ts` sem `pagination.source.test.ts` (V18) |
| `story_file_sem_transform` | medium | angular (2×) | os dois arquivos inteiros, 4 de 4 stories cada, publicam o template da story no painel Code (V17) |
| `demonstration_labels_divergent` | medium | svelte, angular | as duas usam `current`, que react e vue não usam (V21) |
| `dodont_preview_sem_componente` | medium | react, vanilla | imitação em 1 de 4 e em 2 de 4 previews (V22) |
| `titulo_como_item_da_propria_lista` | medium | angular | a lista de `accessibility.screenReader` é montada com `Object.values` e o `title` do bloco vira o primeiro item dela |
| `identificador_pt` | low | react, angular (2×) | `estilo` em duas stories e `novo` em uma |

> **FECHADA · 2026-09-23** — o `audit.mjs pagination` está em ZERO.
>
> Eram 21 em 2026-09-16 e **25 quando esta passagem começou**: a lista não
> zerou e ainda cresceu em uma semana. É o argumento para a ordem que a dona
> escolheu — arrumar este componente ANTES de o rodapé do DataTable passar a
> compô-lo, porque cada conserto adiado passaria a valer por seis lugares.
>
> Texto original, para registro:
>
> **Registro de 2026-09-16** — os 21 achados acima estão abertos, e quatro deles
> são de severidade alta: a lista de acessibilidade truncada em quatro stacks e
> os quatro valores de design em `style` inline no vanilla.
> **Fecha quando**: `node scripts/audit.mjs pagination --json` devolver lista
> vazia.

**Com este arquivo escrito, a contagem é 26**, medida logo depois de salvá-lo: os
21 de cima mais os cinco `catalogo_duplicado_com_prd` que a seção seguinte
prevê, um por stack. As duas regras que este documento poderia acender sozinho
não acenderam — `prd_token_sem_lastro` não reporta nenhum dos quinze tokens da
§5, e nenhuma das quatro pendências abertas aqui cai em
`prd_pendencia_ja_fechada`.

### O catálogo em guideline existia, nas cinco, e divergia — migrado em 2026-09-17

O parágrafo abaixo é a medição de 2026-09-16, e fica porque descreve a forma do
defeito que a migração fechou. `## Pagination` estava em `05-navigation-components.md` de todas as cinco stacks
(react linha 153, vue 159, svelte 74, vanilla 149, angular 150). O componente é
de **navegação**; `08-display-components.md` tem `## Table` e `## DataTable` e
nunca teve Pagination, e `enablePagination` ali é uma flag do DataTable, não uma
seção deste componente.

As cinco cópias divergem entre si e do código, medido em 2026-09-16:

- **o nome acessível do landmark aparece em três redações**, e nenhuma é a do
  código: `Paginação dos resultados` (vanilla, svelte), `Navegação de páginas`
  (react, vue), contra o `Paginação` que as cinco implementações escrevem;
- **a árvore do vanilla diz `button`** nos três níveis (`button "Anterior"`,
  `span / button` para os números), e a implementação dele é `<a>` em todos —
  justamente a stack de referência descrevendo o markup errado;
- **react e vue prescrevem `aria-disabled` mais `pointer-events-none`** como
  mecanismo de desabilitado, sem o `tabindex="-1"` que o código escreve e que
  `notes.item2` do conteúdo compartilhado documenta;
- **react e vue mandam emitir `page_change`**, vanilla e angular mandam
  `pagination_change` (§9);
- **a cobertura é desigual**: o angular tem tabela completa de oito peças e
  entradas, o vanilla tem tabela de oito opções da fábrica, o react e o vue têm
  regras e UX writing, e o **svelte tem vinte linhas** — propósito, uma árvore de
  cinco nós e três linhas de acessibilidade, sem uma única prop.

Isto é exatamente o padrão que o `catalogo_duplicado_com_prd` existe para
encerrar. A regra passou a reportar as cinco assim que este arquivo existiu, e
zerou no mesmo dia, com a migração.

> **FECHADA · 2026-09-17** — as cinco `05-navigation-components.md` tinham seção
> `## Pagination`, e agora há PRD. São duas fontes para a mesma coisa, e a
> segunda é a que deixa de ser corrigida: hoje ela já erra o nome acessível em
> três redações, descreve o markup do vanilla como `button`, omite o
> `tabindex="-1"` e nomeia dois eventos diferentes.
> **Fecha quando**: `catalogo_duplicado_com_prd` não reportar pagination — as
> seções saem e o que fica na guideline é a regra da CATEGORIA de navegação, que
> atravessa Breadcrumb, Tabs, Stepper, Navigation Menu e Sidebar.
> **Como fechou (2026-09-17), e só pela metade mecânica**: as cinco seções saíram
> e o portão zerou nas cinco stacks. A segunda metade da condição NÃO se cumpriu:
> o que ficou em cada `05-navigation-components.md` é a mecânica daquela stack,
> não uma regra de categoria de navegação — e essa regra não tem casa, porque
> `docs/shared/guidelines/` não tem guideline de navegação. As regras do Pagination
> que atravessam componentes foram para `20-tabelas.md`, pelo uso.

### Três afirmações do conteúdo compartilhado a conferir na revisão

Não são erros provados — são pontos em que o dicionário descreve a maioria e não
a referência, e a revisão precisa decidir qual dos dois corrigir:

1. `props.table.isActive.description` diz que a página atual recebe "variante
   outline". Isso é verdade nas quatro stacks que compõem o botão, e não no
   vanilla, que pinta o accent a 20% (D3, V5);
2. `notes.item1` diz que o componente "renderiza `<a>` por padrão". Vale em
   quatro; no svelte o link numerado é `<button>` e os direcionais de vue e
   svelte também (V1, V2);
3. a tabela de tokens nomeia `.nds-pagination-link` em cinco das sete linhas, e
   essa classe existe numa stack só (D6).

> **FECHADA · 2026-09-23 por D10** — a tag deixou de ser escolha de stack e
> passou a seguir a rota. O svelte estava certo para o caso sem rota e ganhou o
> caminho com rota, que não tinha; as outras quatro ganharam o caminho de botão.
>
> Texto original, para registro:
>
> **Registro de 2026-09-16** — o link numerado do svelte é um `<button>` sem
> `href`, e os direcionais de vue e svelte também são `<button>`. A promessa de
> `usage.do.item4` — a URL refletir a página atual para compartilhamento — não
> tem como ser cumprida onde não há endereço, e `notes.item1` afirma `<a>` por
> padrão nos três idiomas.
> **Fecha quando**: a dona decidir entre alinhar ao vanilla (troca de tag nos
> primitivos do bits e da reka, pelo snippet `child` e por `as-child`) e
> registrar a exceção por escrito como mecânica de lib — e, na segunda hipótese,
> `notes.item1` deixar de afirmar o que não vale nas cinco.
