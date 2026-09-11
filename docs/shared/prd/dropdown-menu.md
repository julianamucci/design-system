# PRD — DropdownMenu

> **Estado descrito**: 2026-09-07. **Revisão serial fechada em** 2026-09-07.
> **Revisado em 2026-09-10** pela pipeline `fix` do ContextMenu, que mora aqui
> (D9): §2 (C2, C5, C10), D1, D2, D4, D5, §6, §7, §8 e §9 mudaram, com a linha antiga
> registrada no lugar.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Menu suspenso disparado por um gatilho, em que **o teclado pertence à lista**:
as setas andam item a item, letra digitada é typeahead, e Tab fecha.

É a folha mais reusada da família: o **menu de contexto** e o **menubar** são
construídos com estas mesmas classes, e nenhum dos dois tem folha própria.

| vizinho | diferença que decide |
|---|---|
| Popover | o teclado pertence ao CONTEÚDO: Tab circula campos, letra é texto |
| Command | lista navegável COM campo de busca — o item nunca recebe foco, quem o mantém é o campo |
| Select | escolha de um valor de formulário, com o valor escolhido visível no gatilho |

A pergunta que decide entre este e o Popover: **a pessoa vai escolher ou vai
compor?** Se digitar uma letra ali dentro é atalho, é menu; se é texto, é popover.
Pôr um `<input>` aqui quebra duas coisas de uma vez — `role="menu"` só admite
`menuitem` e parentes, e a primeira letra digitada vira typeahead antes de chegar
ao campo.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | O painel recebe o foco ao abrir, e as setas alcançam os itens | `accessibility.items.item2` |
| C2 | **Não prende o foco**: Tab e Shift+Tab fecham o menu inteiro — também de dentro do submenu — e o foco vai ao próximo ponto de tabulação depois do GATILHO (Shift+Tab: ao anterior; no Menubar, da barra; no ContextMenu, da área); sem vizinho, volta ao gatilho | `accessibility.keyboard.tab` |
| C3 | Setas cima/baixo andam; Home/End vão às pontas | `accessibility.items.item4` |
| C4 | Letra digitada move o foco para o item que começa com ela (typeahead), com `preventDefault` | `accessibility.keyboard.typeahead` |
| C5 | `Escape` fecha e devolve o foco ao gatilho; dentro do submenu fecha só o submenu e devolve o foco ao sub-gatilho. Clique fora também fecha | `accessibility.items.item5` |
| C6 | Setas direita/esquerda abrem e fecham submenu | `accessibility.keyboard.arrows` |
| C7 | O gatilho declara `aria-haspopup="menu"` e `aria-expanded` | `accessibility.items.item1` |
| C8 | Papéis por tipo de item: `menuitem`, `menuitemcheckbox`, `menuitemradio` | `accessibility.items.item3` |
| C9 | O atalho exibido é só texto — a tecla real é registrada por quem consome | `accessibility.items.item6` |
| C10 | Marcar um item de marcação ou escolher uma opção de rádio NÃO fecha o menu | plays `WithCheckbox`/`WithRadioGroup` (menu de contexto) e `With Checkbox Items`/`With Radio Group` (compositions do dropdown e do menubar) |

**O destino do Tab sai do GATILHO, não do painel.** O painel vive num portal no
fim do `<body>`: o Tab nativo a partir dele leva o foco para fora do documento,
e o Shift+Tab, para o último focável da página. Medido em 2026-09-10 — cada
stack falhava de um jeito: a reka prendia o Tab no DropdownMenu e no ContextMenu
(modais), a base-ui prendia no ContextMenu, o Menubar da reka mandava o foco ao
`<body>`, o bits deixava o menu aberto quando o gatilho era a última parada, e o
vanilla e o radix-ng saíam do portal ou voltavam ao gatilho. No Menubar o gatilho
é a BARRA, que é uma parada só (tabulação itinerante).

## 3. Decisões fixadas

### D1 · Menu não prende o foco — e a página dizia o contrário

