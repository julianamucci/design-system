# Navigation Components

A regra da categoria Navegação — qual componente escolher, marco e nome,
`aria-current`, teclado, link ou botão, anel de foco, tela estreita, analytics e
tom de voz — está uma vez para as cinco stacks em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).
O que cada componente É está no PRD dele. Este arquivo guarda só a mecânica desta
stack: o que o `bits-ui` impõe, o que o Svelte 5 muda e o que foi medido aqui.

---

## Breadcrumb — a mecânica desta stack (Svelte 5)

O que o componente É — contrato, decisões, anatomia, tokens, estados, API e peças
das cinco stacks — está em
[`docs/shared/prd/breadcrumb.md`](../../docs/shared/prd/breadcrumb.md). A regra da
categoria, incluindo o marco e o nome, está em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

Desta stack, e só daqui — sete peças escritas à mão, sem primitivo do bits-ui (ele
não publica breadcrumb, e a trilha não guarda estado nem foco), com o índice
exportando as formas curtas (`Root`, `List`, `Item`, `Link`, `Page`, `Separator`,
`Ellipsis`) ao lado das longas:

- **a raiz já é o `<nav>`**, com o nome padrão `breadcrumb`. O `restProps` é
  espalhado DEPOIS dos atributos fixos, e é isso que deixa quem compõe sobrescrever
  o `aria-label` direto na raiz. A mesma ordem vale nas reticências — e ali ela
  também permite sobrescrever o `role` e o `aria-hidden` que a peça decide;
- **o link aceita o snippet `child`**, que recebe os atributos já montados
  (`data-slot`, classe, `href` e o resto) para entregá-los a um `<a>` do
  consumidor — é a forma de integrar o link de um roteador sem virar um segundo
  elemento. Sem `child`, a peça renderiza o próprio `<a>`. O `href` tem padrão
  `undefined`;
- **o rótulo das reticências é a prop `label`**: com ela, `role="img"` e
  `aria-label`; sem ela, `aria-hidden="true"`;
- `BreadcrumbStory.svelte` é andaime de story, não peça publicada.

---

## Menubar — a mecânica desta stack (Svelte 5)

O Menubar não tem PRD próprio: o contrato dele está no PRD da família de menus,
[`docs/shared/prd/dropdown-menu.md`](../../docs/shared/prd/dropdown-menu.md), que o
trata como menu de comandos. **A categoria dele está em disputa** — conteúdo e
Storybook dizem Navegação, o PRD da família e a
[`docs/shared/guidelines/18-overlay.md`](../../docs/shared/guidelines/18-overlay.md)
dizem Overlay — e a decisão é o primeiro item de "O que está aberto" em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

Desta stack, e só daqui — peças sobre o `Menubar` do bits-ui, com o índice
exportando as formas curtas ao lado das longas e reexportando o tradutor do motivo
de fechamento que a família inteira usa:

- **`bind:value`, e não `defaultValue`**: o bits não tem prop de valor inicial. O
  menu aberto é o `value` vinculável da raiz, com `""` de partida; passar só um
  valor inicial funciona, porque a cópia local continua mudando ao abrir e fechar.
  Uma prop de valor inicial é aceita e descartada em silêncio — foi assim que as
  demonstrações desta stack renderizaram fechadas;
- **a raiz publica um acesso por contexto** (`setMenubarRoot`) para o Tab que a lib
  deixa sem fechar quando o gatilho do menu aberto é a primeira ou a última parada
  da página. O painel e o subpainel chamam o `closeAfterTab` do DropdownMenu depois
  do `onkeydown` de quem consome, e o fechamento avisa `onValueChange`;
- **o painel carimba o próprio `id` no elemento**: o bits consome o `id` para o
  estado e não o repassa ao nó, e a busca por letra compara os dois — sem o
  carimbo, o typeahead nunca dispara. Registrado em `PATCHES.md`, na raiz do
  repositório;
- **o painel veste `nds-dropdown-menu-content`**, com `sideOffset` 8, `alignOffset`
  −4, `align` `start` e `side` `bottom` por padrão;
