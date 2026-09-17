# PRD — Breadcrumb

> **Estado descrito**: 2026-09-17, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código vai usar este documento como base:
> o que está aqui foi medido nas cinco stacks, na folha compartilhada, no
> conteúdo e no Figma, e as divergências entre stacks estão registradas em vez de
> resolvidas.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
>
> **É a primeira descrição unificada, não a primeira descrição.** `## Breadcrumb`
> existe nas cinco `05-navigation-components.md`, e as cinco cópias afirmam coisas
> que o código contradiz — a começar pelo nome acessível do landmark, que quatro
> delas dão como "Localização na página" e que é `breadcrumb` nas cinco
> implementações. A medição está na §11, e o `catalogo_duplicado_com_prd` passa a
> reportá-las no minuto em que este arquivo existe.

## 1. Identidade

Trilha que diz **onde a página está numa hierarquia** e leva de volta a qualquer
nível acima dela. É um `<nav>` nomeado com uma `<ol>` dentro: os níveis anteriores
são links, o último é a página atual e não é link, e entre eles há separadores
que não existem para leitor de tela.

Não guarda estado, não gerencia foco e não tem teclado próprio. O que ele entrega
é **semântica** — papel, nome, ordem e `aria-current` —, e é por isso que a sonda
compartilhada mede árvore de acessibilidade e quase nada de pixel.

| vizinho | diferença que decide |
|---|---|
| Pagination | também é `<nav>` com `aria-current="page"`, mas as páginas são irmãs e intercambiáveis; aqui cada nível CONTÉM o seguinte |
| Tabs | alterna painéis do mesmo nível na mesma tela; a trilha troca de página e só sobe na hierarquia |
| Stepper | ordem obrigatória e progresso; a trilha não tem "próximo passo", só "acima de mim" |
| NavigationMenu / Sidebar | navegação principal, todos os destinos do produto; a trilha mostra só o caminho até a página atual (`usage.scenarios.item2`) |
| DropdownMenu | não é vizinho, é consumidor da composição responsiva: é ele que devolve à tela os níveis colapsados nas reticências |

**Ninguém fora do próprio componente o usa.** Medido em 2026-09-17: nenhum arquivo
das cinco stacks fora de `ui/breadcrumb*`, das stories e das docs pages instancia
as peças, e a única folha além de `breadcrumb.css` que nomeia a classe é um
comentário de `stepper.css`. O `escala-de-espacamento.stories.ts` do vanilla usa
`.nds-breadcrumb-ellipsis` como sonda de degrau de espaçamento — é o único outro
leitor da folha.

## 2. Contrato de comportamento

Cada linha aponta a chave de `docs/shared/content/breadcrumb/translations.json` que
a publica e a story que a mede. O dicionário tem **224 chaves folha em cada um dos
três idiomas** (conferido em 2026-09-17). A sonda compartilhada é
`docs/shared/testing/breadcrumb-probe.ts`, e ela é consumida **só pelo Playground**
das cinco stacks (`reprovasDeBreadcrumb(measureBreadcrumb(...))`).

| # | o contrato | chave · onde é medido |
|---|---|---|
| C1 | A raiz é `<nav>` com `data-slot="breadcrumb"`, classe `.nds-breadcrumb` e nome acessível `breadcrumb` por padrão | `anatomy.item1`, `testes.accessibility.item1` · Playground das cinco, por `getByRole('navigation', { name: 'breadcrumb' })` e pela sonda |
| C2 | Os níveis vivem numa `<ol>` com `.nds-breadcrumb-list` — a ordem é o sentido | `anatomy.item2`, `testes.functional.item1` · Playground das cinco (`tagName === 'OL'`) e sonda |
| C3 | Só os níveis ANTERIORES são links; a página atual não entra na contagem de `link` | `testes.functional.item2` · Playground das cinco (`getAllByRole('link').length === 2`) |
| C4 | A página atual é `<span aria-current="page">`, sem `href`, sem `<a>` dentro, e é o ÚLTIMO `<li>` da lista | `anatomy.item5`, `testes.accessibility.item2` · Playground das cinco; a posição só pela sonda (`ehUltimoItem`) |
| C5 | Todo separador é um `<li>` próprio com `role="presentation"` e `aria-hidden="true"` | `anatomy.item6`, `testes.accessibility.item3` · Playground e `CustomSeparator` das cinco |
| C6 | Sem conteúdo, o separador desenha `ChevronRight`; com conteúdo, o conteúdo substitui o chevron (um filho só) e o `aria-hidden` continua | `testes.functional.item4` · `CustomSeparator` das cinco (`children.length === 1`, `[data-icon="slash"]`) |
| C7 | Nenhuma peça decorativa vaza para a ordem de leitura | — · sonda (`leituraOrder` sem `texto:`), Playground das cinco |
| C8 | Com rótulo, as reticências são `role="img"` com `aria-label`; sem rótulo, `aria-hidden="true"` e sem `role` — nunca as duas coisas, nunca nenhuma | `anatomy.item7`, `accessibility.item4`, `testes.functional.item5` · `WithEllipsis` das cinco (metade anunciada); a metade decorativa só em `EllipsisWithTrigger` e `Collapsed` do angular; o "nunca as duas" só pela sonda |
| C9 | As reticências não entram na tabulação | — · `WithEllipsis` das cinco (`hasAttribute('tabindex') === false`) |
| C10 | Clique e Enter num link chegam ao ouvinte de quem consome; clique na página atual não chega a nada | `testes.functional.item3`, `item6` · `Simple` e composição de trilha das cinco, com espião de módulo |
| C11 | O único item focável da trilha simples é o link; Tab sai dele para fora da trilha | `testes.functional.item6`, `accessibility.keyboard.tab` · `Simple` das cinco |
| C12 | O link do router mantém os próprios atributos e ganha `.nds-breadcrumb-link`, sem virar um segundo elemento | `states.asChildLink` · `AsChildLink` (react, vue, svelte, vanilla), `RouterLink` (angular) |
| C13 | Reticências dentro de um gatilho: o gatilho tem o nome, abre o menu, e Escape devolve o foco a ele | `variants.items.responsive`, `testes.visual.item4` · `Responsive` (react, vue, svelte, vanilla), `Collapsed` (angular) |
| C14 | O foco por teclado desenha anel visível no link | `testes.accessibility.item5` · **só o angular mede** (`outlineWidth !== '0px'` na `Simple`); as outras quatro declaram `covers` e afirmam só o foco |
| C15 | Texto dos links inativos alcança 4.5:1 | `accessibility.item5`, `testes.accessibility.item4` · nenhuma story mede a razão; quem cobre é o axe do addon-a11y no Playground |

