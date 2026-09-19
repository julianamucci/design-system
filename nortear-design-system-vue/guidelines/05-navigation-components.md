# Navigation Components

A regra da categoria — qual componente de navegação usar, marco e nome, o
vocabulário de `aria-current`, teclado, link ou botão, anel de foco, analytics e
tom de voz — está UMA vez, em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).
O que cada componente É — contrato, decisões com data e medição, tokens, peças das
cinco stacks — está no PRD dele. Este arquivo guarda só a mecânica desta stack: o
que a `reka-ui` impõe, o que os wrappers contornam e a forma de API que só existe
aqui.

---

## Breadcrumb — mecânica desta stack

Contrato e catálogo: [`docs/shared/prd/breadcrumb.md`](../../docs/shared/prd/breadcrumb.md).
Regra da categoria: [`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**API e exemplos**: `src/components/ui/breadcrumb/` (`Breadcrumb.vue` e as outras seis peças) + stories + `BreadcrumbDocs.vue`.

| o quê | como é aqui |
|---|---|
| o que vem da lib | quase nada: as sete peças são SFCs sobre elementos nativos. Só o `BreadcrumbLink` embrulha o `Primitive` da reka-ui, e só para ter `as` (padrão `a`) e `as-child` — é por ele que o link do roteador recebe a classe sem virar um segundo elemento |
| nome do landmark | `Breadcrumb.vue` já é o `<nav>` e escreve o nome padrão. Não há prop: as SFCs não declaram `inheritAttrs: false`, então o `aria-label` que quem compõe escreve cai no `<nav>` pelo repasse de atributos e substitui o padrão |
| separador | `<li>` com `role` e `aria-hidden` no próprio SFC; o desenho entra por slot, e sem slot sai o chevron. Trocar o slot não devolve o separador à leitura, porque os atributos moram fora dele |
| reticências | prop `label`: com ela, `role="img"` e `aria-label`; sem ela, `aria-hidden`. O ícone também entra por slot |
| classe extra | `class`, mesclada por `cn` |

---

## Menubar — mecânica desta stack

O Menubar não tem PRD próprio: o contrato mora no PRD da família de menus,
[`docs/shared/prd/dropdown-menu.md`](../../docs/shared/prd/dropdown-menu.md) — teclado
na §8, eventos e `reason` na §9, peças e inconsistências na §7. **A categoria dele
está em disputa** (Navegação, pelo conteúdo e pelo Storybook; menu de comandos da
categoria Overlay, pelo PRD da família) e é o primeiro item de §O que está aberto em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).
Este arquivo não decide: registra só a mecânica.

**API e exemplos**: `src/components/ui/menubar/` + stories + `MenubarDocs.vue`.

| o quê | como é aqui |
|---|---|
| o que vem da lib | as quinze peças são wrappers dos primitivos `Menubar*` da reka-ui. O `MenubarMenu` da lib só renderiza o slot: o `data-slot="menubar-menu"` escrito no wrapper não chega ao DOM |
| laço das setas | `Menubar.vue` liga `loop` por padrão; a reka nasce com ele desligado, e a barra parava na ponta ([`PATCHES.md`](../../PATCHES.md), `#vue-menubar-loop-default`) |
| motivo do fechamento | `update:modelValue` entrega o MOTIVO como segundo argumento quando um menu fecha: `escape`, `overlay` ou `api`. Qual menu fechou é o valor anterior, que quem consome guarda. A reka não publica o motivo, então quem vê o gesto ANOTA num canal injetado (`menubar.context.ts`) e a barra lê a anotação quando o valor muda: o painel anota Escape e ponteiro fora; o gatilho anota Enter e Espaço sobre o próprio menu aberto, em fase de captura; o ouvinte de Tab anota a saída. Passar ao menu vizinho sai sempre `overlay`, e sem anotação sai `api` |
| Tab sai da barra | a reka monta o menu NÃO modal e o painel vive em portal no fim do documento, então o Tab do navegador partia do portal. O mesmo ouvinte de captura roda em TRÊS pontos — `MenubarContent.vue`, `MenubarSubContent.vue` e, desde 2026-09-18, o próprio `MenubarTrigger.vue` (`tab-leaves-menu.ts`) —, e move o foco ao vizinho de tabulação do GATILHO; a lib fecha sozinha quando o foco sai. Sem vizinho, só fecha, e o foco volta ao gatilho ([`PATCHES.md`](../../PATCHES.md), `#vue-menu-tab-leaves`) |
| Tab com o foco no GATILHO | é o gesto que o ouvinte do painel não via: o painel vive em portal, e uma tecla apertada no gatilho nunca chega nele. A barra fechava por focus-out sem anotação e o motivo saía `api`. O gatilho passa a rodar o mesmo ouvinte, sob a guarda de `aria-expanded="true"` — com a barra fechada o gatilho é ponto de tabulação comum e a tecla não é tocada. Afirmado no último passo de `TabLeavesMenubar` |
| reabrir pelo teclado | NÃO há conserto aqui, e a ausência é medida. Até 2026-09-18 o `MenubarTrigger.vue` esperava o painel montar e focava o primeiro `[role="menuitem"]`; plantando a remoção, o Playground passou — a entrada da própria reka cobre o caminho, e o conserto era código morto. O papel do primeiro item também não importa: `States/CheckboxChecked` reabre por teclado num menu sem nenhum item de ação e afirma que o foco entra no `menuitemcheckbox` |
| Escape no submenu | fecha só o submenu: o estado mora em `MenubarSub.vue`, e o ouvinte de captura consome a tecla antes da `window` ([`PATCHES.md`](../../PATCHES.md), `#vue-menu-submenu-escape`) |
| marcar e escolher | `MenubarCheckboxItem` e `MenubarRadioItem` previnem o `select` depois do ouvinte de quem consome — a reka fecharia o menu em toda escolha ([`PATCHES.md`](../../PATCHES.md), `#vue-menu-select-keeps-open`) |
| item desabilitado | continua no percurso das setas pelo patch de pacote em `patches/reka-ui+2.10.4.patch` (`MenuContentImpl`), que vale para os três menus da stack. Depois de atualizar a reka, confirme o patch aplicado |
| item de marcação | `checked` e `update:checked`, declarados pelo wrapper — diferente do `v-model` do `DropdownMenuCheckboxItem` desta mesma stack. Divergência de API registrada no PRD da família, não alinhada |
| painel de topo | em portal (`MenubarPortal`), com a classe `nds-dropdown-menu-content`; padrões `align="start"`, `sideOffset` 8 e `alignOffset` -4 no wrapper |
| painel de submenu | `sideOffset` 0 e `alignOffset` -4 declarados em `MenubarSubContent.vue` desde 2026-09-18 (D15 do PRD da família). Antes não declarava nada e herdava o padrão da lib, nunca medido — vão é valor de design system, não API |
| painel longo | recorta na janela e ROLA: o `max-height` sai da folha compartilhada, pelo degrau `--reka-menubar-content-available-height`. A regra `scrollable-region-focusable` do axe é exceção DECLARADA na story `States/LongMenu`, porque a reka crava `tabindex="-1"` em todo item e o foco não é itinerante por atributo — a premissa (a seta traz o item focado para dentro da caixa) vira asserção ali |

---

## Navigation Menu — mecânica desta stack

Contrato e catálogo: [`docs/shared/prd/navigation-menu.md`](../../docs/shared/prd/navigation-menu.md).
Regra da categoria: [`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**API e exemplos**: `src/components/ui/navigation-menu/` (`NavigationMenu.vue` e as outras peças) + stories + `NavigationMenuDocs.vue`.

| o quê | como é aqui |
|---|---|
| o que vem da lib | as peças são wrappers dos primitivos `NavigationMenu*` da reka-ui, e a raiz da lib já é o `<nav>`. Não há nome padrão: o `aria-label` é atributo de quem compõe |
| destino da barra × destino do painel | duas peças sobre o mesmo `NavigationMenuLink` da lib: `NavigationMenuLink` é a pílula da barra, `NavigationMenuChild` é o bloco com título e descrição DENTRO do painel. Fechar o painel ao escolher é o padrão da lib, que dispensa quando o evento de seleção não é prevenido |
| viewport | prop `viewport` na raiz, padrão `true`: `NavigationMenu.vue` monta sozinho o `NavigationMenuViewport` (invólucro `.nds-navigation-menu-viewport-wrap`, painel `.nds-navigation-menu-viewport-panel`) e escreve `data-viewport`. Há UM painel por barra, e cada `NavigationMenuContent` é o miolo (`.nds-navigation-menu-viewport-content`). Compor outro `NavigationMenuViewport` com o padrão ligado produz dois |
| setas na barra | a reka não traz foco itinerante entre os gatilhos — só trata a tecla de entrada no painel aberto. `NavigationMenuList.vue` reimplementa setas e Home/End no eixo da orientação, com um controle por `<li>`. Nenhum `tabindex` é escrito: cada item da barra é uma parada de Tab |
| modelo | `v-model` (`modelValue` + `update:modelValue`) e `default-value`. Não existe `update:value` |
| esperas | `delay-duration` (padrão da lib, 200) e `skip-delay-duration` (300). A lib fecha o painel quando o ponteiro sai da barra e do painel |
| indicador | peça `NavigationMenuIndicator`, composta dentro da lista — não é prop da raiz |
| gatilho aberto | a lib escreve `data-state="open"`, que a folha lê só para girar o chevron |
| painel na barra vertical | o invólucro do viewport abre abaixo da barra, e a folha não tem regra vertical para ele (D4 do PRD) |

---

## Pagination — mecânica desta stack

Contrato, decisões com data e medição, tokens e peças das cinco stacks:
[`docs/shared/prd/pagination.md`](../../docs/shared/prd/pagination.md). A regra da
categoria — marco e nome, `aria-current`, desabilitado, alinhamento da faixa, tom de
voz e o evento — está em
[`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).
A fronteira entre ele e o rodapé do DataTable fica em
[`docs/shared/guidelines/20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md).
A mecânica de navegação fica aqui.

**API e exemplos**: `src/components/ui/pagination/Pagination.vue` + stories + `PaginationDocs.vue` (renderizada na aba Docs do Storybook).

| o quê | como é aqui |
|---|---|
| o que vem da lib | a raiz, a lista e os dois direcionais são primitivos da reka-ui, e as reticências também. O link numerado não: não há primitivo de página em uso |
| a lista | o primitivo renderiza `div` por padrão e a faixa é uma lista — a tag é trocada pela prop `as` |
| reticências | o `as` tem de ser PADRÃO de prop, nunca atributo delegado: o `v-bind` dos delegados é aplicado depois, e um `as` indefinido devolvia o `div` do primitivo em silêncio |
| link numerado | `<a>` escrito à mão, com `href` de padrão `#`. Não é enfeite: sem `href` a âncora não recebe papel de link, não entra na ordem de tabulação e o Enter não a alcança — a faixa numerada inteira ficava fora do teclado. Quem tem URL de verdade passa a sua |
| desabilitar direcional | aqui os direcionais são `<button>` da lib, com o `disabled` NATIVO, e o navegador barra clique e tabulação sozinho. A regra da categoria cobre também a forma de âncora, que precisa de `aria-disabled` MAIS saída da tabulação: `aria-disabled` bloqueia só o PONTEIRO, e sem `tabindex="-1"` o Enter continua navegando |
| régua de páginas | calculada pelo primitivo, não por quem consome |

---

## Stepper — mecânica desta stack

Contrato e catálogo: [`docs/shared/prd/stepper.md`](../../docs/shared/prd/stepper.md).
Regra da categoria: [`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**API e exemplos**: `src/components/ui/stepper/` (`Stepper.vue` e as outras seis peças) + stories + `StepperDocs.vue`.

| o quê | como é aqui |
|---|---|
| o que vem da lib | nada. A reka-ui 2.10.4 publica um Stepper, e ele foi RETIRADO: a raiz dele emite uma região viva fixa com "Step N of M" em inglês, que nenhuma prop desliga; crava `role="group"` com o nome "progress"; marca a etapa atual com `aria-current="true"` no item; e sai como `div` onde a folha declara `ol`/`li`. As sete peças são Vue puro |
| estado | derivado por `provide`/`inject` (`stepper.context.ts`): a raiz publica valor e rótulos, o item compara o próprio número e publica o estado para gatilho e indicador. Fora da raiz, o `inject` cai em `null` e as peças renderizam em silêncio como etapa futura de número 1 |
| seleção | evento `step-select` com o número da etapa. O componente não muda o próprio valor — não há `v-model` —, e quem consome devolve `value`. O gatilho não oferece cancelamento pelo clique de quem compõe |
| nome acessível | não é prop: o `aria-label` cai no `<ol>` pelo repasse de atributos. O tipo não o exige, então um Stepper sem nome compila — escreva o atributo |
| rótulos de estado | prop `labels` na RAIZ (`completed`, `current`), porque o estado de uma etapa muda quando o fluxo avança |
| slot da etapa | `StepperItem` expõe `state` no slot com escopo |
| conteúdo próprio do indicador | pelo slot padrão de `StepperIndicator`, que substitui número e marca. Não se escreve `data-custom` |
| indisponível | `disabled` só na etapa: o gatilho não o declara como prop e escreve o `disabled` nativo a partir do item |

---

## Tabs — mecânica desta stack

Contrato e catálogo: [`docs/shared/prd/tabs.md`](../../docs/shared/prd/tabs.md).
Regra da categoria: [`docs/shared/guidelines/21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**API e exemplos**: `src/components/ui/tabs/` (`Tabs.vue`, `TabsList.vue`, `TabsTrigger.vue`, `TabsContent.vue`) + stories + `TabsDocs.vue`.

| o quê | como é aqui |
|---|---|
| o que vem da lib | as quatro peças são wrappers dos primitivos `Tabs*` da reka-ui. `Tabs.vue` redeclara as props da raiz (`defaultValue`, `modelValue`, `orientation`, `dir`, `activationMode`, `unmountOnHide`, `as`, `asChild`) e escreve `data-orientation` também à mão |
| modelo | `v-model` (`modelValue` + `update:modelValue`). Não existe `onValueChange` |
| modo de ativação | `activationMode` mora na RAIZ e vai para a lib, que nasce `automatic` |
| variante | prop `variant` na lista, que vira `data-variant`. `tabsListVariants` mora em `index.ts`, e a classe é sempre `nds-tabs-list`: quem diferencia é o atributo |
| aba desabilitada, no gatilho | `TabsTrigger.vue` NÃO repassa `disabled` à lib e escreve `aria-disabled` à mão. Repassar ligaria o `disabled` nativo, e o `data-disabled` que a lib emite faria o foco itinerante pular a aba — por isso esta stack não emite `data-disabled` |
| aba desabilitada, na lista | para a lib ela é aba comum: o ponteiro, Enter/Espaço e o próprio FOCO a ativariam. `TabsList.vue` barra `mousedown`, `click`, Enter/Espaço e `focus` por guarda em fase de CAPTURA — a única posição determinística, porque num ancestral a captura precede os ouvintes do alvo. `focus` não é cancelável: quem contém é `stopPropagation`, e o foco em si acontece, que é o que faz o leitor de tela anunciar. Setas, Home e End passam |
| o que a lib escreve e fica | `aria-orientation="horizontal"` também no horizontal; PageUp e PageDown vão à primeira e à última aba; o `tabindex="0"` segue a aba FOCADA quando foco e seleção se separam; o conteúdo do painel inativo é desmontado (`unmountOnHide`, padrão da lib). Os quatro estão registrados como inconsistência no PRD, sem decisão |