**Corrigida em** 2026-09-07 (`6b85f3a74`).
**Medição**: `accessibility.items.item2` afirmava que o painel prende o foco
enquanto aberto, e `accessibility.keyboard.tab`, **três linhas abaixo na mesma
seção**, dizia que Tab sai do menu e o fecha. As duas não podem ser verdade.
**O que vale**: o painel recebe o foco ao abrir, as setas percorrem os itens, e
Tab fecha e segue o percurso da página. Prender o foco é contrato de diálogo.
**Nota**: a prop `modal` tem padrão `true` aqui — e modal, neste componente,
significa véu de interação e trava de rolagem, não armadilha de foco.
**Medido em 2026-09-10 — o texto estava certo e nenhuma stack o cumpria por
inteiro, nem a referência.** O vanilla fechava no Tab mas deixava o foco ao
navegador, que partia do portal no fim do `<body>`: o Tab saía do documento e o
Shift+Tab caía no último focável da página, nos três menus; o Menubar do vanilla
nem fechava. As outras quatro erravam de outros jeitos (ver a nota sob §2).
Nenhuma story media o DESTINO do foco — só que ele não ficava preso —, e é por
isso que as cinco pareciam cumprir o C2. Hoje cada stack tem `TabLeavesMenu` e
`TabAtPageEnd` (no Menubar, `TabLeavesMenubar`), com o destino conferido.

### D2 · O anel de foco do item é INTERNO e em `--accent-foreground`

**Estado**: `outline: 2px solid hsl(var(--accent-foreground))` com
`outline-offset: -2px`.
**Medição, nas duas metades**:

- **por que não `--ring`**: o anel é desenhado sobre o preenchimento de accent, e
  no escuro do tema default o `--ring` (teal) e o accent têm praticamente a mesma
  luminância — **1,38:1**, e **1,01:1** onde o accent entra a 80%. O anel sumiria
  justamente no modo em que o problema é maior. `--accent-foreground` é, por
  definição, o que se lê sobre o accent: **4,66:1** no pior dos seis pares de tema
  e modo, contra os 3:1 que a WCAG 1.4.11 pede;
- **por que interno**: o painel tem `padding: 4px` e `overflow-y: auto` — anel
  externo é recortado nas laterais e nos itens das pontas. `outline` não ocupa
  espaço, então a lista não se move ao receber foco.

**Por que existe**: antes, o item destacado era indicado SÓ pelo preenchimento, e
no tema default o `--accent-foreground` é igual ao `--foreground` — o texto não
muda, então quem navega por teclado dependia inteiramente da diferença entre o
fundo do item e o do painel, que nunca chegou a 3:1.
**Vale para as quatro peças focáveis** — item, item de marcação, item de rádio
e sub-gatilho — desde 2026-09-10. As três últimas declaravam `outline: 0` e não
recebiam anel nenhum: focadas pelo teclado, só mudavam de fundo, nas cinco
stacks e nos três menus que vestem esta folha (achado da pipeline do
ContextMenu, WCAG 2.4.7).

### D3 · Texto secundário sobre item destacado é `--accent-foreground` a 85%

**Medição**: o accent é o laranja/teal da marca, não um quase-branco.
`--muted-foreground` sobre ele mede **2,64:1** — o axe reprovou no `command`, e o
defeito é o mesmo em todo segundo texto dentro de item destacado. **85% é o PISO
medido**: a 80% a razão cai para 4,34:1.

### D4 · O item destacado é `--accent` a 20%; no `command` é 10%