**Três afirmações publicadas não têm produtor em nenhuma stack**: a quebra de linha
da trilha longa (§6), a cor de hover do link e o nome do landmark sobrescrito por
quem consome — este último só aparece como atributo nas docs pages e no
`Collapsed` do angular, e só o vanilla afirma o valor (pelo apelido depreciado, no
Playground).

## 3. Decisões fixadas

### D1 · A página atual é `<span aria-current="page">`, e nunca teve de ser link

**Estado**: as cinco renderizam `<span>` com `aria-current="page"` fixo, sem `role`
e sem `aria-disabled`.
**Motivo, escrito nos cinco primitivos com o mesmo texto**: o `role="link"` com
`aria-disabled` que existia fazia o leitor de tela anunciar "link, desabilitado"
para um texto que nunca foi navegável. `aria-current` vale em qualquer elemento.
**Medição que o protege**: C3 — a contagem de `link` é 2 numa trilha de três
níveis; com o papel antigo dava 3.
**Onde está escrito**: `breadcrumb.ts:157` (vanilla), `breadcrumb.tsx:64` (react),
`BreadcrumbPage.vue:11`, `breadcrumb-page.svelte:13`, `breadcrumb.ts:184` (angular).

### D2 · O separador é `<li>` próprio, decorativo no host, com chevron por padrão

**Estado**: `<li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true">`
nas cinco, IRMÃO dos itens e não filho deles. O desenho padrão é o `ChevronRight`
do lucide.
**Medição que trocou o padrão do vanilla**: o default da fábrica era o caractere
`›`, e era o único dos cinco. A anatomia compartilhada diz `ChevronRight`, a folha
dimensiona `.nds-breadcrumb-separator > svg` e nada dimensiona caractere — a docs
page do vanilla afirmava uma coisa, a fábrica produzia outra, e o Chromatic
fotografava um separador diferente só ali (`breadcrumb.ts:179-185`).
**Consequência que vale registrar**: `role` e `aria-hidden` moram no HOST, fora do
alcance de quem customiza o desenho. Trocar o chevron por `/` não devolve o
separador à leitura — é o que o segundo passo da `CustomSeparator` das cinco
afirma. No angular isso está escrito na diretiva (`breadcrumb.ts:201-209`).

### D3 · Reticências: rótulo opcional, e sem rótulo elas são desenho

**Estado**: com rótulo, `role="img"` + `aria-label`; sem rótulo, `aria-hidden="true"`.
As cinco implementam a mesma bifurcação.
**Motivo, escrito nos cinco**: o texto `sr-only` "More" morava DENTRO de um
`aria-hidden` — nenhum leitor de tela chegava nele, e ainda estava em inglês. Quem
nomeia o conjunto oculto, quando há menu, é o gatilho que envolve as reticências;
rótulo nas duas coisas vira leitura duplicada.
**Onde está escrito**: `breadcrumb.ts:208-217` (vanilla) e o comentário equivalente
nos outros quatro primitivos. O `pagination.md` registra que o Pagination herdou
esta correção do Breadcrumb.

### D4 · Não há primitivo headless, em nenhuma stack

**Estado**: as cinco escrevem a trilha à mão. O angular documenta por quê
(`breadcrumb.ts:18-24`): `@radix-ng/primitives` não publica `breadcrumb`, e não
haveria o que compor — a trilha não guarda estado nem gerencia foco. O vue só
importa o `Primitive` da reka no `BreadcrumbLink`, e só para ter `as`/`as-child`.
**Consequência**: é o componente em que as cinco stacks estão mais perto de
produzir o mesmo DOM, e a sonda confirma isso no Playground das cinco.

### D5 · O nome acessível padrão do landmark é `breadcrumb`, e é sobrescrevível

**Estado**: `aria-label="breadcrumb"` — em inglês e minúsculo — nas cinco. As cinco
aceitam sobrescrita (§7).
**Motivo, escrito no angular** (`breadcrumb.ts:107-116`): a página pode ter mais de
uma navegação; sem nomes distintos o axe acusa `landmark-unique`. As cinco docs
pages dão nome próprio a cada instância por esse motivo.
**O que as guidelines dizem, e o código não faz**: react, vue, svelte e vanilla
prescrevem `aria-label="Localização na página"`; vanilla e angular mandam
explicitamente NÃO usar "Breadcrumb"; o angular diz "um padrão em português". Ver
§11 e a pendência de decisão abaixo.

> **PENDÊNCIA · 2026-09-17** — o nome padrão do landmark é `breadcrumb` nas cinco
> implementações, no conteúdo compartilhado (`accessibility.aria.navLabel`,
> `testes.accessibility.item1`) e nas plays; as cinco guidelines de stack
> prescrevem outro nome, e duas proíbem justamente o que o código escreve. Um dos
> dois lados precisa ceder, e é decisão da dona. Estreitada em 2026-09-17: as
> guidelines de stack que prescreviam outro nome saíram com a migração do
> catálogo, então hoje o nome `breadcrumb` só não tem decisão escrita — o conflito
> entre documentos acabou, e o item 2 de "O que está aberto" da
> `docs/shared/guidelines/21-navegacao.md` pergunta se ele deve seguir o idioma.
> **Fecha quando**: a decisão estiver registrada aqui como D5 revisada.

### D6 · A trilha quebra linha; não rola e não trunca

**Estado**: `.nds-breadcrumb-list` declara `flex-wrap: wrap` e `word-break: break-word`.
Nenhuma regra de `overflow`, `text-overflow` ou `white-space` na folha.
**O que isso contradiz**: a guideline do vanilla manda "usar overflow horizontal
com scroll" quando necessário. A do angular manda recolher níveis do meio com as
reticências, que é compatível com a folha.
**Produtor**: nenhum — nenhuma story estreita a largura (§6).

