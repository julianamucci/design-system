# Navigation Components (Nortear — Vanilla TypeScript)

A regra da categoria — qual componente escolher, marco e nome, `aria-current`,
modelo de teclado, link ou botão, analytics e tom de voz — está em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).
O que cada componente É — contrato, decisões, anatomia, tokens, estados e as peças
das cinco stacks — está no PRD dele. Este arquivo guarda só a mecânica das fábricas
desta stack.

Menubar e NavigationMenu existem nesta stack e não têm seção aqui; é lacuna
registrada na `docs/shared/guidelines/21-navegacao.md`, §Por que este arquivo existe.

---

## Breadcrumb — a fábrica desta stack

O contrato está em
[`docs/shared/prd/breadcrumb.md`](../../docs/shared/prd/breadcrumb.md); a regra da
categoria, em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Sete fábricas independentes**, em `src/components/ui/breadcrumb.ts`, e nenhuma
monta a trilha: quem consome cria cada peça e a encaixa por `append`.

| Fábrica | Devolve | Opções próprias |
|---|---|---|
| `createBreadcrumb` | `<nav>` | `aria-label` (padrão `breadcrumb`) |
| `createBreadcrumbList` | `<ol>` | — |
| `createBreadcrumbItem` | `<li>` | — |
| `createBreadcrumbLink` | `<a>` | `href` (**obrigatório no tipo**), `text` |
| `createBreadcrumbPage` | `<span aria-current="page">` | `text` |
| `createBreadcrumbSeparator` | `<li role="presentation" aria-hidden>` | `content`: string ou elemento |
| `createBreadcrumbEllipsis` | `<span>` | `aria-label` |

Todas aceitam `class`.

**O separador é IRMÃO dos itens.** Ele se acrescenta à lista entre um item e outro,
nunca dentro do `<li>` do link. Sem `content`, a fábrica desenha o `ChevronRight`
por `createElementNS`; com string, ela entra por `textContent`; com elemento, ele
substitui o chevron. `role` e `aria-hidden` ficam no `<li>` em qualquer caso.

**Texto entra por `textContent`**, no link e na página: a fábrica não interpreta
HTML.

**As reticências decidem o papel pela opção.** Com `aria-label`, saem com
`role="img"` e o nome; sem ela, com `aria-hidden="true"`. O gatilho de menu que as
envolve não é peça: é quem compõe que o cria e o liga.

**Apelidos depreciados**: `label` vale por `aria-label` em `createBreadcrumb` e
`createBreadcrumbEllipsis`, e `className` por `class` nas sete. Quando os dois
chegam, o canônico vence.

**Não há troca de elemento.** A integração com roteador de cliente é interceptar o
clique no `<a>` que `createBreadcrumbLink` devolve.

**Nenhuma fábrica registra ouvinte nem dispara evento**, e por isso não há
`destroy()`. O rastreio do clique é de quem consome.

---

## Tabs — a fábrica desta stack

O contrato está em [`docs/shared/prd/tabs.md`](../../docs/shared/prd/tabs.md); a regra
da categoria, em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Fábrica única**: `createTabs(options)`, em `src/components/ui/tabs.ts`, devolve a
raiz com a lista e os painéis já montados. Os painéis são filhos diretos da raiz,
depois da lista.

| Opção | Default | Função |
|---|---|---|
| `items` | — | Array `{ value, label, content, disabled? }`; obrigatório |
| `defaultValue` | — | Valor da aba ativa ao montar; obrigatório |
| `variant` | `default` | Escrito como `data-variant` na lista |
| `orientation` | `horizontal` | Escrito como `data-orientation` na raiz; decide também o par de setas |
| `aria-label` | — | Nome da lista, escrito no `role="tablist"`. O tipo não o exige; o contrato exige (C2 do PRD) |
| `onValueChange` | — | Recebe o valor da aba ativada; não é chamado quando a aba escolhida já é a ativa |
| `class` | — | Classes adicionais na raiz |

