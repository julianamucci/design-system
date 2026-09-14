# PRD — Skeleton

> **Estado descrito**: 2026-09-13, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código usará este documento como base:
> tudo que está aqui foi medido nas cinco stacks nesta data, e é contra estas
> linhas que a revisão vai comparar o que encontrar.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Bloco cinza que **ocupa o lugar** do conteúdo enquanto ele carrega, pulsando por
opacidade. Não transmite informação: é a caixa do que vem depois, desenhada
antes.

Duas consequências separam este componente de todos os vizinhos de Feedback, e
as duas são de acessibilidade, não de desenho:

- **ele não fala** — sai `aria-hidden="true"` de fábrica nas cinco stacks;
- **quem fala é a região que ESPERA o conteúdo**, com `role="status"`,
  `aria-busy` e nome. Desde 2026-09-13 essa região é PEÇA do design system
  (`SkeletonRegion` e equivalentes — ver D9): até ali era do consumidor, e as cinco
  superfícies desta casa a montavam à mão, em cinco formas diferentes.

| vizinho | diferença que decide |
|---|---|
| Progress | tem progresso MENSURÁVEL e anuncia valor; o esqueleto não sabe quanto falta |
| Spinner / `nds-animate-spin` | indica atividade sem dizer a forma do que vem; o esqueleto existe justamente para dizer a forma |
| Alert / Toast | comunicam uma mensagem; o esqueleto é decoração e some quando o conteúdo chega |
| Esqueleto do Sidebar | é peça PRÓPRIA, com classes próprias (`.nds-sidebar-menu-skeleton*`) e uma variação de largura que este componente não tem — ver D10 |

**O esqueleto é o único componente desta categoria cuja regra central é
NEGATIVA**: ele não recebe altura, não recebe foco, não recebe papel, não
dispara evento. Cada uma dessas ausências é uma decisão, registrada na §3.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | `aria-hidden="true"` sai de fábrica, nas cinco, e não é configurável | `testes.accessibility.item2` e `testes.functional.item3` — story `Playground` nas cinco |
| C2 | Quem anuncia o carregamento é a REGIÃO que contém o esqueleto, com `role="status"` + `aria-busy` + nome acessível | `testes.functional.item4` e `testes.accessibility.item3` — `Playground` em quatro stacks, `BusyContainer` no angular |
| C3 | O pulso EXISTE no estado normal e SOME sob movimento reduzido, e o esqueleto continua visível e ocupando a caixa | `testes.functional.item5` e `testes.accessibility.item4` — story `ReducedMotion` nas cinco |
| C4 | A caixa desenhada sai de `data-shape` e `data-width`, e é conferida por MEDIDA do que foi renderizado — nunca pela classe | `testes.functional.item2` — `Playground` nas cinco, com `boxDesenhada` de `docs/shared/testing/skeleton-probe.ts` |
| C5 | A forma de avatar sai quadrada (dentro de meio pixel) e com raio circular | `testes.visual.item2` — story `Circle` em quatro stacks, `Shapes` no angular |
| C6 | Num bloco de texto as larguras declaradas DECRESCEM na ordem escrita | story `TextLine` e `Paragraph` em quatro stacks; no angular, `CustomDimension` |
| C7 | O placeholder se distingue do fundo do container — razão de luminância acima de 1,05 | `testes.accessibility.item5` e `testes.functional.item1` — story `Pulsing` nas cinco |
| C8 | O esqueleto NÃO recebe `height`: a altura de `text` e `heading` é resultado de `padding-block` sobre a escada de texto | a folha; nenhuma story mede a altura contra o token, só contra zero (ver pendência) |
| C9 | `data-shape="fill"` só preenche caixa que o CONTAINER já estabelece | `testes.visual.item1` e `visual.item5` — `Rectangle` e `ImageInAspectRatio` |
| C10 | O componente não dispara evento nenhum | `analytics.description` do conteúdo compartilhado, e a §9 desta página |

**C8 é o único contrato desta lista sem portão de verdade.** As stories medem
`height > 0`, que pega o colapso para zero — o defeito histórico — e não pega
altura cravada por fora nem desvio da escada de texto. Está registrado como
pendência no fim do arquivo.

## 3. Decisões fixadas

### D1 · A caixa entra por ATRIBUTO — nem `style`, nem classe de medida

**Estado**: `data-shape` (`text`, `heading`, `avatar`, `fill`) e `data-width`
(`full`, `3-4`, `2-3`, `1-2`, `1-3`), mais `data-size` (`sm`, `lg`) só para
avatar. A folha continua dona de todas as medidas.

**Medição que produziu a regra**, registrada no docblock de
`docs/shared/testing/skeleton-probe.ts`: as stories afirmavam a CLASSE (`h-4`,
`w-[250px]`, `h-12 w-12`), classes que a migração `.nds-*` aposentou. O
Playground de quatro stacks renderizava um bloco de **altura zero** e a suíte
ficava verde, porque conferia `className` e não medida. Hoje a conferência é
`getBoundingClientRect`.

**Por que atributo e não custom property**: a convenção já existia no sistema
(`data-spacing`, `data-size`), e atributo mantém a folha como única dona do
número. Uma custom property no call site reabriria a porta que a medição fechou.

**O que quebra esta decisão**: `style` inline. A regra da casa proíbe valor de
design em `style`, e o esqueleto é o componente em que a tentação é maior —
quem consome quer "só esta altura aqui". Medido em 2026-09-13 nos cinco
primitivos, nos 19 arquivos de story e nas cinco docs pages: **nenhum valor de design em
`style`**. Os cinco `style` que existem carregam custom property de layout
(`--grid-min` da grade da demonstração), que a regra não considera violação — e
o vanilla não usa nem isso. Ver, porém, a inconsistência registrada em §7 sobre
o comentário do primitivo do Angular e sobre `props.table.rest`.