### D7 · O anel de foco é `outline` de 2px a meia opacidade

**Estado**: `.nds-breadcrumb-link:focus-visible` declara `outline: 2px solid` sobre
`--ring` com alfa `0.5`, `outline-offset: 2px` e raio `--radius-xs`.
**Por que é decisão a revisar, e não detalhe**: `button.css` registra a medição que
tirou a meia opacidade do anel do botão — o halo translúcido sozinho dava de
1,87:1 a 2,42:1 contra a superfície, abaixo dos 3:1 de WCAG 1.4.11 — e o botão
passou a vão de 2px mais banda opaca. O Pagination herdou a forma opaca; o Sheet
teve a mesma divergência entre texto e folha registrada no README deste diretório.
O Breadcrumb continua na forma que a medição reprovou, e o único teste que olha o
anel (angular) afirma só que a largura não é zero.

> **PENDÊNCIA · 2026-09-17** — o anel de foco do link está a 50% de opacidade, na
> forma que a medição do `button.css` reprovou por contraste; nenhuma story mede a
> razão do anel.
> **Fecha quando**: `breadcrumb.css` deixar de declarar `/ 0.5` no `outline` do
> `:focus-visible`, ou a exceção estiver escrita nesta decisão com a razão medida
> nos três temas e nos dois modos.

### D8 · A página atual é `--foreground` com peso regular, não mais pesada

**Estado**: `.nds-breadcrumb-page` pinta `--foreground` e declara
`--font-weight-regular`. O link inativo herda `--muted-foreground` da lista.
**O que distingue a página atual**: cor mais forte e `aria-current`, não peso — é o
que a guideline do vanilla escreve, e a folha cumpre.

### D9 · `class` é a opção canônica do vanilla, com apelidos depreciados

**Estado**: as sete fábricas aceitam `class` e o apelido `className`; `createBreadcrumb`
e `createBreadcrumbEllipsis` aceitam `aria-label` e o apelido `label`. Quando os dois
vêm, o canônico vence.
**Onde é afirmado**: último passo do Playground do vanilla — é a única stack com
apelido, e a única play que prova o apelido E a precedência.

### D10 · O componente não dispara nada

**Estado**: nenhum dos cinco primitivos importa `track`. O evento é de quem
consome — nas docs pages, da demonstração. A diretiva de link do angular não
intercepta evento nenhum, e o `RouterLink` afirma isso clicando e contando o
espião do consumidor.

## 4. Anatomia

```
breadcrumb                  <nav>, aria-label ("breadcrumb" por padrão)
└── breadcrumb-list         <ol>, flex com quebra de linha, sem marcador
    ├── breadcrumb-item     <li>
    │   └── breadcrumb-link          <a href>, nível anterior
    ├── breadcrumb-separator         <li role="presentation" aria-hidden>, chevron ou conteúdo
    ├── breadcrumb-item
    │   └── breadcrumb-ellipsis      <span>, opcional; img nomeada ou desenho
    ├── breadcrumb-separator
    └── breadcrumb-item     (último)
        └── breadcrumb-page          <span aria-current="page">
```

Sete `data-slot`, e os sete saem nas cinco stacks com as mesmas tags e as mesmas
classes `.nds-breadcrumb*`. A árvore é a do vanilla e é a que a sonda busca.

**O que é conteúdo de quem compõe**: o texto do link e da página, o `href`, o
desenho do separador customizado, quantos níveis existem e onde entram as
reticências. **O gatilho de menu em volta das reticências NÃO é peça**: é um botão
ou o gatilho do DropdownMenu, escrito por quem compõe (§7, V8).

**O ícone não é peça publicada em quatro das cinco**: é SVG filho que a folha
dimensiona por `> svg`. O angular publica `svg[ndsBreadcrumbIcon]` com `kind`
(`chevron-right`, `more-horizontal`, `slash`), porque cada ícone do lucide é uma
lista `[tag, attrs]` com tag variável e template Angular exige tag estática; os
nós são criados por `createElementNS`, sem `innerHTML`.