**Estado**: `[data-highlighted]`, `:focus` e `:hover` pintam o item com
`--accent / 0.2`, em TODAS as peças (item, marcação, rádio, sub-gatilho); a
variante destrutiva usa `--destructive / 0.1`.
**Até 2026-09-10 esta linha não era a folha**: o par `:focus`/`:hover` do item
comum pintava 10%, e o mesmo menu tinha dois pesos conforme o tipo do item e o
caminho que o destacou. Decisão da dona: 20% para todos.
**E o `:hover` só existia no item comum** até a mesma data — marcação, rádio,
sub-gatilho e a variante destrutiva reagiam a `:focus` e `[data-highlighted]`. As
quatro stacks de lib escrevem `[data-highlighted]` na passagem do ponteiro, e o
defeito não aparecia nelas; as fábricas do vanilla não escutam ponteiro nos
itens, e ali passar o mouse numa marcação não pintava nada, e no item destrutivo
pintava o accent a 20%. A folha ganhou o `:hover` nas quatro peças (decisão da
dona: mudar a folha, não esta linha), e a marcação desabilitada do vanilla, que
só carrega `aria-disabled`, passou a esmaecer e a bloquear o ponteiro. Portão:
`destaque_sem_hover` — peça pintada por `[data-highlighted]` sem `:hover` na
mesma folha reprova, salvo folha cuja fábrica do vanilla destaca por ponteiro
(select e combobox, exceções declaradas com a premissa conferida no arquivo).
**Contraste registrado**: o `command` usa 10% para o item selecionado. Mesmo
token, pesos diferentes, e as duas folhas dizem isso separadamente — não unifique
sem medir os dois casos.

### D5 · Menu fecha instantâneo, sem animação de saída

**Estado**: só a entrada anima (`nds-menu-in`, sob `[data-open]`/`[data-state="open"]`);
não há keyframe de saída — manter o menu montado durante o fechamento deixa os
focus-guards da lib visíveis para o axe (`aria-hidden-focus`).
**O que vale**: menus fecham instantâneo, como no vanilla.
**Até 2026-09-10 a folha dizia o contrário**: declarava `nds-menu-out` sob
`[data-closed]`/`[data-state="closed"]` desde 2026-07-26, logo abaixo do
comentário que proibia a saída animada. Saiu por decisão da dona; a entrada
continua animada.
**O que a saída escondia**: com o painel montado ~150 ms depois de fechar, as
plays que afirmavam "marcar não fecha o menu" (C10) passavam no Vue e no Svelte
— onde a reka e o bits FECHAVAM em toda escolha, inclusive nas de marcação e de
rádio. Medido em par no Svelte: com a regra de saída reinjetada, a story passa.
Corrigido nos wrappers (PATCHES `#vue-menu-select-keeps-open`,
`#svelte-menu-select-keeps-open`, `#vue-context-menu-keep-open`), e as plays
passaram a contar menus abertos (`queryAllByRole('menu')`) em vez de conferir o
nó no documento, que no bits continua lá depois de fechado.

### D6 · O separador RASGA o padding do painel

**Estado**: `margin-inline: calc(var(--spacing-1) * -1)` — a régua corre de borda
a borda, atravessando os 4px de padding do painel.
**Consequência para o desenho**: auto-layout não tem margem negativa, então no
Figma a régua para na borda do item. A folha é quem manda.

### D7 · O raio do item é `--radius-sm`, e isso é raio aninhado

**Estado**: `Rᵢ = Rₑ − E`, ou seja `--radius` (10) menos o padding do painel
(`--spacing-1`, 4).
**Para revisitar**: mudar o padding do painel sem mudar o raio do item faz os
cantos derivarem um do outro.

### D8 · O item de checkbox e o de rádio desenham a MESMA linha

**Estado**: os dois usam o mesmo tique à direita, na mesma pista reservada de
`--spacing-8`. O que os separa é o papel e o comportamento, não o desenho. O
estado misto existe só na caixa de seleção, e desenha um traço, não um tique.
**Por quê**: tique quer dizer "marcado", e misto não é isso — repetir o tique nos
dois estados apagaria a diferença para quem depende do símbolo.

### D9 · O ContextMenu e o Menubar não têm folha própria

**Estado**: não existe `context-menu.css`. O componente inteiro é montado com
estas classes, e a única regra própria dele mora **dentro** de `dropdown-menu.css`:
`.nds-context-menu-trigger { user-select: none }`.
**O que difere**: o gatilho (área de clique-direito) e onde o painel é colocado
(no ponteiro, não ancorado a um elemento). Nenhum dos dois é desenho.

