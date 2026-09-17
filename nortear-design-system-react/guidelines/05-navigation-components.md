# Navigation Components

A regra da categoria Navegação — qual componente escolher, marco e nome, o
vocabulário de `aria-current`, os dois modelos de teclado, link ou botão, anel de
foco, analytics e tom de voz — está UMA vez em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md). O que cada
componente É — contrato, decisões com data e medição, tokens, peças das cinco
stacks — está no PRD dele. O que fica aqui é só o que existe nesta stack.

---

## Breadcrumb — mecânica desta stack

Contrato e peças das cinco stacks:
[`docs/shared/prd/breadcrumb.md`](../../docs/shared/prd/breadcrumb.md). Regra da
categoria: [`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Onde o código está**: `src/components/ui/breadcrumb.tsx` + stories +
`BreadcrumbDocs.tsx`.

- **Sem lib headless, com uma exceção de peça.** Seis das sete peças são funções
  sobre elemento nativo. Só o `BreadcrumbLink` passa por `useRender` do
  `@base-ui/react`: a prop `render` troca o `<a>` pelo link do roteador sem um
  segundo elemento no DOM, e o `data-slot` sai do `state` do hook. **Não há ponte
  `asChild` aqui** (ver a tabela de gatilhos em [`RULES.md`](RULES.md)).
- **A raiz já é o `<nav>`**, com `aria-label="breadcrumb"` escrito ANTES do
  espalhamento das props — o `aria-label` de quem compõe vence o padrão, e é assim
  que se dá nome único à trilha. Não se envolve o componente em outro `<nav>`.
- **O rótulo das reticências é a prop `label`.** Com ela a peça sai `role="img"` com
  nome; sem ela, `aria-hidden` — o caso certo quando um `DropdownMenuTrigger` a
  envolve e já carrega o nome.
- **O separador troca o chevron por `children`**; `role="presentation"` e
  `aria-hidden` continuam no `<li>`, fora do alcance de quem customiza.
- **O JSON-LD `BreadcrumbList` é do hook de SEO, não do componente**: sai do
  `useSeoEffect` (`@/lib/use-seo.ts`) quando a página passa o parâmetro
  `breadcrumb`. Não se injeta o script à mão.

---

## Menubar — mecânica desta stack

O Menubar não tem PRD próprio: o contrato dele é o da família de menus,
[`docs/shared/prd/dropdown-menu.md`](../../docs/shared/prd/dropdown-menu.md). A
categoria dele está em disputa — Navegação pelo conteúdo e pelo Storybook, menu de
comandos pelo PRD da família — e a decisão está no item 1 de "O que está aberto" em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Onde o código está**: `src/components/ui/menubar.tsx` + stories +
`MenubarDocs.tsx`.

- **A barra é o `Menubar` do `@base-ui/react`; cada menu é um `DropdownMenu` do
  design system.** `MenubarMenu` e as peças de dentro delegam às do
  `dropdown-menu.tsx`, e é daí que vem o Tab que SAI da barra (C2 do PRD da
  família): a barra é uma parada só, os outros gatilhos têm `tabindex="-1"`, e sem
  a herança a lib deixava o menu aberto com o foco no gatilho no Shift+Tab. O
  portão é `TabLeavesMenubar` e `TabAtPageEnd`.
- **`MenubarGroup` é OBRIGATÓRIO em volta de `MenubarLabel`.** O rótulo é o
  `Menu.GroupLabel` da lib, que procura o contexto de um `Menu.Group` ancestral e
  LANÇA em tempo de render quando não o encontra — a página inteira cai.
- **`menubar-menu` não vira elemento.** O `data-slot` é passado ao `Menu.Root` da
  lib, que não renderiza nó; a divergência é de lib e está registrada no PRD da
  família.
- **O item de marcação tem estado misto pelo wrapper.** `indeterminate` escreve
  `aria-checked="mixed"`, entrega `checked={false}` à lib e desenha o traço à mão,
  porque o item da lib é de dois estados (patch registrado em
  `PATCHES.md#react-dropdown-menu-mixed-checkbox`).
- **`data-inset` só existe quando é verdade** (`inset || undefined`): a folha
  seleciona por presença, e `data-inset="false"` contaria como recuo.
- **O painel de topo nasce com `align="start"`, `alignOffset={-4}` e
  `sideOffset={8}`** — o vão de 8 do Menubar (D12 do PRD da família) é do
  primitivo, não da folha.
- **O primitivo não dispara evento.** Quem rastreia é a docs page: `onOpenChange`
  de cada `MenubarMenu` dispara abertura e fechamento — o motivo vem do segundo
  argumento (`eventDetails.reason`), traduzido para o vocabulário da família — e o
  `onClick` do item dispara a escolha. Eventos e payload: §9 do PRD da família.

---

## Navigation Menu — mecânica desta stack

Contrato e peças das cinco stacks:
[`docs/shared/prd/navigation-menu.md`](../../docs/shared/prd/navigation-menu.md).
Regra da categoria: [`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Onde o código está**: `src/components/ui/navigation-menu.tsx` + stories +
`NavigationMenuDocs.tsx`.

- **Composição do `@base-ui/react/navigation-menu`, e a raiz monta o painel
  sozinha.** `NavigationMenu` renderiza o `NavigationMenuPositioner` (portal →
  posicionador → popup → viewport) depois dos filhos; quem compõe não escreve portal
  nem viewport, e esta stack **não exporta `NavigationMenuViewport`**. O
  posicionador é exportado, mas não é peça de uso solto.
- **A raiz da lib já é o `<nav>`**, sem nome padrão: o `aria-label` vai nela, e não
  num `<nav>` em volta. O popup é renderizado como `<div>` (`render={<div />}`),
  porque o `<nav>` padrão dele era um marco sem nome que colidia no
  `landmark-unique` com mais de um painel aberto.
- **Duas peças de destino.** `NavigationMenuLink` é o link da BARRA; o destino de
  DENTRO do painel é `NavigationMenuChild`, que liga `closeOnClick` sempre — a lib
  nasce com ele desligado, e o painel sobrevivia à escolha.
- **Página atual pela prop `active` no link**: a lib escreve `data-active` e
  `aria-current="page"`, e nenhum dos dois quando inativo.
- **As esperas se chamam `delay` e `closeDelay`**, com padrão 50 e 50 da lib.
  `delayDuration` não existe aqui: a prop atravessava o componente e caía no DOM
  como atributo desconhecido.
- **Lado do painel derivado da orientação** (`bottom` na horizontal, `right` na
  vertical), com `sideOffset` 8 e `align` padrão `start` — não há prop de lado.
- **`indicator` liga a seta**, desligada por padrão; ela mora no posicionador,
  irmã do popup, com `aria-hidden`.
- **O gatilho aberto é `data-popup-open`**, não `data-state="open"` — é o atributo
  que a folha lê para o fundo e o chevron nesta stack.

---

## Pagination — mecânica desta stack

Contrato, decisões com data e medição, tokens e peças das cinco stacks:
[`docs/shared/prd/pagination.md`](../../docs/shared/prd/pagination.md). A regra da
categoria está em [`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md);
a fronteira entre ele e o rodapé do DataTable, em
[`docs/shared/guidelines/20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md). O que fica aqui é a
mecânica.

**Onde o código está**: `src/components/ui/pagination.tsx` + stories +
`PaginationDocs.tsx`.

O que é desta stack:

- **Sete peças de função, sem lib headless.** O link é o `Button` do design
  system com `nativeButton={false}` e `render={<a …>}`: dá ao `<a>` a aparência do
  botão sem um segundo elemento no DOM. **Não há ponte `asChild` aqui** — a prop
  seria ignorada em silêncio (ver a tabela de gatilhos em [`RULES.md`](RULES.md)).
- **`isActive` escolhe a variante do botão**: `outline` na página atual, `ghost`
  nas outras.
- **`aria-disabled` e `data-active` só existem quando são verdade.** O React
  escreve booleano de atributo ARIA como a string `"false"`, e com o atributo
  presente o seletor `[aria-disabled]` passava a casar o controle HABILITADO.
- **Desabilitar prev/next é coisa de dois mecanismos, e o CSS é só um deles.** A
  folha barra o PONTEIRO (`pointer-events: none` no botão com
  `aria-disabled="true"`); o teclado sai por `tabIndex={-1}`, e o `onClick` do
  próprio `<a>` fecha o que sobra — Enter, clique disparado por script e o
  `click()` de um teste. Sem os dois últimos o controle continua tabulável e o
  Enter navega.
- **A régua de páginas é de quem consome**: esta stack não calcula quais números
  aparecem nem onde entram as reticências. Onde há URL real, `href` por link; em
  roteamento por estado, `onClick` — e o controle continua sendo `<a>`.

---

## Stepper — mecânica desta stack

Contrato e peças das cinco stacks:
[`docs/shared/prd/stepper.md`](../../docs/shared/prd/stepper.md). Regra da
categoria: [`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Onde o código está**: `src/components/ui/stepper.tsx` + stories +
`StepperDocs.tsx`.

- **React puro, sem lib**: o `@base-ui/react` não tem Stepper. Dois contextos — a
  raiz publica `value`, `labels` e `onStepSelect`; o item compara o próprio `step`
  e deriva `data-state` num lugar só.
- **`aria-label` é obrigatório no TIPO** de `StepperProps`: um Stepper sem nome não
  compila.
- **`type="button"` é escrito DEPOIS do espalhamento** no `StepperTrigger`, para
  que nenhuma prop o devolva a `submit` dentro de um `<form>`.
- **O gatilho aceita `onClick` e `disabled` próprios.** O `onClick` de quem compõe
  roda primeiro e `preventDefault()` cancela a seleção; o `disabled` do gatilho
  VENCE o da etapa (`disabled ?? item.disabled`).
- **`StepperIndicator` com filhos** marca `data-custom` e deixa de escrever número
  e marca de verificação.
- **Peça fora de um `StepperItem` renderiza em silêncio**, sem número e sem estado
  — não lança.

---

## Tabs — mecânica desta stack

Contrato e peças das cinco stacks:
[`docs/shared/prd/tabs.md`](../../docs/shared/prd/tabs.md). Regra da categoria:
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Onde o código está**: `src/components/ui/tabs.tsx` + stories + `TabsDocs.tsx`.

- **Composição do `@base-ui/react/tabs`.** `orientation` PRECISA chegar ao
  primitivo — é ele que decide o eixo das setas, o `aria-orientation` e o
  `data-orientation` que a folha lê; escrever só o atributo deixava o layout
  vertical e as setas horizontais.
- **`activationMode` mora no `TabsList`, e o nome da lib não vaza.** O wrapper tira
  `activateOnFocus` da assinatura e o calcula por comparação de string
  (`activationMode === "automatic"`): ligada direto, a string `"manual"` viraria
  `true`. O padrão é `automatic`, contra o padrão manual da lib.
- **Aba ativa sai só como `data-active`** — esta stack não escreve `data-state`.
- **Aba desabilitada: repasse `disabled` ao `TabsTrigger`, e só.** A lib escreve
  `aria-disabled`, mantém a aba no percurso das setas e barra a ativação; nada de
  guarda à mão.
- **O painel inativo é DESMONTADO** (`keepMounted` padrão `false` da lib), e por
  isso a aba inativa não leva `aria-controls`. O painel ativo recebe `tabIndex={0}`
  da lib — não se escreve `tabIndex` à mão nos painéis.
- **O `tabindex="0"` segue a aba FOCADA**, não a ativa, quando as duas se separam
  (modo manual ou seta sobre a desabilitada).
- **`tabsListVariants` tem as duas variantes com string vazia**: a classe é sempre
  `nds-tabs-list`, e quem diferencia é `data-variant`.