**Figma**: o conjunto `353:298` ("Breadcrumb") é um símbolo com cinco instâncias —
`breadcrumb-link`, `breadcrumb-separator`, `breadcrumb-link`,
`breadcrumb-separator`, `breadcrumb-page` —, separador de 14×14 e passo de 6px
entre peças, que batem com a folha (§5). Não há instância de reticências na trilha
montada. Conferido por leitura de metadados em 2026-09-17.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/breadcrumb.css`, 93 linhas, lida linha a linha em
2026-09-17. Instrumento: `node scripts/tabela-tokens.mjs breadcrumb` — em
2026-09-17 fecha com **0 linhas que não fecham com a folha**, 1 token do componente
não listado por nenhuma página (o raio do anel) e **6 divergências entre stacks**
(V22).

| propriedade | valor | token |
|---|---|---|
| raiz | nenhum estilo | — (o `<nav>` é landmark e só isso) |
| lista · distância entre peças | 6px | `--spacing-1-5` |
| lista · corpo do texto | 14px | `--text-control` |
| lista · cor (links inativos herdam) | — | `--muted-foreground` |
| lista · margem, padding e marcador | zero | **literal** `0` e `list-style: none` — reset de `<ol>` |
| lista · quebra | por linha e por palavra | **literal** `flex-wrap: wrap` e `word-break: break-word` (D6) |
| item · distância interna | 4px | `--spacing-1` |
| link · cor em repouso | herdada | **literal** `inherit` |
| link · sublinhado | nenhum | **literal** `none` |
| link · transição | cor | `--duration-fast` |
| link · cor sob o ponteiro | — | `--foreground` |
| link · anel de foco | 2px a 50%, afastado 2px | `--ring`, com `2px`, `0.5` e `2px` literais (D7) |
| link · raio do anel | 8px na base | `--radius-xs` |
| página atual · cor | — | `--foreground` |
| página atual · peso | 400 | `--font-weight-regular` (D8) |
| separador · ícone | 14px | **literal** `0.875rem` |
| separador · seleção de texto | desligada | **literal** `user-select: none` |
| reticências · caixa | 20px | `--spacing-5` |
| reticências · ícone | 16px | `--spacing-4` |

**Nenhuma cor literal na folha.** O único alfa escrito à mão é o `0.5` do anel (D7).

**Os literais, e por que cada um é literal**:

- `0.875rem` do chevron — é o único tamanho da folha fora da escala de espaçamento,
  e está declarado assim nas tabelas do vanilla e do angular ("sem token"). O Figma
  desenha o separador em 14×14, então o literal e o desenho concordam;
- `2px` / `2px` do anel e o alfa `0.5` — ver D7;
- os resets (`0`, `none`, `inherit`, `user-select`) — mecânica, não design.

**Nenhum `height` em peça com texto.** As duas únicas alturas da folha são a caixa
das reticências (`--spacing-5`, sem texto) e os ícones — o que respeita a regra de
que peça de texto cresce com a fonte.

**Sem sombra, sem camada, sem movimento além da duração.** A trilha vive no plano
da página. Não há bloco `prefers-reduced-motion` na folha; quem zera a transição
sob a preferência é a escada de `docs/shared/tokens/motion.css`, que leva a duração
rápida a zero.

**A caixa das reticências é sonda de densidade**: o
`escala-de-espacamento.stories.ts` do vanilla mede a `width` de
`.nds-breadcrumb-ellipsis` como "degrau 5" da escada.

**O comentário do cabeçalho da folha está incompleto e desatualizado**: lista dois
tokens (a folha lê onze) e desenha o separador como `›` em `<li>`, o caractere que
D2 tirou do vanilla.

## 6. Estados

| estado | quando ocorre | o que muda | tem produtor? |
|---|---|---|---|
| Repouso | sempre | links em cor atenuada, página atual em cor cheia | sim, as cinco |
| Link sob o ponteiro | `:hover` | cor sai para a de primeiro plano | **não afirmado** — nenhuma story das cinco lê a cor sob o ponteiro |
| Foco por teclado | `:focus-visible` no link | anel de 2px a meia opacidade (D7) | sim nas cinco como foco; **o anel só é medido no angular** (C14) |
| Página atual | `aria-current="page"` | cor cheia, peso regular | sim, as cinco |
| Reticências anunciadas | com rótulo | `role="img"` + nome | sim, `WithEllipsis` das cinco |
| Reticências decorativas | sem rótulo | `aria-hidden` | sim como markup nas composições de menu das cinco; **afirmado só no angular** (`EllipsisWithTrigger`, `Collapsed`) |
| Separador customizado | conteúdo no separador | o conteúdo substitui o chevron | sim, `CustomSeparator` das cinco |
| Trilha que não cabe | largura insuficiente | quebra de linha (D6) | **não** — nenhuma story estreita a largura |
| Movimento reduzido | `prefers-reduced-motion` | transição da cor vai a zero, pela escada global | **não** — nenhuma story de breadcrumb lê a preferência |

O conteúdo compartilhado publica DUAS configurações em `states` (`simple`,
`asChildLink`), e as cinco docs pages renderizam as duas — o angular com
`trigger` e `behavior` de `asChildLink` sobrescritos, porque não há elemento a
substituir numa diretiva de atributo.

## 7. API

O eixo compartilhado é pequeno e é quase todo composição: sete peças, nenhuma
variante, nenhum tamanho. O conteúdo diz isso em `variants.note` ("não tem
variantes visuais").

| peça | prop | tipo | padrão | onde existe |
|---|---|---|---|---|
| raiz | nome acessível | string | `breadcrumb` | as cinco, por formas diferentes (tabela abaixo) |
| link | destino | string | — | as cinco; **obrigatório só no vanilla** (V5) |
| link | troca do elemento | — | — | react, vue, svelte; no angular a diretiva já vai no elemento de quem escreve; o vanilla não troca |
| separador | desenho | conteúdo | `ChevronRight` | as cinco |
| reticências | rótulo | string | — | as cinco, com nome diferente no vanilla (V1) |
| todas | classe extra | string | — | as cinco |

### Divergências de framework, registradas

| stack | como difere |
|---|---|
| react | Sete funções sobre elementos nativos; só o `BreadcrumbLink` passa por `useRender` do base-ui, e aceita `render` para trocar o `<a>` pelo link do roteador — o `data-slot` sai do `state`. Nome do landmark é o atributo nativo `aria-label`, espalhado depois do padrão. `className`. Reticências com `label` |
| vue | Sete SFCs de raiz única, sem `inheritAttrs: false` — o `aria-label` que o consumidor escreve cai no `<nav>` pelo repasse de atributos do Vue. O `BreadcrumbLink` embrulha o `Primitive` da reka com `as: 'a'` por padrão e `as-child`. Separador e **reticências** aceitam conteúdo por slot. `class`. Reticências com `label` |
| svelte | Sete peças com `ref` bindável e `restProps` DEPOIS dos atributos fixos (o que permite sobrescrever `aria-label` e, também, os atributos ARIA das reticências). O link aceita o snippet `child({ props })` para entregar os atributos a um `<a>` do consumidor; `href` tem padrão `undefined`. O índice exporta as formas curtas (`Root`, `Link`…) ao lado das longas. `BreadcrumbStory.svelte` é andaime de story |
| vanilla | Sete fábricas independentes, montadas por `append` de quem consome. `createBreadcrumbLink` exige `href` e recebe o texto por `text` (`textContent`, sem HTML). `createBreadcrumbSeparator` recebe `content` como string ou elemento. Nome do landmark e rótulo das reticências por `aria-label`, com apelidos depreciados (D9). Não há troca de elemento: a integração com roteador é interceptar o clique no `<a>` devolvido, e a docs page reescreve `props.extensibility` para dizer isso |
| angular | Seletores de ATRIBUTO no elemento nativo: cinco `@Directive` (raiz, lista, item, link, página) e dois `@Component` (separador e reticências, que têm desenho padrão). O nome do landmark é o input `label`, e o `aria-label` estático é lido na CONSTRUÇÃO como padrão, porque o host binding o apagaria. O separador usa conteúdo de fallback do `<ng-content>`. Publica a peça de ícone `svg[ndsBreadcrumbIcon]` |

**Onde a forma NÃO é divergência**: as cinco produzem a mesma árvore de sete
`data-slot`, com as mesmas tags e classes. O critério da lista abaixo foi sempre o
que sai no DOM, o que a story afirma e o que a página publica.

### Peças, por stack

| stack | peças |
|---|---|
| react | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis` |
| vue | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis` |
| svelte | `Root`/`Breadcrumb`, `List`, `Item`, `Link`, `Page`, `Separator`, `Ellipsis` (nomes curtos e longos) |
| vanilla | `createBreadcrumb`, `createBreadcrumbList`, `createBreadcrumbItem`, `createBreadcrumbLink`, `createBreadcrumbPage`, `createBreadcrumbSeparator`, `createBreadcrumbEllipsis`, tipos `Breadcrumb*Options` |
| angular | `nav[ndsBreadcrumb]`, `ol[ndsBreadcrumbList]`, `li[ndsBreadcrumbItem]`, `a[ndsBreadcrumbLink]`, `span[ndsBreadcrumbPage]`, `li[ndsBreadcrumbSeparator]`, `span[ndsBreadcrumbEllipsis]`, `svg[ndsBreadcrumbIcon]`, tipo `BreadcrumbIconKind` |

**A prop `asChild` existe numa stack só.** `props.table.asChild` no conteúdo
compartilhado descreve "assume o elemento recebido como filho"; ela é real no vue
(`as-child`), a tabela do svelte a usa para descrever o snippet `child`, e react,
vanilla e angular não a têm. A docs page do vue também declara `asChild` como prop
na interface — correto ali.

### Inconsistências entre stacks, medidas em 2026-09-17

Nenhum dos itens abaixo é visto por portão, salvo onde dito. Os achados do auditor
estão na §11.

| # | o que difere | quem faz o quê | lados |
|---|---|---|---|
| V1 | nome da prop do rótulo das reticências | `aria-label` (com apelido `label`) no vanilla; `label` em react, vue, svelte e angular | 4 × 1 — API, registrar e não alinhar; a referência é a minoria |
| V2 | como se sobrescreve o nome do landmark | atributo nativo em react, vue e svelte; opção `aria-label` (com apelido) no vanilla; input `label` mais atributo estático no angular | três formas — API |
| V3 | conteúdo substituível nas reticências | só o vue aceita slot; nas outras quatro o `MoreHorizontal` é fixo | 4 × 1 |
| V4 | desenho de barra para o separador | angular publica `kind="slash"` na peça de ícone; react, vue e svelte importam `Slash` do lucide; o vanilla não tem — a story monta o SVG à mão e a docs page usa o caractere `/` | sem maioria |
| V5 | `href` obrigatório | só o tipo do vanilla exige; nas outras quatro é opcional, e o `<a>` sem `href` sai sem papel de link — a docs page das cinco marca `href` como obrigatório mesmo assim | 4 × 1 |
| V6 | nome da story do link de roteador | `AsChildLink` em react, vue, svelte e vanilla; `RouterLink` no angular | 4 × 1 |
| V7 | stories de composição | `Default` + `Responsive` em react, vue, svelte e vanilla; `CompleteTrail` (quatro níveis) + `EllipsisWithTrigger` + `Collapsed` no angular | 4 × 1 |
| V8 | gatilho das reticências na composição com menu | `DropdownMenuTrigger` com `nds-cluster` em react, vue e svelte; `<button>` cru com `background`, `border` e `padding` em `style` inline no vanilla; `Button` do design system (`ghost`, `icon-sm`) no angular | 3 × 1 × 1 |
| V9 | níveis ocultos dentro do menu | item de comando sem destino (`menuitem`) em react, vue, svelte e vanilla; link com `href` (`ndsDropdownMenuLinkItem`) no angular, com o motivo escrito na story: destino quer link | 4 × 1 — e a minoria é a que tem argumento |
| V10 | anel de foco medido | só a `Simple` do angular lê `outlineWidth`; as outras quatro cobrem `testes.accessibility.item5` afirmando apenas o foco | 4 × 1 |
| V11 | controles no Playground | angular tem `argTypes` (`currentPage`, `separator`); as outras quatro não têm args | 4 × 1 |
| V12 | `design: figmaDesign(...)` nos arquivos de story | presente nos três arquivos de react, vue, svelte e vanilla; ausente nos três do angular | 4 × 1 |
| V13 | painel Code | react, vue e svelte têm seis construtores e teste; vanilla tem dois construtores parametrizados com `…With` e teste; angular tem UM (`breadcrumbPlaygroundSource`), sem teste, e os sete stories de estados e composições publicam o template da story | 4 × 1 (portão: `source_sem_teste`, `story_file_sem_transform`) |
| V14 | payload do espião de navegação nas stories | `{ event: 'navigation_click', label }` em react, vue, svelte e vanilla; `{ label }` no angular | 4 × 1 |
| V15 | conteúdo da demonstração | três trilhas (padrão, reticências, separador customizado) em react, vanilla e angular; UMA trilha de quatro níveis, sem reticências nem separador customizado, em vue e svelte | 3 × 2 |
| V16 | reticências da demonstração | anunciadas com `demonstration.labels.more` no vanilla e no angular; decorativas sem rótulo no react; ausentes em vue e svelte | sem maioria (portão: `demonstration_labels_divergent` em react e vue) |
| V17 | variante `responsive` na docs page | com DropdownMenu de verdade em react e svelte; reticências soltas no vue (decorativas) e no vanilla (anunciadas, e o snippet termina num comentário "attach DropdownMenu trigger behavior here"); o angular não publica a variante | 2 × 2 × 1 |
| V18 | `breadcrumb_ellipsis_open` disparado | react e svelte, ao abrir o menu da variante; vue, vanilla e angular nunca — e as cinco tabelas de analytics o anunciam | 2 × 3 |
| V19 | `label` do `navigation_click` | texto TRADUZIDO em react, vue e vanilla; chave estável (`home`, `components`…) em svelte e angular | 3 × 2 — a maioria e a referência violam a regra de payload estável (§9) |
| V20 | navegação do `href="#"` nas demos | o angular chama `preventDefault`; as outras quatro deixam o `#` seguir | 4 × 1 |
| V21 | `location` fora da demonstração | react, vanilla e angular mandam `docs_demo` também de Variantes e Do & Don't, pelo mesmo helper; o svelte manda `docs_demo` do menu da variante; o vue só rastreia na demonstração | 4 × 1 (portão: `location_so_da_demo` vê só o svelte) |
| V22 | tabela de tokens | vanilla e angular listam seletores da folha e tokens reais; react, vue e svelte listam utilitárias que o componente NÃO veste (`nds-text-muted-foreground`, `nds-hover-text-foreground`, `nds-focus-ring`) e resíduo de framework que saiu do projeto (`text-sm`, `gap-1.5`, `[&>svg]:size-3.5`, `size-5`); o vue escreve `—` na coluna de token | 3 × 2 — e vanilla e angular ainda divergem entre si nas linhas de primeiro plano e de anel |
| V23 | snippet "como personalizar via tema" | react e svelte com valores HSL literais de uma paleta que não é a do projeto; vue e vanilla com outras duas paletas literais (o vanilla ainda com uma classe `my-breadcrumb-separator`); angular com seletores escopados e sem valor | quatro redações |
| V24 | rótulo das reticências na tabela de props | listado no vanilla (`aria-label`) e no angular (`label`); omitido em react, vue e svelte, que aceitam `label` — a interface publicada nos três também o omite | 3 × 2 |
| V25 | descrição das props na própria stack | o vanilla escreve quatro descrições literais em português na tabela, fora do dicionário — em en e es a coluna sai em português | 1 × 4 |
| V26 | JSON-LD `BreadcrumbList` da própria docs page | só o angular passa `breadcrumb` a `applySeo` (com `aiSummary` e `aiEntities`); as outras quatro não | 1 × 4 — e `notes.tip1` é justamente sobre isso |
| V27 | nome acessível das trilhas das Variantes | o identificador em inglês sozinho (`default`, `withEllipsis`) em react, vue, svelte e vanilla; título traduzido + sufixo no angular | 4 × 1 |
| V28 | trilha da variante de separador customizado | react, vanilla e angular usam `Início / Componentes / Breadcrumb`; vue e svelte trocam o nível do meio por `Documentação` na variante e no snippet | 3 × 2 |