### D10 · O payload de analytics não leva texto localizado

**Corrigida em** 2026-09-07 (`6b85f3a74`).
**Medição**: `analytics.description` mandava o `label` levar "texto do trigger ou
item" — e texto localizado divide o mesmo evento em um valor por idioma no GA4. A
contradição estava no conteúdo que ENSINA, não no código que envia, e por isso
sobreviveria a qualquer correção de stack.

### D11 · A cadeia de `transform-origin` enumera QUATRO peças do bits

**Corrigida em** 2026-09-09.
**Medição**: a cadeia caía em `center` no Svelte, e o menu crescia do MEIO em vez
de crescer do gatilho. Medido no Storybook do Svelte com o painel aberto:
`transform-origin` resolvia em `64px 48.5px` numa caixa de 128×97 — o centro
exato. Depois do conserto, `0px 0px`, a borda encostada no gatilho.

**Por que quatro nomes**: por D9. Esta folha veste dropdown, context-menu e
menubar, e os submenus dos três entram por outro nome ainda. No bits-ui 2.19.0
`getFloatingContentCSSVars(nome)` escreve `--bits-${nome}-content-transform-origin`
e é chamado com `"dropdown-menu"`, `"context-menu"`, `"menubar"` e `"menu"`. Os
nomes não se derivam do nome do componente — no bits o hover-card chama-se
`link-preview`.

**Por que demorou**: a cadeia nasceu sem o degrau do bits na migração do Vue, em
seis folhas de uma vez. O conserto do tooltip (2026-09-03) mediu as seis e
deixou as outras cinco escritas na mensagem do commit, como fora de escopo —
daí em diante foi uma por rodada, e a mesma omissão voltou como achado novo três
vezes. `center` é fallback válido, então nada reprovava. Agora reprova:
`cadeia_transform_origin_sem_bits`, com conferência de premissa contra o pacote
instalado.

## 4. Anatomia