**Não há valor controlado.** A fábrica devolve só o elemento: depois de montar, a
aba ativa muda por clique ou por teclado, e não há função para trocá-la de fora.

**O nome da lista é opção, nunca retoque.** A lista não é elemento que quem consome
receba; nomeá-la por `querySelector` depois de construir prende o call site à
estrutura interna da fábrica.

**Ids gerados**: aba e painel recebem `tab-<n>-<value>` e `tabpanel-<n>-<value>`,
com `n` de um contador do módulo. O `value` de cada item entra no id, então precisa
ser único no conjunto.

**O rótulo entra por `textContent`.** Não há opção de ícone nem de badge: as stories
de composição esvaziam o gatilho depois de montar e inserem o conteúdo num
`span.nds-cluster`.

**O que a fábrica escreve, e que as libs das outras stacks decidem por conta
própria** (tabela de teclado do PRD):

- `tabindex="0"` fica na aba ATIVA, e todo painel tem `tabindex="0"`;
- `aria-controls` em todas as abas, e painel inativo com `hidden`, montado no DOM;
- `aria-orientation` só quando `orientation` é `vertical`;
- a seta dá a volta no fim, sem opção para desligar; direção RTL não é lida.

**A aba desabilitada é barrada dentro dos ouvintes.** O ouvinte de clique é
registrado em todas as abas, e a guarda mora nele — o que barra também Enter e
Espaço, que o navegador entrega como clique ao `<button>`. A seta foca a
desabilitada e não a ativa.

**Ouvintes nos próprios nós** (cada gatilho e a lista): saem da memória com a
árvore, e não há `destroy()`.

**Esta stack só tem ativação automática.** Não há `activationMode`: a seta sempre
ativa a aba. É lacuna registrada, não escolha — V3 do PRD e item 5 de §O que está
aberto na `docs/shared/guidelines/21-navegacao.md`.

---

## Stepper — a fábrica desta stack

O contrato está em [`docs/shared/prd/stepper.md`](../../docs/shared/prd/stepper.md); a
regra da categoria, em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Peças**, em `src/components/ui/stepper.ts`: `createStepper`, `createStepperItem`,
`createStepperTrigger`, `createStepperIndicator`, `createStepperTitle`,
`createStepperDescription`, `createStepperSeparator`, mais `setStepperValue` e
`getStepperValue`.

**Montagem em DUAS FASES.** Esta stack não tem runtime reativo: monta-se a árvore e
depois se chama `setStepperValue(raiz, valor)`, que resolve o estado de cada etapa,
o `aria-current`, o `disabled` do gatilho, a palavra de estado e o conteúdo do
indicador. É divergência de API declarada — as outras quatro derivam por
reatividade (D4 do PRD).

- **Antes da segunda fase**: todo item está `inactive`, não há etapa atual nem
  `aria-current`, e o gatilho de uma etapa marcada como indisponível continua
  habilitado e focável.
- **`setStepperValue` não tem valor padrão**: o número é argumento obrigatório.
  `getStepperValue` devolve `1` enquanto a raiz não tem valor resolvido.
- **Etapa acrescentada depois** não se resolve sozinha: chame `setStepperValue` de
  novo.
- A resolução só escreve atributo e texto, sem ler estilo computado — é seguro
  chamá-la dentro de uma play function.

| Peça | Opção | Default | Função |
|---|---|---|---|
| `createStepper` | `aria-label` | — | Nome acessível do fluxo; obrigatório no tipo |
| `createStepper` | `labels` | — | `{ completed?, current? }`, as palavras de estado lidas só por leitor de tela |
| `createStepper` | `onStepSelect` | — | Recebe o número da etapa cujo gatilho disponível foi acionado |
| `createStepperItem` | `step` | — | Número da etapa, contando de 1; obrigatório |
| `createStepperItem` | `completed` | `false` | Concluída mesmo depois da atual |
| `createStepperItem` | `disabled` | `false` | Indisponível; aplicado ao gatilho por `setStepperValue` |
| `createStepperIndicator` | `content` | — | Conteúdo próprio; marca `data-custom` e suspende número e marca |
| `createStepperTitle`, `createStepperDescription` | `text` | — | Texto, por `textContent` |
| `setStepperValue` | `value` | — | Número da etapa atual; sem padrão |