## 8. Acessibilidade

**Atributos que as cinco escrevem**: `aria-label` no `<nav>`; `aria-current="page"`
na página atual; `role="presentation"` e `aria-hidden="true"` em cada separador;
`aria-hidden="true"` no SVG do chevron e das reticências; nas reticências,
`role="img"` + `aria-label` OU `aria-hidden` (D3). Nenhuma stack escreve
`role="list"` ou `role="listitem"` — a `<ol>` nativa já os tem.

**Teclado**: só o que `<a href>` já traz — Tab, Shift+Tab e Enter. Não há setas,
não há `roving tabindex`. A página atual e as reticências não entram na tabulação;
o gatilho de menu, quando existe, entra, e é ele que recebe Escape de volta.

**O que deliberadamente NÃO se faz**:

- não se dá papel de link à página atual (D1);
- não se põe texto `sr-only` sob `aria-hidden` nas reticências (D3);
- não se põe rótulo nas reticências E no gatilho que as envolve — leitura duplicada;
  está escrito nas composições de menu das cinco;
- não se deixa o separador customizado voltar à leitura (D2);
- não se rastreia clique na página atual — `analytics.description` e a
  `07-analytics.md` §Breadcrumb dizem isso, e a composição de trilha das cinco afirma
  que o clique nela não chama nada.