- **duas peças a mais que as outras stacks de lib**: `MenubarGroupHeading`, que é o
  cabeçalho de grupo do bits, e `MenubarPortal`. O `MenubarLabel` é um `<div>`
  solto que não nomeia grupo nenhum, e o separador sai anunciado como `group` —
  as duas divergências estão medidas na §7 do PRD da família;
- `MenubarStory.svelte` e `MenubarControlledStory.svelte` são andaime de story.

---

## Navigation Menu — a mecânica desta stack (Svelte 5)

O que o componente É está em
[`docs/shared/prd/navigation-menu.md`](../../docs/shared/prd/navigation-menu.md). A
regra da categoria está em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

Desta stack, e só daqui — nove peças sobre o `NavigationMenu` do bits-ui, com o
índice exportando as formas curtas (`Root`, `List`, `Item`, `Trigger`, `Content`,
`Link`, `Child`, `Indicator`, `Viewport`) ao lado das longas:

- **a raiz declara `value` vinculável**, com `""` de partida. Sem a declaração ele
  caía no espalhamento e chegava à lib como valor CONTROLADO: `bind:value` não
  devolvia nada e um valor passado de fora prendia o painel aberto. Não há
  `defaultValue`;
- **a raiz monta o viewport sozinha** (`viewport`, padrão `true`): um
  `.nds-navigation-menu-viewport-wrap` em volta do `Viewport` da lib, que veste
  `.nds-navigation-menu-viewport-panel`. Compor outro `NavigationMenuViewport`
  com o padrão ligado produz dois;
- **o destino do painel (`NavigationMenuChild`) despacha o evento de dispensa da
  lib DEPOIS do `onclick` de quem consome**, sem olhar `defaultPrevented`. O
  encadeamento de manipuladores desta stack para no primeiro `preventDefault`, que
  é o que todo roteador de cliente chama — sem a ponte, o painel ficava aberto
  justamente nesse caso;
- **as esperas têm os nomes do bits**: `delayDuration` (200 ms) e
  `skipDelayDuration` (300 ms);
- **o tamanho do painel vem da lib** por `--bits-navigation-menu-viewport-width` e
  `-height`. O bits não publica origem de animação para este componente, e é por
  isso que a folha tem exceção declarada na cadeia de `transform-origin` (D9 do
  PRD);
- o gatilho acrescenta a classe `group`, sem regra em folha nenhuma — resíduo
  registrado na §7 do PRD;
- `NavigationMenuStory.svelte` é andaime de story, e `navigation-menu.fixtures.ts`
  é dado de story.

---

## Pagination — a mecânica desta stack (Svelte 5)

O que o componente É — contrato, decisões, anatomia, tokens, estados, API e peças
das cinco stacks — está em
[`docs/shared/prd/pagination.md`](../../docs/shared/prd/pagination.md), incluindo o
nome acessível que as cinco implementações de fato escrevem e os dois mecanismos
de desabilitado.