```
dropdown-menu                       (raiz — só estado)
└── dropdown-menu-trigger           aria-haspopup="menu" · aria-expanded
    └── dropdown-menu-positioner
        └── dropdown-menu-content   role="menu" · padding 4px · rola
            ├── dropdown-menu-label            não interativo, não recebe foco
            ├── dropdown-menu-item             role="menuitem"
            │   ├── [ícone]                    16px
            │   ├── [rótulo]
            │   └── dropdown-menu-shortcut     só exibe (C9)
            ├── dropdown-menu-checkbox-item    role="menuitemcheckbox"
            │   └── dropdown-menu-item-indicator   absoluto à direita
            ├── dropdown-menu-radio-item       role="menuitemradio"
            ├── dropdown-menu-sub-trigger      + chevron à direita
            └── dropdown-menu-separator        rasga o padding (D6)
```

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/dropdown-menu.css`.

| propriedade | valor | token |
|---|---|---|
| largura mínima do painel | 128px | **literal** (`8rem`) |
| padding do painel | 4px | `--spacing-1` |
| superfície | — | `--popover` |
| texto | — | `--popover-foreground` |
| borda | 1px | `--border` |
| raio do painel | — | `--radius` |
| raio do item | — | `--radius-sm` — ver D7 |
| sombra | — | `--elevation-md` |
| padding do item | 8px lateral, 6px vertical | `--spacing-2` e `--spacing-1-5` |
| gap do item | 8px | `--spacing-2` |
| ícone do item | 16px | `--spacing-4` |
| tamanho de texto | 14px | `--text-control` |
| rótulo de grupo e atalho | 12px | `--text-control-sm` |
| item destacado | accent a 20% | `--accent` — ver D4 |
| texto do item destacado | — | `--accent-foreground` |
| anel de foco do item | 2px interno | `--accent-foreground` — ver D2 |
| variante destrutiva | destructive, fundo a 10% | `--destructive` |
| separador | 1px | `--muted` |
| pista do indicador | 32px | `--spacing-8` |
| item recuado | 28px | `--spacing-7` |
| camada | — | `--z-popover` |

**O separador aqui é `--muted`; no `command` é `--border`.** Dois menus, dois
tokens.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel desmontado |
| Open | gatilho | painel montado; foco no painel, setas ativas |
| Item destacado | ponteiro ou setas | fundo accent a 20%, texto `--accent-foreground` |
| Item com foco visível | navegação por teclado | soma o anel interno (D2) |
| Item desabilitado | `data-disabled` | 50% de opacidade, sem eventos de ponteiro |
| Submenu aberto | seta direita, Enter ou Espaço no sub-gatilho, ou ponteiro | o sub-gatilho permanece destacado — a folha lê o nome de estado de cada lib (`data-popup-open` na base-ui e no radix-ng; `data-state="open"` na reka, no bits e no controlador de submenu do vanilla); sem o último, no Vue, no Svelte e no vanilla o destaque sumia quando o foco entrava no submenu (corrigido em 2026-09-10) |

## 7. API

| prop | tipo | padrão |
|---|---|---|
| `open` | boolean | — |
| `defaultOpen` | boolean | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `modal` | boolean | `true` |
| `side` | `top \| right \| bottom \| left` | `bottom` |
| `align` | `start \| center \| end` | `start` |

Repare no `align`: `start` aqui, `center` no popover e no tooltip. Menu alinha
pela borda do gatilho porque a lista se lê de cima para baixo, encostada.

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

**DropdownMenu**

| stack | peças |
|---|---|
| react | `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuTrigger` |
| vue | `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuPortal`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuTrigger` |
| svelte | `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuGroupHeading`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuPortal`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuTrigger` |
| vanilla | `createDropdownMenu` |
| angular | `a[ndsDropdownMenuLinkItem]`, `button[ndsDropdownMenuTrigger]`, `div[ndsDropdownMenuCheckboxItem]`, `div[ndsDropdownMenuGroup]`, `div[ndsDropdownMenuItem]`, `div[ndsDropdownMenuLabel]`, `div[ndsDropdownMenuRadioGroup]`, `div[ndsDropdownMenuRadioItem]`, `div[ndsDropdownMenuSeparator]`, `div[ndsDropdownMenuSubTrigger]`, `nds-dropdown-menu, nds-dropdown-menu-sub`, `ng-template[ndsDropdownMenuContent], ng-template[ndsDropdownMenuSubContent]`, `span[ndsDropdownMenuShortcut]`, `svg[ndsDropdownMenuIcon]` |

O índice do svelte também reexporta as formas curtas — `CheckboxItem`, `Content`, `Group`, `GroupHeading`, `Item`, `Label`, `Portal`, `RadioGroup`, `RadioItem`, `Root`, `Separator`, `Shortcut`, `Sub`, `SubContent`, `SubTrigger`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

**ContextMenu**