**Contraste**: nenhuma story mede a razão do texto atenuado nem a do anel. O
`accessibility.item5` afirma 4.5:1 "em ambos os modos"; o que o sustenta hoje é o
axe do addon-a11y rodando no Playground, que mede texto e não mede anel (D7).

**Leitor de tela**: `accessibility.screenReader.onEnter` promete o anúncio de
"navegação, breadcrumb" e do número de itens. O número anunciado é o de `<li>`
visíveis à árvore — separadores `presentation` não contam em leitor que respeita o
papel, mas a sonda conta todos os `<li>` diretos (`list.items`), então ela não mede
essa promessa.

## 9. Analytics

| evento | quem dispara hoje | payload |
|---|---|---|
| `navigation_click` | as cinco docs pages | `{ component: "breadcrumb", label, destination: "#", location: "docs_demo" }` |
| `breadcrumb_ellipsis_open` | react e svelte, na variante `responsive` | `{ component: "breadcrumb", hidden_count: 3, location: "docs_demo" }` |
| `docs_page_view` | as cinco docs pages | `{ component_name: "breadcrumb", locale, page_title }` |
| `docs_section_viewed` | as cinco docs pages | `{ section_id, component_name: "breadcrumb", locale }` |

**Os dois eventos de produto estão tipados nas cinco `analytics.ts`**, com a mesma
forma (`navigation_click` compartilhado com NavigationMenu e Sidebar), e a
`docs/shared/guidelines/07-analytics.md` §"Breadcrumb / Navigation Menu" os
descreve.

**O `label` do `navigation_click` parte a série em três em três stacks (V19).** A
regra da casa é payload estável, nunca texto traduzido. React, vue e vanilla
passam o texto do link (`tContent('demonstration.labels.home')`, `crumb.text`);
svelte e angular passam a chave, e o angular escreve o motivo no método. As
guidelines de react e vue ainda mandam `label` = "texto do link".

> **PENDÊNCIA · 2026-09-17** — em react, vue e vanilla o `label` do
> `navigation_click` é o texto traduzido do link, o que faz o mesmo clique virar
> três séries no GA4; svelte e angular já mandam a chave.
> **Fecha quando**: as docs pages de react, vue e vanilla passarem ao
> `navigation_click` um identificador que não sai de `t(`/`tContent(`. (As
> guidelines de react e vue também diziam "texto do link", e deixaram de dizer com
> a migração do catálogo em 2026-09-17.)