### D2 · A duração é o degrau `--duration-cycle`, e há DUAS portas parando o movimento

**REVISADA em 2026-09-13, por decisão da dona**: a escada de `--duration-*` ganhou
três degraus de CICLO CONTÍNUO — `--duration-cycle-fast` (1000ms, giro),
`--duration-cycle` (1500ms, este pulso) e `--duration-cycle-slow` (2000ms, o pulso
utilitário) — e os três entram no bloco de `prefers-reduced-motion` da
`motion.css`. Com isso a camada de token passa a alcançar o pulso, e a guarda da
própria folha continua onde está: duas portas para o mesmo movimento é redundância
deliberada, e a mais barata de furar é a do token. O pulso mede os mesmos 1,5s de
antes; o que mudou é de onde o número vem.

O texto abaixo é o estado anterior, e fica porque é a medição que justificou o
degrau novo.

**Estado até 2026-09-13**: `animation: nds-skeleton-pulse 1.5s var(--ease-standard) infinite`,
com a curva em token e a duração cravada. No fim de `skeleton.css` há
`@media (prefers-reduced-motion: reduce) { .nds-skeleton { animation: none } }`.

**Medido em 2026-09-13, na cascata**: a declaração base e a guarda têm a MESMA
especificidade (0,1,0) e a guarda vem DEPOIS no arquivo — com especificidade
igual, quem vem depois vence, e `@media` não acrescenta especificidade. Nenhuma
regra de `[data-shape]` ou `[data-width]` declara `animation`, então não existe
aqui o defeito da família conhecida (guarda mirando a classe nua contra
declaração em atributo, que perde 0,1,0 contra 0,2,0). **A guarda desta folha
tem dentes.**

**Por que a camada de token não serve, e isto não é desleixo**: a escada de
`--duration-*` vai de 0 a 800ms e nenhum degrau é um ciclo contínuo de 1,5s.
É exatamente o caso que `utilities.css` já documenta para `.nds-animate-spin` e
`.nds-animate-pulse`, que cravam 1s e 2s pelo mesmo motivo — e que, na medição
de 2026-09-09 com a preferência emulada num motor real, foram as duas ÚNICAS
animações que continuavam rodando, porque não tinham bloco próprio. O
`.nds-skeleton` aparece naquela mesma nota na lista de quem JÁ parava, "cada uma
pelo bloco da própria folha".

**`animation: none` e não duração zero**: com `infinite`, duração zero reinicia
o ciclo sem parar — o piscar que a preferência pede para evitar. Mesma escolha
que `motion.css` e `utilities.css` documentam.

**Duas guardas, não uma, e a segunda é a que a suíte usa**: a preferência de
sistema não é emulável no navegador dos testes (a emulação foi removida de
propósito, porque deixava o CI verde escondendo asserção racy). O que a suíte
liga é `data-reduced-motion="true"` no `<html>`, e quem desliga o pulso por esse
caminho é `motion.css`, que zera `animation-duration` com `!important` para
todo elemento. As duas portas chegam ao mesmo lugar; a asserção é pelo PAR
(nome da animação **e** duração maior que zero), nunca por
`animationName !== 'none'`, que passava com duração zerada.

**Para revisitar**: tokenizar a duração exigiria um degrau novo na escada de
movimento para ciclo contínuo, e ele valeria para as três animações de pulso do
sistema — este, o `.nds-animate-pulse` e o `.nds-animate-spin` — não só para
esta folha. Decisão de fundação, não de componente.

### D3 · A superfície é a cor PRIMÁRIA a 10%, não uma cor neutra

**Estado**: `background-color: hsl(var(--primary) / 0.1)`.

**Consequência medida**: o esqueleto muda de cor com a marca. Nos três temas o
bloco continua distinguível porque a claridade de `--primary` e a de
`--background` andam em sentidos opostos entre os modos — no claro a primária é
escura (32% a 44% de claridade) sobre fundo quase branco, no escuro é clara (52%
a 61%) sobre fundo de 9% a 18%. O piso de 1,05 de razão de luminância (C7) é o
que pega o caso degenerado: token trocado, opacidade zerada, ou um tema em que a
primária coincidisse com a superfície.

**O piso não é critério de contraste da WCAG**, e isto está escrito no colhedor:
o esqueleto não transmite informação, então 1.4.3 e 1.4.11 não se aplicam. É
diferença de luminância, e a conta compõe o alfa contra o ancestral opaco —
sem compor, a medida seria de uma cor que ninguém vê. A composição e a razão
vêm reusadas do colhedor do Alert, não copiadas.

**O que esta decisão NÃO cobre hoje**: a medição roda no tema e no modo em que a
suíte abre — um só. O colhedor **reexporta `darkLigarTheme`** e nenhuma story de
esqueleto o importa (medido em 2026-09-13 nos 19 arquivos de story das cinco
stacks). Três temas × dois modos = seis combinações, e uma é
medida. Registrado
como pendência.

### D4 · O raio é o da base do tema, e só o avatar troca

**Estado**: `border-radius: var(--radius)` na classe base;
`border-radius: var(--radius-full)` em `[data-shape='avatar']`.

