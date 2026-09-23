# Navigation Components (Nortear — Angular)

A regra da categoria Navegação — qual componente escolher, marco e nome,
`aria-current`, modelo de teclado, link ou botão, anel de foco, analytics e tom de
voz — está em [`21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md),
uma vez para as cinco stacks. O que cada componente É — contrato, decisões com
data e medição, tokens e peças das cinco stacks — está no PRD dele. Aqui fica só o
que existe nesta stack: diretivas de atributo, o que o `@radix-ng/primitives` impõe
e o que o Angular obriga a fazer diferente.

**Uma mecânica vale para todas as seções abaixo.** Cada ícone do `lucide` é uma
lista `[tag, attrs]` com tag variável, e template Angular exige tag estática; por
isso as peças de ícone (`svg[ndsBreadcrumbIcon]`, `svg[ndsTabsIcon]`,
`svg[ndsStepperCheck]`, `svg[ndsNavigationMenuChevron]`, `svg[ndsMenubarIcon]`,
`svg[ndsPaginationIcon]`) têm o próprio `<svg>` como host e criam os filhos por
`createElementNS` num `effect`, sem `innerHTML` no caminho. O pacote é o `lucide`
agnóstico, não o `lucide-angular`, que declara peer até o Angular 21.

---

## Breadcrumb — a mecânica desta stack

Contrato, decisões e peças das cinco stacks:
[`docs/shared/prd/breadcrumb.md`](../../docs/shared/prd/breadcrumb.md). Regra da
categoria: [`21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Seletores de atributo no elemento nativo, sem primitivo headless.** O
`@radix-ng/primitives` 1.1.2 instalado não publica `breadcrumb`, e não haveria o
que compor: a trilha não guarda estado nem gerencia foco. Raiz, lista, item, link
e página são `@Directive` que só carimbam classe, `data-slot` e ARIA no elemento
que quem compõe já escreveu. Separador e reticências são `@Component`, porque têm
desenho padrão a renderizar.

**O nome do landmark tem duas entradas, e a ordem é input, atributo, padrão.** O
input `label` vence; sem ele, vale o `aria-label` escrito direto no `<nav>`, que a
diretiva LÊ NA CONSTRUÇÃO — porque o host binding de `aria-label` apagaria o
atributo estático em silêncio. Sem nenhum dos dois, o padrão é `breadcrumb`, em
inglês (a decisão sobre esse padrão está aberta na D5 do PRD).

**O link de roteador é a própria diretiva.** `a[ndsBreadcrumbLink]` vai no
`<a routerLink>` de quem compõe e só acrescenta a classe — é o equivalente desta
stack ao `render`/`asChild` das outras, sem segundo elemento. A diretiva não
escuta clique nenhum.

**O separador customizado usa o conteúdo de fallback do `<ng-content>`.** Sem
filho, sai o chevron; com filho, o filho substitui o chevron. `role` e
`aria-hidden` moram no host, fora do alcance do conteúdo projetado. A barra (`/`)
é `kind="slash"` na peça de ícone, que só esta stack publica.

---

## Tabs — a mecânica desta stack

Contrato, decisões, modelo de teclado e peças das cinco stacks:
[`docs/shared/prd/tabs.md`](../../docs/shared/prd/tabs.md). Regra da categoria:
[`21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Quatro diretivas de atributo com `hostDirectives` do Radix NG**
(`RdxTabsRoot`, `RdxTabsList`, `RdxTabsTab`, `RdxTabsPanel`), sem template. Um
`<nds-tabs>` teria outra TAG que a referência, e um `@Component` com
`<ng-content />` criaria view só para reprojetar os mesmos filhos. O primitivo
entrega papéis, `aria-selected`, `aria-controls`/`aria-labelledby`, o foco
itinerante, setas conforme a orientação, Home/End e `hidden` no painel inativo; o
`data-orientation` da raiz também é dele, e por isso não é repetido no host.

**`activationMode` é input da LISTA, e não repassa o input do primitivo.** O
`activateOnFocus` do `RdxTabsList` nasce `false` e tem transform
`booleanAttribute`: ligar a string a ele faria `"manual"` virar `true`. A lista
escreve no sinal da raiz por `effect`, que roda depois do do primitivo porque host
directives são instanciadas antes da diretiva que as declara — a ordem é o que
sustenta o recurso, e as stories de teclado e de ativação manual são a prova.
`activateOnFocus` fica fora da lista de inputs; `loopFocus` fica exposto.

**Escrito à mão ao lado do primitivo**: `data-state="active|inactive"` no gatilho,
porque o Radix NG só emite `data-active` (D9 do PRD); e `data-variant` na lista,
sempre, inclusive no `default`.

**Aba desabilitada é repasse, não guarda.** O `disabled` entra como input do
`RdxTabsTab`, e o próprio primitivo anula o `disabled` nativo e escreve
`aria-disabled` e `data-disabled` (D1 do PRD).

**`id` da aba é input do primitivo**, porque ele é dono de `[attr.id]`; um `id`
estático no elemento é casado com o input de mesmo nome e continua valendo.
`keepMounted` do painel só teria efeito com a diretiva estrutural de presença, que
a stack não usa.

**`svg[ndsTabsIcon]` tem três desenhos fixos** (`user`, `settings`, `shield`),
com `aria-hidden`.

---

## Stepper — a mecânica desta stack

Contrato, decisões e peças das cinco stacks:
[`docs/shared/prd/stepper.md`](../../docs/shared/prd/stepper.md). Regra da
categoria: [`21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Angular puro, sem primitivo headless — e o motivo é o que o primitivo emite.** O
`@radix-ng/primitives` 1.1.2 instalado TEM stepper; ele escreve `role="group"`, o
nome `progress`, `aria-current` = `true` no item e anuncia "Step N of M" em inglês,
que é o contrário do contrato das cinco stacks (D2, D6 e D8 do PRD). O docblock de
`src/components/ui/stepper.ts` ainda diz que o Radix NG não tem Stepper; a
correção é da revisão de código.

**Sete seletores de atributo em elemento nativo**, mais `svg[ndsStepperCheck]`
para a marca de verificação, que leva `.nds-icon` por `[attr.class]` — em SVG o
`className` não aceita binding de classe.

**O estado é sinal derivado por injeção.** A etapa injeta `NdsStepper` e calcula o
estado; o gatilho e o indicador injetam a etapa. Fora dessa árvore a injeção falha
com erro — não há o modo silencioso de outras stacks.

**A seleção é `output()` da RAIZ.** O gatilho chama a etapa, a etapa chama a raiz,
e quem compõe liga `(stepSelect)` uma vez no `<ol>`. Não há cancelamento pelo
clique de quem compõe.

**O nome do fluxo é o `aria-label` nativo no `<ol>`, não input.** A raiz não tem
host binding de `aria-label`, então o atributo chega ao DOM sem disputa; um input
homônimo daria dois jeitos de dizer a mesma coisa.

**`type="button"` é atributo estático do host do gatilho**, e a palavra de estado
é o primeiro nó do template dele, antes do `<ng-content />`.

**Conteúdo próprio no indicador exige o input `custom`.** Projeção é resolvida na
compilação, então o componente não pergunta se há filho: a `<ng-content />` fica
fora de qualquer `@if`, e sem `custom` o conteúdo projetado e o número aparecem
juntos.

---

## Pagination — a mecânica desta stack

Contrato, decisões com data e medição, tokens e peças das cinco stacks:
[`docs/shared/prd/pagination.md`](../../docs/shared/prd/pagination.md). A regra da
categoria — alinhamento da faixa, mecanismo de desabilitar, alvo mínimo e o evento
que a faixa dispara — está em
[`21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md) §Paginar; a
fronteira entre o Pagination e o rodapé do DataTable continua em
[`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md). Aqui fica a mecânica
de navegação desta stack.

**As oito peças são diretiva de ATRIBUTO no elemento nativo**, num arquivo só e
sem `@radix-ng/primitives`. O pacote instalado, 1.1.2, PUBLICA um `pagination`; ele
não é usado porque crava o nome acessível em inglês por host binding — que nesta
stack vence o atributo estático de quem compõe — e desabilita por
`[attr.disabled]`, que não tem efeito em `<a>`. A medição está na D9 do PRD. As
peças são `nav[ndsPagination]`, `ul[ndsPaginationContent]`, `li[ndsPaginationItem]`,
`span[ndsPaginationEllipsis]`, `svg[ndsPaginationIcon]` e os três controles, que
aceitam as DUAS tags — `a[ndsPaginationLink], button[ndsPaginationLink]`, e o mesmo
par em `ndsPaginationPrevious` e `ndsPaginationNext`. A aparência de botão vem
de `btnClass()`, a mesma função pura que o `NdsButton` usa, sem herdar componente
e sem invólucro no DOM.

**O ícone é peça publicada só aqui**, pela mecânica de ícone do topo deste arquivo.

**A tag do controle segue a ROTA, e quem a escolhe é quem compõe.** Com endereço
de página o controle é `<a>` — destino de verdade, abre em nova aba, é indexável.
Sem rota é `<button type="button">`, porque âncora vazia que age na própria página
engana quem navega por teclado e por leitor de tela. O primitivo lê a tag do host
na CONSTRUÇÃO e reemite o `type` por binding, pelo mesmo motivo do `aria-label` do
`<nav>`: host binding apaga atributo estático, e `[attr.type]` no template perde
para ele.

**Desabilitado são dois mecanismos, um por tag, e os dois existem.** No `<button>`
é o `disabled` nativo, que o navegador resolve antes de qualquer ouvinte — não há
guarda a registrar. No `<a>` não existe `disabled`: é `aria-disabled` mais
`tabindex="-1"` mais uma guarda de clique, **e é por isso que a escuta é em fase de
CAPTURA** — um listener declarado no `host` de uma diretiva é registrado **depois**
do `(click)` que quem consome escreve no mesmo elemento, e barrar dali não alcança
ninguém, porque o handler de quem usa já disparou. A interceptação é registrada no
construtor, na fase de captura, e o estado desabilitado é lido na hora do clique
(ler um `input()` dentro do construtor devolveria o default). Sintoma quando isso
falha: o controle desabilitado continua chamando o callback de página, sem erro
nenhum. Ver [`13-system-design.md`](13-system-design.md) §Eventos.

---

## Navigation Menu — a mecânica desta stack

Contrato, decisões e peças das cinco stacks:
[`docs/shared/prd/navigation-menu.md`](../../docs/shared/prd/navigation-menu.md).
Regra da categoria:
[`21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**`nav[ndsNavigationMenu]` é `@Component` com `RdxNavigationMenuRoot` como host
directive**, e o `<nav>` é o próprio host — é nele que quem compõe escreve o
`aria-label`, que não tem padrão por decisão escrita no primitivo (duas barras
nasceriam homônimas). Os inputs repassados são só os próprios da diretiva
(`value`, `defaultValue`, `orientation`, `dir`, `delay`, `closeDelay`): nome de
fora em `hostDirectives.inputs` quebra com NG0311. As esperas usam os nomes e os
padrões do Radix NG, não `delayDuration` (D12 do PRD).

**O painel é UM para a barra, e mora no template da raiz**: portal para o `<body>`,
`rdxNavigationMenuPositioner`, `rdxNavigationMenuPopup` e viewport, desmontados ao
fechar. `align` e `sideOffset` são inputs da raiz; o lado NÃO é input — é derivado
da orientação (`bottom` ou `right`). O `indicator` liga a seta do primitivo dentro
do popup; o losango dela não é desenhado nesta stack (inconsistência 11 do PRD).

**O miolo do painel é `ng-template[ndsNavigationMenuContent]`**, instanciado pelo
viewport compartilhado. Um elemento projetado não serviria: o nó pertenceria à
view de quem compõe, e fechar o painel o removeria do DOM sem destruir as
diretivas. Dentro dele, `[ndsNavigationMenuPanel]` é a raiz VISUAL — o viewport
mede o primeiro elemento instanciado para dimensionar o popup, então o padding e o
`data-slot="navigation-menu-content"` moram nela, não no popup.

**A lista troca de classe na vertical** (`nds-stack nds-list-none` e
`data-spacing="xs"`), porque a folha só descreve a barra horizontal.

**O gatilho monta o chevron no próprio template** e envolve o rótulo num `<span>`.
`svg[ndsNavigationMenuChevron]` é exportado só por exigência do verificador de
template (NG3004) e fica fora de `NDS_NAVIGATION_MENU`.

**`a[ndsNavigationMenuLink]` e `a[ndsNavigationMenuChild]` são o mesmo
`RdxNavigationMenuLink` com desenhos diferentes.** O da barra expõe
`closeOnClick`; o do painel não, e fecha SEMPRE por `close('link-press')` no
próprio host, sem olhar `defaultPrevented` (D3 do PRD). Os dois recebem `active`, e
o primitivo escreve `aria-current="page"` e `data-active`.

**Rótulo e descrição do destino são peças com `data-slot` só aqui**
(`div[ndsNavigationMenuChildLabel]`, `p[ndsNavigationMenuChildDescription]`). A
descrição não leva `aria-hidden`: ela entra no nome acessível do link (C13 do PRD).

---

## Menubar — a mecânica desta stack

O Menubar não tem PRD próprio: o contrato está no PRD da família de menus,
[`docs/shared/prd/dropdown-menu.md`](../../docs/shared/prd/dropdown-menu.md), que
declara `prd-familia: context-menu menubar` — inclusive os eventos, na §9. **A
categoria dele está em disputa** (Navegação no conteúdo e no Storybook, menu de
comandos no PRD da família e em
[`18-overlay.md`](../../docs/shared/guidelines/18-overlay.md)); a decisão não é
deste arquivo, e está no item 1 de §O que está aberto de
[`21-navegacao.md`](../../docs/shared/guidelines/21-navegacao.md).

**Barra e menu são elementos `<nds-*>`, o resto é atributo.** `nds-menubar` recebe
`RdxMenubarRoot` (inputs `disabled`, `modal`, `loopFocus`; `orientation` fica de
fora porque a folha só desenha a barra horizontal) e é a âncora do Tab que sai de
um menu aberto (`NDS_MENU_TAB_ANCHOR`). `nds-menubar-menu` e `nds-menubar-sub` são
o MESMO componente sobre `RdxMenuRoot`: é o sub-gatilho quem marca a raiz como
submenu, e o `data-slot` sai `menubar-menu` ou `menubar-sub` conforme isso.

**O miolo é `ng-template[ndsMenubarContent]` / `[ndsMenubarSubContent]`**, pelo
mesmo motivo do DropdownMenu: nó projetado não é destruído ao fechar, e é a
destruição que devolve o foco ao gatilho. O template é instanciado com o injetor
do POPUP (`NdsMenuPopupScope`, peça compartilhada pelos três menus desta stack), sem
o qual os itens não achavam a lista do painel e o submenu nascia solto na árvore
flutuante.

**O posicionamento é input do `ng-template`, não do primitivo.** `side`, `align`,
`sideOffset` e `alignOffset` nascem indefinidos, e o menu resolve o padrão:
`bottom`, `start`, 8 e -4 no menu da barra; `right`, `start`, 0 e -3 no submenu.

**O painel veste `.nds-dropdown-menu-*` com `data-slot` de prefixo `menubar-`**: a
folha do menubar só descreve a barra e o gatilho, e o painel vai para portal.

**Escrito à mão ao lado do primitivo**: `data-state` no gatilho, porque a folha
realça o aberto por `[data-state="open"]` e o Radix NG publica `data-popup-open`; e
os atributos `rdxMenuItem`, `rdxMenuSubTrigger`, `rdxMenuCheckboxItem` e
`rdxMenuRadioItem` no host dos itens — host directive não escreve o atributo do
seletor, e o primitivo acha os itens por `querySelectorAll`. Sem essa linha o item
fica fora do foco itinerante e do typeahead, em silêncio.

**Item é `<div>`, não `<button>`**, porque `.nds-dropdown-menu-item` não zera a
aparência nativa de botão. Nenhum `(click)` no host do item: reagir à escolha é
`(onSelect)` ou o `(click)` de quem compõe.

**O sub-gatilho soma duas host directives compartilhadas**:
`NdsSubmenuKeyboardEntry` (a seta direita leva o foco ao primeiro item do submenu)
e `NdsSubmenuOwnsPanel` (o `aria-owns` que liga o item ao painel portalado, só com
ele aberto — a lib não escreve essa ligação).

**O rótulo não usa o `RdxMenuGroupLabel`**, que exige grupo ancestral e lança sem
ele: `div[ndsMenubarLabel]` lê o contexto de grupo como opcional.

**`svg[ndsMenubarIcon]` é interno** (chevron do sub-gatilho, marca e traço do
estado misto), exportado só por NG3004. No item de marcação o glifo misto é
ramificado no template — traço em vez de tique —, porque o indicador da lib não
entrega o estado ao conteúdo projetado.