A regra da categoria está em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).
A fronteira entre esta faixa e o rodapé do DataTable — que **não** a compõe — está
em [`docs/shared/guidelines/20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md).

Desta stack, e só daqui — sete peças, com a raiz, o link e os direcionais vindos
do bits-ui, e o índice exportando as formas curtas (`Root`, `Content`, `Link`…) ao
lado das longas:

- **a raiz usa o snippet `child` para trocar a tag**: o primitivo renderiza um
  `<div>` e a anatomia pede `<nav>`. Quem troca a tag passa a ser dono do repasse,
  então os `snippetProps` (`pages`, `range`, `currentPage`) têm de ser repassados
  à mão;
- **o link usa `child` por outro motivo**: o bits fixa `aria-label="Page N"` em
  inglês nos próprios props e vence o que o consumidor passa. Escrever depois do
  merge da lib é a única forma de o nome acessível sair no idioma da página;
- o link numerado desta stack é `<button>`, e não `<a>` — por isso não tem
  endereço. É divergência medida, com pendência aberta na §7 do PRD;
- `PaginationStory.svelte` é andaime de story, não peça publicada.

---

## Stepper — a mecânica desta stack (Svelte 5)

O que o componente É está em
[`docs/shared/prd/stepper.md`](../../docs/shared/prd/stepper.md). A regra da
categoria está em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

Desta stack, e só daqui — sete peças em Svelte 5 puro, com o índice exportando as
formas curtas (`Root`, `Item`, `Trigger`, `Indicator`, `Title`, `Description`,
`Separator`) ao lado das longas, mais `resolveStepperState`:

- **sem primitivo headless**: o `bits-ui` não tem Stepper;
- **o estado desce por `setContext`/`getContext` com GETTERS**, e não com valores:
  o objeto de contexto é criado uma vez, e guardar `value` como número congelaria o
  estado no primeiro quadro. A derivação é `resolveStepperState`, exportada;
- **peça fora do contexto LANÇA erro** em português, sem `Stepper` ou sem
  `StepperItem` em volta — a falha
  silenciosa renderizaria o gatilho sem `aria-current` e o indicador sem número;
- **`aria-label` é obrigatório no tipo** da raiz; a seleção chega por
  `onStepSelect`;
- **o `onclick` de quem compõe roda primeiro**, e `preventDefault` nele cancela a
  seleção;
- **`type="button"`, `aria-current` e `disabled` são escritos DEPOIS do
  espalhamento** no gatilho: um `disabled` passado direto nele perde para o da
  etapa;
- `StepperStory.svelte` e `StepperWizardStory.svelte` são andaime de story.

---

## Tabs — a mecânica desta stack (Svelte 5)

O que o componente É está em
[`docs/shared/prd/tabs.md`](../../docs/shared/prd/tabs.md). A regra da categoria —
inclusive a do indisponível em widget composto — está em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

Desta stack, e só daqui — quatro peças sobre o `Tabs` do bits-ui, com o índice
exportando as formas curtas (`Root`, `List`, `Trigger`, `Content`) ao lado das
longas, mais `tabsListVariants`:

- **a raiz não tem `defaultValue`**: o bits não tem valor inicial separado, e a aba
  inicial é o próprio `value` vinculável, com `""` de partida;
- **`activationMode` mora na raiz**, como a lib o publica;
- **a variante é prop da lista** e sai em `data-variant`; o `tabsListVariants` tem
  as duas variantes com classe vazia, porque quem diferencia é o atributo;
- **a aba desabilitada repassa `disabled={false}` ao primitivo** e escreve
  `aria-disabled` à mão. Medido na fonte da lib: com a prop, o bits emite
  `disabled` nativo, que vence o que vem do call site, e `data-disabled`, que tira
  a aba dos candidatos do foco itinerante — a seta passaria por cima dela;
- **quem barra a ativação da aba desabilitada é uma guarda em fase de captura na
  `tabs-list`**, instalada por `addEventListener` sobre `mousedown`, `click`,
  `keydown` (só Enter e Espaço) e `focus`. Na lista, a captura precede sempre os
  ouvintes do primitivo; no próprio botão, a ordem dependeria de quem registrou
  primeiro. O `focus` não é cancelável, então quem o contém é `stopPropagation` —
  o foco acontece, e é ele que faz o leitor de tela anunciar;
- **o bits escreve `aria-orientation="horizontal"`** também no horizontal, contra a
  referência (item 22 de "O que está aberto" na `21-navegacao.md`);
- **a raiz expõe `disabled`**, documentado no Playground como "Desabilita todas as
  abas de uma vez". Lido na fonte, ele faria o bits emitir `disabled` nativo e
  `data-disabled` em todas as abas, por fora da guarda acima e contra a regra de
  indisponível em widget composto. Registrado, não consertado: é o item 23 de "O
  que está aberto" na `21-navegacao.md` e V28 do PRD;
- `TabsStory.svelte` é andaime de story, não peça publicada.