**Evento anunciado e não disparado**: as cinco tabelas de analytics publicam
`breadcrumb_ellipsis_open`, e só duas páginas o disparam (V18). O angular chega a
simular o payload num espião de story (`EllipsisWithTrigger`), sem disparar na
página.

> **PENDÊNCIA · 2026-09-17** — `breadcrumb_ellipsis_open` é anunciado nas cinco
> tabelas de analytics e disparado só por react e svelte; vue e vanilla não têm menu
> na variante responsiva, e o angular não publica a variante.
> **Fecha quando**: `grep -l "breadcrumb_ellipsis_open"` achar as cinco
> `BreadcrumbDocs.*`, ou a linha sair de `analytics.table` e das cinco páginas por
> decisão registrada aqui.

**`location` é sempre `docs_demo`** — inclusive de Variantes e Do & Don't em quatro
stacks (V21), e o auditor só vê o svelte.

## 10. Reconstruir do zero

Ordem: folha → árvore de `data-slot` → separador e reticências → stories com a
sonda → docs page.

- **Comece pela lista**: `<ol>` com quebra de linha e a cor atenuada na LISTA, para
  o link herdar (D6, D8). Quem pintar a cor no link perde o `inherit` e duplica a
  regra.
- **A página atual é `<span>`** com `aria-current`, e nada mais (D1).
- **Separador é `<li>` irmão**, com `role` e `aria-hidden` no host, e chevron como
  conteúdo de fallback (D2). Separador dentro do item quebra a contagem da lista e
  a regra de "último item" da sonda.
- **Reticências bifurcam por rótulo**, e nunca carregam `sr-only` (D3).
- **Nome do landmark sobrescrevível** desde o primeiro dia — a docs page monta dez
  trilhas e reprova `landmark-unique` sem isso (D5).
- **Anel de foco**: confira D7 antes de copiar a folha.
- **Rode a sonda no Playground**: `reprovasDeBreadcrumb` confere o contrato inteiro
  de uma vez, inclusive a ordem de leitura.
- **Armadilha por stack**:
  - **react** — só o link precisa de `useRender`; e o `aria-label` padrão tem de vir
    ANTES do espalhamento de props, senão a sobrescrita não pega;
  - **vue** — sem `inheritAttrs: false`, o `aria-label` do consumidor cai na raiz, e
    é isso que faz a sobrescrita funcionar; desligar o repasse quebra as dez trilhas
    da docs page. O `as` do link precisa ser DEFAULT;
  - **svelte** — `restProps` depois dos atributos fixos deixa quem consome
    sobrescrever também o `aria-hidden` das reticências e o do separador; o `child`
    do link entrega atributos, não elemento;
  - **vanilla** — as fábricas não se montam sozinhas: quem consome faz `append` na
    ordem; `href` é obrigatório; o separador customizado recebe `content`, e um
    elemento passado a duas trilhas precisa ser clonado (a docs page faz
    `cloneNode`);
  - **angular** — o `aria-label` estático tem de ser lido na construção, senão o
    host binding o apaga; e o `imports:` de um `@Component` que usa a peça de ícone
    precisa que ela esteja declarada ANTES, porque o decorador avalia na hora.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, cor, anel, quebra | `docs/shared/styles/nds/breadcrumb.css` |
| texto, props, tokens, critérios de teste | `docs/shared/content/breadcrumb/translations.json` (224 chaves × 3 idiomas) |
| sonda de semântica e ordem de leitura | `docs/shared/testing/breadcrumb-probe.ts` |
| evento e payload | `docs/shared/guidelines/07-analytics.md` §Breadcrumb / Navigation Menu + `src/lib/analytics.ts` das cinco |
| JSON-LD `BreadcrumbList` da página | `src/lib/use-seo.ts` das cinco, parâmetro `breadcrumb` |
| desenho | Figma, `design-links.ts`: `breadcrumb` `353-298`, `breadcrumbLink` `353-12`, `breadcrumbDocs` `354-38` |
| regra de CATEGORIA (navegação) | não tem casa compartilhada: `docs/shared/guidelines/` não tem guideline de navegação; hoje ela está espalhada em `nortear-design-system-<stack>/guidelines/05-navigation-components.md` |
| portões determinísticos | `node scripts/audit.mjs breadcrumb --json` |
| instrumento de tokens | `node scripts/tabela-tokens.mjs breadcrumb` |

### O Figma descreve o código de hoje, com uma lacuna

A entrada `breadcrumb` diz "Trilha montada: instâncias de Link, Separator e Page.
Não é variant set — o breadcrumb é composição, e o que tem eixo é o link." Lido em
2026-09-17: o nó `353:298` é exatamente isso, e as medidas batem com a folha
(passo de 6px, separador de 14px). A entrada `breadcrumbLink` diz "eixo `state`
(default, hover, focus)"; o nó `353:12` tem os três símbolos `state=default`,
`state=hover` e `state=focus`, que são os três estados que a folha declara para o
link. **A lacuna**: não há reticências nem separador customizado na trilha montada,
e o arquivo não foi conferido quanto ao anel de foco a meia opacidade (D7).

### O `audit.mjs` não está verde

Medido em 2026-09-17, ANTES deste arquivo existir: **7 achados**.

| regra | severidade | stacks | o que diz |
|---|---|---|---|
| `demonstration_labels_divergent` | medium | react, vue | a demonstração não usa `demonstration.labels.more` (V16) |
| `story_file_sem_transform` | medium | angular (2×) | `-states` e `-compositions`, 7 de 7 stories publicam o template da story (V13) |
| `source_sem_teste` | medium | angular | `breadcrumb.source.ts` sem teste (V13) |
| `location_so_da_demo` | medium | svelte | as quatro chamadas mandam `docs_demo` (V21 — o mesmo vale para mais três stacks que a regra não vê) |
| `dodont_preview_sem_componente` | medium | vanilla | "imitação em 2 de 4 previews" — **falso positivo**: os quatro previews são vivos. Os dois de "Do" chamam `buildDefaultBreadcrumb` e `buildWithEllipsisBreadcrumb`, que chamam `buildBreadcrumb`, que chama `createBreadcrumb(`; a regra reconhece um nível de indireção e aqui há dois |