| stack | peças |
|---|---|
| react | `ContextMenu`, `ContextMenuCheckboxItem`, `ContextMenuContent`, `ContextMenuGroup`, `ContextMenuItem`, `ContextMenuLabel`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuTrigger` |
| vue | `ContextMenu`, `ContextMenuCheckboxItem`, `ContextMenuContent`, `ContextMenuGroup`, `ContextMenuItem`, `ContextMenuLabel`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuTrigger` |
| svelte | `ContextMenu`, `ContextMenuCheckboxItem`, `ContextMenuContent`, `ContextMenuGroup`, `ContextMenuGroupHeading`, `ContextMenuItem`, `ContextMenuLabel`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuTrigger` |
| vanilla | `createContextMenu` |
| angular | `div[ndsContextMenuCheckboxItem]`, `div[ndsContextMenuGroup]`, `div[ndsContextMenuItem]`, `div[ndsContextMenuLabel]`, `div[ndsContextMenuRadioGroup]`, `div[ndsContextMenuRadioItem]`, `div[ndsContextMenuSeparator]`, `div[ndsContextMenuSubTrigger]`, `div[ndsContextMenuSub]`, `div[ndsContextMenuTrigger]`, `div[ndsContextMenu]`, `ng-template[ndsContextMenuContent], ng-template[ndsContextMenuSubContent]`, `span[ndsContextMenuShortcut]` — e `svg[ndsContextMenuIcon]`, interno (o próprio código diz que não é API pública: é o ícone que os itens usam por dentro) |

O índice do svelte também reexporta as formas curtas — `CheckboxItem`, `Content`, `Group`, `GroupHeading`, `Item`, `Label`, `RadioGroup`, `RadioItem`, `Root`, `Separator`, `Shortcut`, `Sub`, `SubContent`, `SubTrigger`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No svelte, `ContextMenuGroupHeading` é desde 2026-09-10 um apelido de
`ContextMenuLabel`: mesmo markup, `data-slot="context-menu-label"`, e dentro de
um grupo o rótulo é o cabeçalho do bits, que escreve o id no `aria-labelledby`
do grupo. Continua exportado por ser API pública.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

Os três menus do Angular compartilham, desde 2026-09-10, peças INTERNAS em
`menu-popup-scope.ts` — `[ndsMenuPopupScope]` (entrega o injetor do popup ao
miolo em `ng-template` e trata o Tab do C2) e `NdsSubmenuKeyboardEntry` (leva o
foco para dentro do submenu pela seta direita). Não entram em nenhum `NDS_*` e
não são API: existem porque, sem elas, o submenu era inalcançável pelo teclado
nos três (PATCHES `#angular-dropdown-menu-submenu-entry`).

Este componente **não tem título de cabeçalho**, então não há seletor `h2[…]`
nem `h3[…]` aqui — a nota de nível de cabeçalho vale para dialog, sheet, drawer
e alert-dialog, que são os que nomeiam o painel com um cabeçalho.

## 8. Acessibilidade

**Papéis**: `menu` no painel; `menuitem`, `menuitemcheckbox` e `menuitemradio`
nos itens, conforme o tipo. O gatilho traz `aria-haspopup="menu"` e
`aria-expanded`.

**No ContextMenu, o C7 não vale para a área**: ela é uma região genérica que
recebe o clique direito (e a tecla de menu ou Shift+F10 quando focada), não um
botão que anuncia o menu — nas cinco stacks, por desenho. `aria-haspopup` e
`aria-expanded` aparecem no sub-gatilho, que é um item.

**Teclado**: setas andam, Home/End vão às pontas, letra é typeahead com
`preventDefault`, Enter e Espaço ativam, Escape fecha e devolve o foco, Tab fecha
e segue a página a partir do gatilho (C2).

**O que NÃO se faz, de propósito:**

- não se põe campo de texto nem conteúdo composto aqui — quebra o papel e o
  typeahead ao mesmo tempo;
- não se prende o foco: menu não é diálogo (D1);
- não se anima a saída, para não deixar focus-guard visível ao axe (D5).

**Movimento reduzido**: o painel para sob `prefers-reduced-motion`, e quem o
para é a camada de TOKEN — a folha declara duração só por `var(--duration-*)`, e
`docs/shared/tokens/motion.css` zera a escada inteira sob a preferência. O
mecanismo, incluindo por que o bloco `@media` da própria folha não é o que
segura, está por extenso em `hover-card.md` §8.

## 9. Analytics

Seis eventos, disparados pelas cinco stacks. Os três primeiros são do menu; os
três últimos são do ContextMenu, que mora aqui por D9.

| evento | quando | payload |
|---|---|---|
| `dropdown_menu_open` | o menu abre | `{ component: "dropdown-menu", label, location }` |
| `dropdown_menu_close` | o menu fecha | idem |
| `dropdown_menu_item_select` | item escolhido | `{ component: "dropdown-menu", label, menu, location }` |
| `context_menu_open` | o ContextMenu abre — clique direito, tecla de menu ou Shift+F10 | `{ component: "context-menu", menu, location }` |
| `context_menu_item_select` | item do ContextMenu escolhido | `{ component: "context-menu", label, menu, location }` |
| `context_menu_close` | o ContextMenu fecha | `{ component: "context-menu", menu, reason, location }` — `reason` é `escape`, `overlay` (clique fora ou Tab — saiu sem decidir) ou `api` (item escolhido; marcar e escolher rádio não fecham, C10); o tipo carrega as quatro palavras da família |