Todas as fábricas aceitam `class`, com `className` como apelido depreciado; quando
os dois chegam, `class` vence.

**Os rótulos de estado moram na raiz** — `createStepper` os guarda em atributos
`data-label-*` do `<ol>`, e `setStepperValue` os lê de lá a cada resolução.

**O ouvinte é delegado na raiz, e só existe se `onStepSelect` vier na criação.** Ele
lê o `data-step` do item no momento do clique, então continua certo depois de
`setStepperValue` e de etapas acrescentadas. Gatilho com `disabled` não chama. Não
há como cancelar a seleção a partir do call site (V1 do PRD). O ouvinte fica no
próprio `<ol>`, e não há `destroy()`.

**Quem monta cada etapa encaixa as peças**: gatilho com indicador, título e
descrição dentro; traço acrescentado ao item DEPOIS do gatilho, e omitido na última
etapa. O `<span>` da palavra de estado nasce dentro do gatilho, criado por
`createStepperTrigger`, e não se cria à mão.

**`type="button"` é escrito pela fábrica** no gatilho, para que clicar numa etapa
dentro de um `<form>` não o envie.

---

## Pagination — a fábrica desta stack

O contrato do componente — anatomia, estados, nomes acessíveis, geometria e o
evento que ele dispara — está em
[`docs/shared/prd/pagination.md`](../../docs/shared/prd/pagination.md). A regra da
categoria está em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md),
§Paginar: o alinhamento da faixa, o desabilitado que precisa de dois atributos e a
fronteira com o rodapé do DataTable. A mecânica de navegação desta stack fica aqui.

**Fábrica única**: `createPagination(options)` devolve a faixa inteira montada, em
`src/components/ui/pagination.ts`. É a única stack com a régua de páginas embutida —
até sete páginas saem todas; de oito em diante a régua colapsa, mantendo a primeira,
a última, a atual e as vizinhas.

| Opção | Default | Função |
|---|---|---|
| `total` | — | Total de páginas |
| `current` | — | Página atual, contando de 1 |
| `onPageChange` | — | Avisado quando outra página é pedida. Opcional: uma paginação inteiramente de rota não precisa dele — e ele continua sendo chamado quando há `hrefForPage`, porque é por ele que passam a analítica e o estado da tela |
| `hrefForPage` | — | Endereço real de cada página, e é ele que decide a TAG do controle. Com ele o controle é `<a href>` — destino de verdade, abre em nova aba, é indexável, e o clique SEGUE para o roteador de cliente. Sem ele o controle é `<button type="button">`, e o desabilitado passa a ser o nativo |
| `showPrevNext` | `true` | Exibe os controles direcionais |
| `aria-label` | `'Paginação'` | Nome acessível do landmark |
| `label` | — | **Apelido depreciado** de `aria-label`; quando os dois vêm, o canônico vence |
| `align` | — | `start`/`end` encolhem a faixa e a encostam na ponta; sem valor ela ocupa a linha e fica centrada |
| `class` | — | Classes `.nds-*` adicionais |

**O desabilitado tem dois mecanismos, um por tag.** Em `<button>` é o `disabled`
nativo, que sozinho tira da tabulação, barra o clique e se anuncia. Em `<a>` — o
caso da faixa de rota — não existe `disabled`, e o par é `aria-disabled="true"`
mais `tabindex="-1"`; o ponteiro quem barra é `.nds-button[aria-disabled="true"]`.
Os dois caminhos existem porque a tag segue a rota, e uma story de cada prova o
seu.

**Os chevrons são da própria fábrica**: ela os cria por `createElementNS`, já com
`aria-hidden`, então não se passa ícone no call site. Os rótulos acessíveis dos
controles são constantes em português no módulo — esta é a stack em que eles não
vêm de fora.