> **PENDÊNCIA · 2026-09-17** — sete achados do auditor anteriores a este PRD estão
> abertos, e um deles (`dodont_preview_sem_componente` no vanilla) é falso positivo
> da regra, não defeito da página.
> **Fecha quando**: `node scripts/audit.mjs breadcrumb --json` não devolver
> `story_file_sem_transform`, `source_sem_teste`, `demonstration_labels_divergent`,
> `location_so_da_demo` nem `dodont_preview_sem_componente`.

**Com este arquivo escrito, a contagem é 12**, medida logo depois de salvá-lo: os 7
de cima mais os cinco `catalogo_duplicado_com_prd`, um por stack. As regras que este
documento poderia acender sozinho não acenderam: `prd_token_sem_lastro` não reporta
nenhum dos onze tokens da §5, e nenhuma pendência daqui cai em
`prd_pendencia_ja_fechada`.

### O catálogo em guideline existe, nas cinco, e diverge do código

`## Breadcrumb` está em `05-navigation-components.md` de todas as cinco stacks
(react linha 5, vue 5, svelte 5, vanilla 5, angular 3). Medido em 2026-09-17, o
que cada cópia afirma e o código contradiz:

- **nome do landmark**: react, vue, svelte e vanilla prescrevem
  `aria-label="Localização na página"`; vanilla ("não apenas Breadcrumb") e angular
  ("não repete Breadcrumb", "um padrão em português") proíbem o que o código faz. O
  padrão é `breadcrumb` nas cinco (D5);
- **árvore com um `<nav>` em volta de `Breadcrumb`**: react, vue e svelte desenham
  `nav › Breadcrumb › BreadcrumbList`. `Breadcrumb` É o `<nav>`;
- **`role="list"` e `role="listitem"` aplicados automaticamente**: react e vue
  afirmam; nenhuma das cinco implementações escreve esses papéis;
- **árvore do vanilla**: separador como `span aria-hidden` DENTRO do `<li>` do item,
  desenhado como `/`. A fábrica da stack de referência produz `<li>` irmão,
  `role="presentation"`, com chevron (D2);
- **"usar overflow horizontal com scroll"**: vanilla. A folha quebra linha (D6);
- **"links herdam as variáveis de cor, hover e transição do componente Link"**:
  react e vue. A folha declara cor, hover e transição próprios, e não lê nada do
  componente Link;
- **quando usar**: react, vue e svelte dizem 2 ou mais níveis, como o conteúdo
  (`usage.guidelines.item1`); vanilla e angular dizem "mais de dois" e mandam um
  botão Voltar para um ou dois;
- **analytics**: react e vue mandam `label` = texto do link (§9);
- **caminho de arquivo**: vue aponta `breadcrumb/breadcrumb.vue`; o arquivo é
  `Breadcrumb.vue`;
- **cobertura desigual**: react e vue têm propósito, árvore, regras, a11y, tema, UX
  writing, SEO e analytics; o angular tem tabela de entradas (e é o único que cita as
  reticências e a regra de foco delas); o svelte tem vinte e nove linhas.

> **FECHADA · 2026-09-17** — as cinco `05-navigation-components.md` tinham seção
> `## Breadcrumb`, e passou a haver PRD: eram duas fontes, e a segunda já errava o
> nome do landmark nas cinco, a árvore em quatro e o papel de lista em duas.
> **Fecha quando**: `catalogo_duplicado_com_prd` não reportar breadcrumb.
> **Como fechou (2026-09-17)**: as cinco seções viraram ponteiro para este PRD e
> para `docs/shared/guidelines/21-navegacao.md`, com a mecânica de cada stack. O
> `<nav>` em volta, o nome "Localização na página" e o `role="list"` automático
> não passaram para o texto novo.

### O que o conteúdo compartilhado afirma e o código contradiz

1. `notes.tip1` — "O Breadcrumb gera automaticamente o JSON-LD `BreadcrumbList`
   quando passado ao hook `useSeoEffect`". O componente não gera nada: o JSON-LD sai
   do hook de SEO de cada stack quando a PÁGINA passa o parâmetro `breadcrumb` com os
   dados, e das cinco docs pages só a do angular passa (V26);
2. `variants.items.customSeparator` e `testes.functional.item4` — "via `children`".
   Vale para react e svelte; o vue usa slot, o angular conteúdo projetado e o vanilla
   a opção `content`;
3. `tokens.table.*` — as sete descrições são as mesmas nas cinco, mas a linha
   `sizeEllipsis` ("tamanho do ícone") é emparelhada com `size-5` (20px, a CAIXA) em
   três páginas e com o token de 16px (o ÍCONE) em duas;
4. `accessibility.screenReader.onEnter` promete o número de itens anunciado, e
   nenhuma medição cobre o que o leitor conta (§8).

### Comentários de código que afirmam o que não é

- `BreadcrumbDocs.ts` do angular diz que `--spacing-1-5` e `--spacing-5` "não estão
  em `tokens.css` (reportado)" — os dois estão, nas linhas 190 e 195;
- o mesmo arquivo diz que a variante `responsive` fica de fora porque o DropdownMenu
  "ainda não existe neste stack" — a story `Collapsed` do angular o usa;
- o mesmo arquivo sobrescreve `accessibility.item4` dizendo que o compartilhado
  "ainda descreve um texto sr-only More" — o compartilhado já descreve o rótulo
  opcional, com o mesmo sentido do override;
- `breadcrumb.source.ts` do angular diz que o chevron do separador "vem do CSS" — ele
  vem do conteúdo de fallback do `<ng-content>` do componente;
- o docblock de `breadcrumb.css` lista dois tokens e desenha o separador `›` (§5).

> **PENDÊNCIA · 2026-09-17** — quatro comentários do angular e o docblock da folha
> afirmam o contrário do código, e `notes.tip1` atribui ao componente o JSON-LD que
> é do hook de SEO.
> **Fecha quando**: `grep -n "não estão em tokens.css\|ainda não existe neste stack\|sr-only \"More\"\|vem do CSS" nortear-design-system-angular/src/components/{docs/BreadcrumbDocs.ts,ui/breadcrumb.source.ts}`
> não achar nada, e `notes.tip1` não disser que o Breadcrumb gera o JSON-LD.