**Medição de 2026-09-13, e ela expõe uma asserção frágil**: o tema `cold` declara
`--radius: 0` como identidade de forma, e zera à mão `--radius-badge` e
`--radius-card` — mas **não** `--radius-full`, que é 9999px fixo. Então naquele
tema o esqueleto de linha sai de canto reto e o avatar continua redondo, que é o
comportamento correto. O problema é o portão: a story `Pulsing` das cinco stacks
afirma `borderRadius !== '0px'`, e essa afirmação é FALSA no tema quadrado. Hoje
ela passa porque a suíte roda no tema padrão (raio de 14px) e nenhuma story de
esqueleto troca de tema — a mesma lacuna da D3, com consequência oposta: lá
falta medição, aqui há medição que reprovaria um tema legítimo.

### D5 · O esqueleto é decoração; o anúncio é da REGIÃO que espera o conteúdo

**Estado, nas cinco**: `aria-hidden="true"` escrito pelo primitivo, sem prop nem
input que permita desligar — no Angular é host binding de valor fixo, no vanilla
é `setAttribute` na fábrica, nos outros três é atributo literal no elemento.

**O que a região deveria carregar, e o código TEM opinião sobre isso** — está
escrita em três lugares que concordam entre si: `anatomy.item3` e
`accessibility.items.item2` do conteúdo compartilhado, o docblock de
`skeleton.fixtures.ts` do vanilla, e o comentário repetido em cada `play` das
cinco stacks. A opinião é o TRIO:

- `role="status"`, porque `aria-busy` sozinho num `div` sem papel não é
  anunciado;
- `aria-busy="true"`, que é o estado, e que ao virar `false` é o que dispara o
  anúncio de "pronto";
- `aria-label` descrevendo o que carrega, porque nome em elemento sem papel é
  atributo proibido — o leitor de tela o descarta, e o axe acusa
  `aria-prohibited-attr`.

**Uma região por BLOCO, não por peça** (D9).

**E a região passou a ser PEÇA em 2026-09-13, por decisão da dona.** Até ali ela
era do consumidor: nenhuma das cinco stacks entregava um componente de região, e
toda superfície desta casa — 46 stories em 19 arquivos, 5 docs pages — a montava à
mão. Foi assim que ela divergiu em cinco formas, e no Svelte a lista da
demonstração ficou sem `role="status"` nenhum. Regra que cada consumidor executa
por conta é regra que se perde no quinto consumidor.

O contrato, igual nas cinco:

| stack | peça | forma |
|---|---|---|
| react, vue, svelte | `SkeletonRegion` | componente com `label` obrigatório |
| vanilla | `createSkeletonRegion({ label, children, class? })` | subfábrica, no padrão da stack |
| angular | `div[ndsSkeletonRegion]` | diretiva de atributo, com `input` `label` |

Em todas: `role="status"`, `aria-busy="true"`, `data-slot="skeleton-region"`, nome
acessível obrigatório vindo de `label`, e **nenhuma CSS própria** — quem compõe põe
`nds-stack` ou `nds-grid` nela, que é o que as cinco docs pages já faziam à mão.

### D6 · Não existe prop de forma; existem atributos — e só o vanilla os tipifica

**Estado**: react, vue, svelte e angular não declaram `shape`/`width`/`size`.
Os valores chegam como atributo cru (spread em react e svelte, atributo de
passagem em vue, atributo estático ou `[attr.*]` no template do angular). O
vanilla é o único com contrato de tipo: `SkeletonOptions` com `shape`, `width`,
`size` e `className`, e os tipos `SkeletonShape`, `SkeletonWidth`, `SkeletonSize`
exportados.

**Isto não é divergência para alinhar**: é a diferença entre fábrica e
componente de framework, e a fábrica não tem outro lugar para pôr a opção. O que
as quatro stacks de lib fazem no lugar é declarar a forma nos `argTypes` do
Playground — as cinco declaram os mesmos quatro valores de `shape`, os mesmos
cinco de `width` e o mesmo default (`text` + `3-4`), medido em 2026-09-13.

**O preço, e ele é real**: `data-shape="avatr"` não reprova em nenhuma das quatro
stacks de lib. O Playground é a única superfície que enumera os valores, e
enumeração em `argTypes` não é tipo.

### D7 · A largura é FRAÇÃO do container, não medida

**Estado**: `data-width` resolve em `inline-size` percentual — 100%, 75%, 66%,
50%, 33%.

**Motivo escrito na folha**: a linha de esqueleto imita um trecho de texto que
quebra junto com o container; variar a largura entre linhas é o que faz o bloco
parecer parágrafo em vez de tabela.

**A armadilha que isto cria, e ela está medida**: percentual só resolve contra
container com largura definida. Num `nds-cluster` sem base de largura o bloco
encolhe para o conteúdo, as linhas resolvem para zero e o esqueleto SOME sem
nada ficar vermelho. O comentário de `nds-flex-1` aparece por escrito em duas
stories do Angular ("não é enfeite… foi o que a medição de largura acusou aqui"),
e o passo "Toda linha de texto tem largura desenhada" existe na `Shapes` do
Angular por causa disso.

### D8 · O avatar é a exceção de altura que a guideline 12 prevê

**Estado**: `text` e `heading` recebem só `padding-block`, calculado como metade
da medida de texto correspondente — a altura é RESULTADO, e o bloco cresce
quando a pessoa aumenta a fonte do navegador (WCAG 1.4.4). O avatar recebe
`inline-size` e `block-size` da escada `--size-*`, que responde à densidade.
`fill` recebe 100% nos dois eixos e não tem medida própria.

**Consequência da conta**: como o esqueleto não tem conteúdo, a altura de
`text` é exatamente a medida de texto de controle e a de `heading` é exatamente
a de `h4`. Mexer no `padding-block` muda a altura na proporção inteira, não pela
metade.

### D9 · A lista inteira é UMA região ocupada