**`label` é o VALOR, nunca o rótulo visível** (D10). Na demonstração o item que
mostra "Configurações" emite `configuracoes`, e o menu inteiro se chama `acoes` —
é `label` no evento de item e `menu` no de contexto, os dois estáveis. Traduzido,
o mesmo item viraria três valores no GA4 e a série não juntaria.

**Os eventos do ContextMenu mudaram de nome em 2026-09-10, por decisão da dona.**
Eram `menu_open` e `menu_item_click` — outro vocabulário que o do irmão, com o
`component` dizendo `context-menu` e o evento de item sem `component` nenhum —, e
o fechamento não era medido. As duas assimetrias estavam registradas aqui desde
2026-09-09 como "observáveis e que ninguém decidiu"; agora a família fala uma
língua só no GA4, e a série `menu_*` para de crescer nessa data.

> **PENDÊNCIA · 2026-09-10** — o `dropdown_menu_close` não tem `reason`, e o
> `context_menu_close` tem. O portão `reason_vocabulario_divergente` aceita o
> zero (evento sem `reason` é coerente), então nada reprova — mas os dois irmãos
> passam a medir o fechamento de jeitos diferentes. É decisão da passagem do
> DropdownMenu, não desta.
> **Fecha quando**: o `dropdown_menu_close` tiver `reason` obrigatório no
> vocabulário da família nas cinco stacks, ou o PRD registrar por que não.

O **Menubar** não dispara nada. Ele veste esta folha por D9, e nenhum evento
`menubar_*` existe no tipo — ausência declarada, não esquecimento a preencher.

> **PENDÊNCIA · 2026-09-10** — o conteúdo do Menubar contradiz a ausência acima:
> `menubar/translations.json` → `analytics.description` promete
> `menubar_menu_open`, `menubar_item_select` e `menubar_shortcut_invoke`, com
> `label` = "texto do Item" (contra D10), a tabela de analytics das docs pages
> lista os três, e o snippet do Angular (`MenubarDocs.ts`, exibido ao leitor)
> ensina `track('menubar_menu_open', …)` — evento que não compila contra o tipo.
> `node scripts/audit.mjs menubar` acusa 15 `event_not_typed`. Medido pela
> pipeline do ContextMenu; é decisão da passagem do Menubar.
> **Fecha quando**: ou os eventos existirem tipados nas cinco, com `label`
> estável, e disparados pelas docs pages; ou o conteúdo, as tabelas e o snippet
> deixarem de prometê-los.

## 10. Reconstruir do zero

Ordem: folha → primitivo → itens (comum, seleção, sub-gatilho) → separador e
rótulo → stories → docs page.

- **O typeahead precisa de `preventDefault`**, senão a letra chega a quem estiver
  atrás do menu.
- **`tabindex` em TODO item, inclusive no desabilitado** — sem ele o `focus()`
  programático é no-op, e é assim que as setas andam no vanilla.
- **angular** — host binding de diretiva APAGA atributo estático do template:
  `data-slot` disputado se resolve na diretiva, não no ponto de uso. E
  `[attr.data-slot]` no template perde do mesmo jeito.
- **A saída não anima** (D5). Se a lib insistir, o sintoma é `aria-hidden-focus`
  no axe.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, estados, anel de foco, submenus | `docs/shared/styles/nds/dropdown-menu.css` |
| texto, props, critérios de teste | `docs/shared/content/dropdown-menu/translations.json` |
| desenho e anotações | Figma, página `DropdownMenu` (componente `684:377`) |
| portões determinísticos | `node scripts/audit.mjs dropdown-menu --json` |