**Estado**: nas quatro stacks com story de composição, a lista de cinco itens
tem `aria-busy` e nome na `<ul>`, e nenhum item carrega região própria.

**Motivo, escrito no docblock de `skeleton.fixtures.ts` do vanilla**: uma região
por peça repetiria o mesmo aviso a cada linha — cinco itens de três peças são
quinze avisos.

**Onde a decisão se aplica ao próprio sistema**: o esqueleto de menu do Sidebar
do vanilla põe `role="status"` só quando recebe nome, e cai em
`aria-hidden="true"` quando não recebe, com o motivo no docblock ("use no caso de
uma linha só, senão cada linha vira uma região viva repetindo o mesmo aviso").
É a mesma decisão, tomada duas vezes, no mesmo sentido.

### D10 · O esqueleto do Sidebar é peça PRÓPRIA, e uma das cinco não usa este componente

**Estado**: `.nds-sidebar-menu-skeleton`, `-icon` e `-text` vivem em
`sidebar.css`, com medidas próprias e uma variação de largura
(`var(--skeleton-width, 70%)`) que este componente não tem. Quatro stacks
COMPÕEM: o elemento de ícone e o de texto são `Skeleton` com a classe do
sidebar por cima, então herdam fundo, raio e pulso desta folha.

**O Angular não compõe** — `NdsSidebarMenuSkeleton` monta dois `<div>` com as
classes do sidebar e nada mais, sem `.nds-skeleton`. Medido em 2026-09-13 em
`nortear-design-system-angular/src/components/ui/sidebar.ts:633-635`. Sem a
classe base não há fundo, não há raio e não há pulso: a linha de carregamento do
menu ocupa espaço e fica invisível. Registrado como inconsistência de primeira
linha na §7.

**E a largura é sorteada em três stacks**: react, vue e svelte calculam
`Math.random()` entre 50% e 90% a cada render. O vanilla declara por escrito que
NÃO sorteia, e diz por quê — "as outras implementações sorteiam uma largura a
cada render, o que faz a captura de regressão visual divergir de si mesma". O
Angular não oferece largura nenhuma.

## 4. Anatomia

```
(região do consumidor)        role="status" · aria-busy · aria-label
                              NÃO é peça do componente — ver D5
└── skeleton [data-shape]     aria-hidden="true" · o bloco pulsante
        [data-width]          fração da largura do container (D7)
        [data-size]           só com data-shape="avatar"
```

O componente é **um elemento só**, sem filhos e sem sub-peças. O `data-slot` é
`skeleton` nas cinco.

**Quatro formas, e uma delas não tem linha de variante**: `text`, `heading`,
`avatar` e `fill` existem na folha e nos cinco `argTypes`; a seção de variantes
do conteúdo compartilhado documenta TRÊS (retângulo, círculo, linha de texto). O
`heading` é usado nas cinco docs pages, no lado "faça" do primeiro par de
do/don't, e não aparece em lugar nenhum como variante nomeada.

**Filho é caso indefinido, de propósito em uma stack e por acidente nas outras**:
o svelte declara o tipo como `WithoutChildren` e recusa filho na compilação; o
vue não tem slot e descarta em silêncio; o react repassa `children` no spread e
renderizaria; o angular é diretiva num `div`, então o filho é o que quem escreve
puser; o vanilla devolve elemento vazio. Nenhuma superfície passa filho.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/skeleton.css`, lida linha a linha em 2026-09-13,
e cruzada com `node scripts/tabela-tokens.mjs skeleton`.

| propriedade | valor | token |
|---|---|---|
| fundo | primária a 10%, composta sobre o container | `--primary` — ver D3 |
| raio (base) | o da base do tema | `--radius` — ver D4 |
| raio (avatar) | círculo | `--radius-full` |
| curva do pulso | — | `--ease-standard` |
| duração do pulso | 1500ms, ciclo infinito | `--duration-cycle` — degrau de ciclo contínuo, nascido em 2026-09-13 (D2) |
| ciclo do pulso | opacidade 1 → 0,5 → 1 | sem token (quadros de `nds-skeleton-pulse`) |
| altura de `text` | `padding-block` de metade da medida, nos dois lados | `--text-control` — ver D8 |
| altura de `heading` | `padding-block` de metade da medida, nos dois lados | `--text-h4` |
| avatar (padrão) | quadrado | `--size-default` |
| avatar (pequeno) | quadrado | `--size-sm` |
| avatar (grande) | quadrado | `--size-lg` |
| `fill` | 100% nos dois eixos | sem token — a caixa é do container |
| larguras | 100%, 75%, 66%, 50%, 33% | percentual cravado, sem token — ver D7 |
| movimento reduzido | animação desligada | sem token — bloco próprio no fim da folha, ver D2 |

**Sem borda, sem sombra, sem camada**: o esqueleto não é superfície flutuante, e
por isso não entra na tabela de elevação por tipo. Nada nesta folha lê sombra.

**`--radius-full` era a única linha que a folha lê e nenhuma tabela de docs
page lista** — apontado pelo instrumento em 2026-09-13. As cinco páginas
descrevem o raio numa linha só ("cantos arredondados; a forma de avatar troca
para o raio circular") e nomeiam apenas `--radius`, o que deixa o ponto de
customização do círculo sem nome. É leitura de conteúdo, não defeito de código.

**A escada global que esta folha lê e as tabelas não listam** —
`--text-control`, `--text-h4`, `--size-sm`, `--size-lg` — fica de fora por ser
sistema, não peça: redefinir qualquer uma muda o repositório inteiro. As páginas
listam `--size-default` e descrevem as outras duas como "variações pela escala
de tamanhos".

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Padrão | enquanto o conteúdo carrega | pulso por opacidade em ciclo de 1,5s; fundo em primária a 10% sobre o container |
| Movimento reduzido | `prefers-reduced-motion: reduce`, ou `data-reduced-motion` no `<html>` | a animação é desligada pela própria folha; o esqueleto continua visível, parado, com opacidade 1 |

**São só dois, e as cinco docs pages listam os dois** — medido em 2026-09-13.
Não há `data-state`, não há estado de foco (o esqueleto não é focável), não há
estado de erro nem de concluído: o fim do carregamento não é um estado do
esqueleto, é a sua remoção.

**O terceiro estado que o sistema tem e o componente não**: `aria-busy="false"`
na região. Ele muda o comportamento do leitor de tela — é o que dispara o
anúncio de "pronto" — e está documentado em `notes.item5` e
`accessibility.items.item4`, mas é estado da REGIÃO, e por isso não entra nesta
tabela. Nenhuma story o exercita com uma troca ao vivo; o Playground o expõe
como controle `loading`, que nasce `true`.

## 7. API

O componente não tem prop própria além da classe. O que quem consome escolhe são
os três atributos, e a forma de escrevê-los muda por stack.

| atributo | valores | padrão |
|---|---|---|
| `data-shape` | `text` · `heading` · `avatar` · `fill` | nenhum — sem ele o bloco não tem medida própria |
| `data-width` | `full` · `3-4` · `2-3` · `1-2` · `1-3` | nenhum |
| `data-size` | `sm` · `lg` | nenhum — só tem efeito com `data-shape="avatar"` |
| classe | utilitárias `.nds-*` | — |
| `aria-hidden` | fixo em `true` | não configurável (C1) |

**O Playground das cinco declara os mesmos defaults** — `shape: 'text'`,
`width: '3-4'`, `loading: true` — e eles são defaults DA STORY, não da folha: no
componente, nenhum atributo é obrigatório e nenhum tem valor implícito.

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| react | função `Skeleton`, `React.ComponentProps<'div'>`; forma e largura por spread de atributo |
| vue | SFC `Skeleton.vue` com uma prop só (`class`); os atributos chegam por passagem de atributo, sem `inheritAttrs` declarado |
| svelte | `skeleton.svelte` com `ref` bindável e tipo `WithoutChildren<WithElementRef<…>>` — a única stack que recusa filho na compilação; índice exporta `Root` e o apelido `Skeleton` |
| vanilla | fábrica `createSkeleton(options)`, a ÚNICA com contrato de tipo para forma, largura e tamanho (`SkeletonShape`, `SkeletonWidth`, `SkeletonSize`) — ver D6 |
| angular | diretiva `div[ndsSkeleton]`, sem input nenhum; `data-slot` e `aria-hidden` por host binding, forma e largura por atributo estático ou `[attr.*]` no template |

**No Angular o host binding não disputa com a forma, e vale dizer por quê**: as
duas ligações do host são `data-slot` e `aria-hidden`, e `data-shape`/`data-width`
não estão entre elas — então o atributo estático do template sobrevive, ao
contrário do que acontece em `NdsButton` e `NdsBadge`, onde o host binding de
`data-slot` apaga o nome que a peça se dá. Não há aqui o defeito daquela
família.

### Peças, por stack

| stack | peças |
|---|---|
| react | `Skeleton` |
| vue | `Skeleton` |
| svelte | `Root`, `Skeleton` (o mesmo componente sob dois nomes) |
| vanilla | `createSkeleton`, mais os tipos `SkeletonOptions`, `SkeletonShape`, `SkeletonWidth`, `SkeletonSize` |
| angular | `NdsSkeleton` (seletor `div[ndsSkeleton]`) |

### Inconsistências entre stacks, medidas em 2026-09-13

Estas linhas são o produto principal deste documento. Cada uma diz quem faz o
quê e qual regra a MAIORIA já executa. Nenhuma foi corrigida por este PRD.

1. **O esqueleto de menu do Sidebar do Angular não usa este componente.**
   `nortear-design-system-angular/src/components/ui/sidebar.ts:633-635` monta
   `<div class="nds-sidebar-menu-skeleton-icon">` e `<div
   class="nds-sidebar-menu-skeleton-text">` sem `.nds-skeleton` — sem fundo, sem
   raio, sem pulso. Maioria (react, vue, svelte, vanilla): compõem `Skeleton` +
   a classe do sidebar. Ver D10.
2. **O Angular não tem arquivo de composições.** As outras quatro têm
   `skeleton-compositions.stories.*` com quatro stories cada (`ProfileCard`,
   `ListWithAvatar`, `ImageInAspectRatio`, `Paragraph`); o Angular dobra os
   cinco itens de `testes.visual` numa story só, `Shapes`, em
   `skeleton-variants.stories.ts`. A cobertura de `covers` fecha nas cinco; o
   que difere é a granularidade da foto de regressão — uma imagem contra quatro.
3. **A tabela de UX Writing só aparece em duas páginas.** `usage.uxWriting`
   existe no conteúdo compartilhado nos três idiomas, com quatro linhas. React
   e Angular a passam ao container; **vue, svelte e vanilla não** — maioria
   sem, conteúdo com. Medido por ausência de `uxWriting` em
   `SkeletonDocs.vue`, `SkeletonDocs.svelte` e `SkeletonDocs.ts` do vanilla.
4. **O nome da região da demonstração é literal em duas stacks.** React, Vue e
   Svelte leem `demonstration.labels.*` para o `aria-label`; o Angular escreve
   `"Carregando cartão"`, `"Carregando lista"`, `"Carregando imagem"`,
   `"Carregando texto"` no template (`SkeletonDocs.ts:193,206,220,229`) e o
   vanilla escreve `'Carregando card de perfil'`, `'Carregando lista'`,
   `'Carregando imagem'`, `'Carregando parágrafo'` nas funções de demo
   (`SkeletonDocs.ts:88,116,145,163`). Maioria (3): lê do conteúdo. Nas duas
   stacks literais, trocar o idioma da página deixa o nome acessível em
   português.
5. **A demonstração do Angular contradiz as próprias legendas.** A legenda vem
   de `demonstration.labels` e diz "Card de perfil — avatar + 2 linhas", "Lista
   — 5 ítens", "Imagem — placeholder em AspectRatio 16/9". O template desenha um
   bloco de mídia + título + linha dentro de `ndsCard` (não avatar + 2 linhas),
   **três** itens na lista (não cinco) e um `nds-docs-skeleton-media` no lugar do
   AspectRatio. Maioria (4): a demonstração casa com a legenda, e a de imagem
   usa AspectRatio de verdade.
6. **A grade da demonstração tem três formas.** React, Vue e Svelte:
   `data-cols="2"` + `style="--grid-min: 16rem"`. Angular: `--grid-min: 16rem`
   **sem** `data-cols="2"`, então a grade pode abrir mais de duas colunas.
   Vanilla: `grid.dataset.min = '16rem'` — atributo **inerte**, que nenhuma
   regra lê; o docblock de `.nds-grid` em `layout.css` registra que essa
   promessa nunca existiu e que 32 marcações em quatro stacks já a copiaram. O
   efeito visual do vanilla é igual por coincidência, porque o default de
   `--grid-min` é justamente 16rem. Maioria (3): custom property + duas colunas.
7. **A lista da demonstração do Svelte não tem papel.**
   `SkeletonDocs.svelte:158` usa `<ul aria-busy aria-label>` sem
   `role="status"`. React, Vue, Vanilla e Angular usam `div` com
   `role="status"`. Maioria (4): papel presente. Nas stories a escolha se
   inverte e é consistente — as quatro stacks com composição usam a `<ul>` como
   região ocupada, sem `role="status"`, e duas delas acrescentam `role="list"`
   (react, vue) enquanto duas não (svelte, vanilla).
8. **A linha de teclado da seção de acessibilidade tem quatro formas.** Vanilla
   e Angular: duas linhas, `—` com a descrição e `Tab` com "sem interação por
   teclado". React: as mesmas duas linhas com os textos TROCADOS de lugar. Vue:
   duas linhas, as duas com a tecla `—`. Svelte: uma linha só. Não há maioria —
   o único par idêntico é vanilla + angular, e o vanilla é a referência.
9. **O título da lista de leitor de tela do Angular vem de outro lugar.**
   Quatro stacks leem `tNav('common.screenReader')`, que é cromo da página; o
   Angular lê `accessibility.screenReader.title` do conteúdo do componente.
   Maioria (4): cromo.
10. **Os rótulos de coluna da tabela de analytics têm três origens.** Vanilla e
    Angular leem `tNav('common.event')` e irmãs. React monta um ternário por
    locale dentro da página. Vue crava `'Evento'`, `'Quando dispara'`,
    `'Payload'`; Svelte crava `'Evento'`, `'Trigger'`, `'Payload'` — as duas
    últimas não traduzem, e a do svelte mistura dois idiomas na mesma linha.
    Maioria (2, e é a referência): vocabulário compartilhado.
11. **A seção de importação do Svelte tem um segundo bloco que ninguém mais
    tem.** `secondaryCode` com um exemplo de uso completo. As outras quatro
    passam só o import. O conteúdo compartilhado não tem chave para nenhum dos
    dois: `import` é `{}` nos três idiomas, e cada página escreve o próprio
    literal.
12. **A tabela de props tem seis linhas em quatro stacks e quatro no vanilla.**
    Quatro stacks listam `class`/`className`, `data-shape`, `data-width`,
    `data-size`, `aria-hidden` e `...rest`. O vanilla lista `className`,
    `shape`, `width`, `size` — sem `aria-hidden` e sem `...rest`. A diferença de
    NOME é divergência de API registrada (D6, fábrica contra atributo); a
    AUSÊNCIA do `aria-hidden` não é: a fábrica também o escreve fixo, e a chave
    `props.table.ariaHidden` existe no conteúdo. Maioria (4): a linha existe.
13. **O lado "não faça" do primeiro par de do/don't tem região em duas stacks.**
    Svelte e Vanilla envolvem o exemplo errado em `role="status"` + `aria-busy`;
    React, Vue e Angular não. O assunto daquele par é a FORMA da caixa, não a
    região — a região só é o assunto do segundo par, e lá as cinco concordam em
    omiti-la de propósito. Maioria (3): sem região.
14. **O que o "não faça" do primeiro par desenha muda por stack.** React, Vue e
    Svelte: uma linha de texto curta. Vanilla: uma linha de texto curta. Angular:
    um bloco de mídia. E o "não faça" do segundo par do Angular mistura texto
    real ("Joana Silva") com esqueleto, o que não é o que
    `doDont.pair2.dont` descreve ("esqueleto solto, sem região que anuncie o
    carregamento") — as outras quatro repetem o exemplo do "faça" tirando só a
    região, que é exatamente a lição.
15. **`componentSlug` chega a seções diferentes em cada página.** React o passa
    a variantes, relacionados e notas; Angular a importação, variantes,
    relacionados e notas; Vue, Svelte e Vanilla não o passam a seção nenhuma —
    só ao SEO. É o parâmetro que nomeia o componente nos eventos `docs_*` das
    seções, então onde ele falta o evento sai sem o slug. Maioria (3): não
    passa.
16. **O Angular não tem `skeleton.source.test.ts` e o React também não.**
    Vue, Svelte e Vanilla têm. O auditor reporta os dois em
    `source_sem_teste`. E o Angular tem UM construtor de snippet só
    (`skeletonPlaygroundSource`), então os dois outros arquivos de story dele
    publicam o template da story no painel Code —
    `story_file_sem_transform` reporta 5 stories em 2 arquivos.
17. **O instrumento de tokens lê zero linha da página do Svelte.**
    `node scripts/tabela-tokens.mjs skeleton` imprime `svelte:0` contra 4 nas
    outras quatro. **Não é linha faltando**: `SkeletonDocs.svelte:382-386`
    renderiza as mesmas cinco linhas, escrevendo cada uma por extenso com
    `$tStore('tokens.table.<k>.token')` em vez de mapear sobre uma lista de
    chaves — forma que nenhuma das regex do script casa, porque todas exigem o
    token LITERAL ou a lista de chaves. É "não sei ler" saindo como "não tem",
    a família que o próprio docblock do script existe para evitar, com uma forma
    nova.

## 8. Acessibilidade

**Atributos, no componente**: `aria-hidden="true"`, fixo, nas cinco (C1). Nada
mais — sem papel, sem nome, sem estado.

**Atributos, na região que espera o conteúdo** (D5): `role="status"` +
`aria-busy="true"` + `aria-label`. Os três juntos, e a razão de cada um está na
D5. Ao terminar o carregamento, `aria-busy` vira `false`, e é isso que faz o
leitor anunciar o conteúdo novo.

**Teclado**: nenhum. O esqueleto não é focável e não entra na ordem de
tabulação; o foco fica onde estava até o conteúdo real chegar. Diferente do
corpo rolável de um painel, aqui não há caixa que role, então não há parada de
teclado a nomear.

**Movimento reduzido**: WCAG 2.3.3. O pulso para, e quem o para é o bloco da
própria folha, porque a duração é literal (D2). A guarda está no FIM do arquivo,
e essa posição é o conserto, não arrumação — guarda de movimento tem de vir
depois do que ela desliga.

**Contraste**: nenhum critério de contraste da WCAG se aplica, porque o bloco não
transmite informação. O que se mede é luminância, com piso de 1,05 (C7, D3).

**O que deliberadamente NÃO se faz**:

- **não se anuncia o esqueleto**. Cinco linhas de esqueleto anunciadas são cinco
  interrupções sem informação;
- **não se põe `aria-live` na peça**. A região já é `status`, que é live por
  definição; uma segunda região viva dentro dela duplicaria o aviso;
- **não se usa `role="progressbar"`**. Não há valor a informar — para progresso
  mensurável a resposta é o Progress, e isso está escrito em
  `usage.guidelines.item5` e na tabela de cenários;
- **não se dá papel a cada item de lista** (D9);
- **não se acrescenta classe de movimento reduzido no consumidor**. A folha já
  para; forçar animação por cima quebra 2.3.3, e está escrito em
  `usage.guidelines.item4` e `notes.item4`.

## 9. Analytics

**O componente não dispara evento nenhum.** É passivo: aparece, pulsa, sai.
`analytics.description` do conteúdo compartilhado diz isso e diz o que fazer no
lugar — instrumentar o callback que substitui o esqueleto pelo conteúdo real. As
cinco páginas renderizam a seção com uma linha de travessões, sem evento.

**O que dispara são os eventos da própria docs page**, e eles não são do
esqueleto: `docs_page_view` e `docs_section_viewed`, nas cinco, com
`component_name: 'skeleton'` e o locale. Os eventos de seção (`docs_*` de
variante, relacionado, nota) saem dos containers compartilhados, e é aí que a
inconsistência 15 da §7 morde: onde `componentSlug` não é passado, o evento da
seção não sabe de que componente veio.

**Onde o `trackId` da variante é estável**: `rectangle`, `circle`, `line` — as
cinco páginas usam as mesmas três palavras, nunca o texto traduzido. Medido em
2026-09-13.

## 10. Reconstruir do zero

Ordem: folha → primitivo → região do consumidor nas stories → docs page.

- **Comece pela folha, e escreva a guarda de movimento POR ÚLTIMO** (D2). Com
  especificidade igual quem vem depois vence, e uma guarda escrita antes da
  declaração que ela desliga fica inerte sem nada acusar.
- **O primitivo é um `div` e um atributo fixo.** `data-slot="skeleton"`,
  `aria-hidden="true"`, a classe base, e mais nada. Se o primitivo estiver
  ganhando prop de dimensão, a decisão D1 foi revertida sem querer.
- **A região vem junto, sempre.** Ela não é peça do componente, mas toda
  superfície precisa dela, e é o trio inteiro ou nada (D5). No vanilla isso mora
  em `skeleton.fixtures.ts`, fora do arquivo de story — no CSF todo export
  nomeado vira story.
- **`fill` sozinho nasce com altura zero.** Qualquer superfície que o mostre
  precisa de um container que estabeleça a caixa; é por isso que o Playground das
  cinco troca para a classe de proporção de mídia quando a forma é `fill`.
- **Percentual precisa de base de largura** (D7). Num cluster sem `nds-flex-1` as
  linhas resolvem para zero e o esqueleto desaparece — e a story renderiza,
  vazia.
- **Meça a caixa, nunca a classe** (D1). É o defeito que esta folha já pagou uma
  vez, em quatro stacks ao mesmo tempo.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, formas, larguras, pulso, guarda de movimento | `docs/shared/styles/nds/skeleton.css` |
| texto, tabela de props, critérios de teste | `docs/shared/content/skeleton/translations.json` |
| medição compartilhada (caixa desenhada, pulso ativo, distinção do fundo) | `docs/shared/testing/skeleton-probe.ts` |
| o esqueleto do menu lateral, que é outra peça | `docs/shared/styles/nds/sidebar.css` (`.nds-sidebar-menu-skeleton*`) — ver D10 |
| a proporção de mídia que dá caixa ao `fill` | `docs/shared/styles/nds/docs-demo.css` (`.nds-docs-skeleton-media`) |
| a grade da demonstração, e por que `data-min` é inerte | `docs/shared/styles/nds/layout.css` (`.nds-grid`) |
| a escada de movimento e o override do preview | `docs/shared/tokens/motion.css` |
| portões determinísticos | `node scripts/audit.mjs skeleton --json` |
| tabela de tokens cruzada com as cinco páginas | `node scripts/tabela-tokens.mjs skeleton` |

**As guidelines de stack ainda têm seção de catálogo deste componente**, e por
isso o portão `catalogo_duplicado_com_prd` passa a reportar a partir da criação
deste arquivo — seis ocorrências, uma em `07-feedback-components.md` de cada
stack mais o ponteiro em `08-display-components.md` do vanilla. A migração é
deste PRD para lá, e não foi feita nesta rodada porque este documento nasceu com
escopo de um arquivo só. As três contradições que a leitura daquelas seções
encontrou estão na pendência abaixo.

---

**FECHADA em 2026-09-13**, no mesmo dia: a regra da categoria virou
[`19-feedback.md`](../guidelines/19-feedback.md), o catálogo do Skeleton ficou
aqui, as cópias de react, vue e svelte deixaram de existir, e o ponteiro na
`08-display-components.md` do vanilla passou a dizer que o componente é de
Feedback em vez de repetir o catálogo. O texto abaixo fica porque nomeia o que
cada cópia afirmava de errado.

O que a migração encontrou, medido em 2026-09-13: as seções `## Skeleton` das guidelines das cinco
stacks continuam de pé e agora duplicam este PRD; além disso três delas
contradizem o código: a do **vanilla**, que é a referência, não menciona o
`aria-hidden` que a própria fábrica escreve; a do **svelte** diz
`role="status"` **ou** `aria-label`, e nome sem papel é atributo proibido; a do
**angular** diz que a forma vem "de classe utilitária e de `data-*`", omitindo
que `aria-hidden` é fixo, e o docblock do primitivo daquela stack ainda ensina
`style` como caminho de dimensão, contra a regra da casa e contra o que as
outras quatro dizem.
slug — o que exige mover o catálogo para cá e deixar na guideline só regra de
categoria.

> **PENDÊNCIA · 2026-09-13** — o painel Code de duas stacks não ensina o que
> quem lê deveria copiar: o **angular** tem um construtor de snippet só, e os
> arquivos de variantes e de estados dele publicam o template da story; e nem
> **angular** nem **react** têm `skeleton.source.test.ts`, que é o que prova que
> o snippet bate com a story ao lado.
> **Fecha quando**: `story_file_sem_transform` e `source_sem_teste` não
> reportarem mais para este slug.

> **PENDÊNCIA · 2026-09-13** — o `seo.description` passa de 155 caracteres nos
> três idiomas (186 · 177 · 179), então o trecho abaixo do link no resultado de
> busca corta a frase no meio.
> **Fecha quando**: `seo_description_longo` não reportar mais para este slug.

> **PENDÊNCIA · 2026-09-13** — a medição de tema é de uma combinação em seis. O
> colhedor reexporta `darkLigarTheme` e nenhuma story de esqueleto o usa, então o
> piso de luminância de C7 é medido só no tema e no modo em que a suíte abre. No
> mesmo eixo, a story `Pulsing` das cinco afirma `borderRadius !== '0px'`, e essa
> afirmação é falsa no tema `cold`, que declara `--radius: 0` como identidade de
> forma (D4): o portão reprovaria um tema legítimo se alguém o exercitasse.
> **Fecha quando**: houver uma story que meça a distinção do fundo nos três
> temas em ambos os modos, e a asserção de raio deixar de afirmar um valor que o
> tema pode zerar.

> **PENDÊNCIA · 2026-09-13** — C8 não tem portão. As cinco stacks medem
> `height > 0`, que pega o colapso histórico para zero e não pega altura cravada
> por fora nem desvio da escada de texto — a altura de `text` deveria ser
> exatamente a medida de texto de controle e a de `heading` a de `h4` (D8), e
> nenhuma asserção compara com o token.
> **Fecha quando**: houver story que compare a altura desenhada com o valor
> calculado do token, nas cinco.

> **PENDÊNCIA · 2026-09-13** — `data-width` sobrescreve a medida do avatar
> quando não há `data-size`. Na folha, `[data-shape='avatar']` (0,2,0) vem ANTES
> de `[data-width='…']` (0,2,0), e com especificidade igual quem vem depois
> vence: um avatar com `data-width="1-2"` sai com metade da largura do container
> e a altura da escada — retângulo, não círculo. Com `data-size` a regra de
> avatar sobe para (0,3,0) e a disputa desaparece. Hoje nada acusa porque as
> cinco stacks filtram a largura no consumidor (Playground, fábrica de snippet e
> primitivos só a aplicam às formas de texto), isto é: a restrição é executada
> cinco vezes no consumidor em vez de uma na folha.
> **Fecha quando**: a folha restringir `data-width` às formas de texto, ou uma
> story afirmar que a combinação proibida não desenha retângulo.
