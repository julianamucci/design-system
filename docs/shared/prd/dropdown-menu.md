# PRD — DropdownMenu
<!-- prd-familia: context-menu menubar -->

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

| # | o contrato | o item de `testes.*` que o verifica, em cada membro |
|---|---|---|
| C1 | O painel recebe o foco ao abrir, e as setas alcançam os itens | dropdown-menu: functional.item1, functional.item2 · context-menu: functional.item16, functional.item4 · menubar: functional.item3, functional.item4, functional.item12 |
| C2 | **Não prende o foco**: Tab e Shift+Tab fecham o menu inteiro — também de dentro do submenu — e o foco vai ao próximo ponto de tabulação depois do GATILHO (Shift+Tab: ao anterior; no Menubar, da barra; no ContextMenu, da área); sem vizinho, volta ao gatilho | dropdown-menu: functional.item9 · context-menu: functional.item12 · menubar: functional.item13 |
| C3 | Setas cima/baixo andam; Home/End vão às pontas | dropdown-menu: functional.item2, functional.item10 · context-menu: functional.item4, functional.item13 · menubar: functional.item4, functional.item10 |
| C4 | Letra digitada move o foco para o item que começa com ela (typeahead), com `preventDefault` | dropdown-menu: functional.item11 · context-menu: functional.item14 · menubar: functional.item11 |
| C5 | `Escape` fecha e devolve o foco ao gatilho; dentro do submenu fecha só o submenu e devolve o foco ao sub-gatilho. Clique fora também fecha | dropdown-menu: functional.item4, functional.item12, functional.item13 · context-menu: functional.item2, functional.item3, functional.item6 · menubar: functional.item6, functional.item5, functional.item14 |
| C6 | Setas direita/esquerda abrem e fecham submenu | dropdown-menu: functional.item7, functional.item12 · context-menu: functional.item5, functional.item6 · menubar: functional.item5 |
| C7 | O gatilho declara `aria-haspopup="menu"` e `aria-expanded` | dropdown-menu: accessibility.item2 · context-menu: n/a (a área não é botão que anuncia o menu — §8; o sub-gatilho é o que declara, em accessibility.item10) · menubar: accessibility.item3 |
| C8 | Papéis por tipo de item: `menuitem`, `menuitemcheckbox`, `menuitemradio` | dropdown-menu: accessibility.item4 · context-menu: accessibility.item3, accessibility.item4, accessibility.item5 · menubar: accessibility.item5 |
| C9 | O atalho exibido é só texto — a tecla real é registrada por quem consome | dropdown-menu: functional.item14 · context-menu: functional.item17 · menubar: functional.item16 |
| C10 | Marcar um item de marcação ou escolher uma opção de rádio NÃO fecha o menu | dropdown-menu: functional.item5, functional.item6 · context-menu: functional.item7, functional.item8 · menubar: functional.item7, functional.item15 |

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
| sombra do painel | — | `--elevation-md` |
| sombra da BARRA do Menubar | — | `--elevation-xs` (desde 2026-09-12) |
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

**A barra do Menubar tem DOIS degraus de sombra em jogo, e eles não são o mesmo
assunto**: o painel que abre é flutuante (`md`), e a barra em si continua no
plano da página — relevo de controle, `xs`. Até 2026-09-12 a barra cravava
`0 1px 2px hsl(0 0% 0% / 0.05)` na folha em vez de ler token, e o efeito não era
estético: valor cravado não segue o MODO, então no escuro ela ficava em 0.05
onde a escada vai a 0.15 — sombra praticamente inexistente sobre fundo escuro.
Era uma de dezoito declarações assim nas folhas compartilhadas. Portão:
`sombra_cravada`, que reprova valor literal, e `elevacao_fora_do_mapa`, que
agora conhece o degrau de controle.

**A linha entrou na tabela de tokens das cinco docs pages do Menubar em
2026-09-12**, apontando `.nds-menubar` — e vale registrar por que ela faltava:
enquanto a sombra era valor cravado não havia token para listar, então a ausência
na tabela era coerente com a folha. Tokenizar criou a linha. O que cobra isso
agora é o `token_table_row_incoerente` pelo lado do CONTEÚDO compartilhado: a
metade das tabelas que guarda o seletor no `translations.json` era invisível ao
portão, que só lia o par token↔seletor quando os dois eram literais na página.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel fora da tela — desmontado na maioria das stacks; o bits mantém o nó (ver D5), e as plays contam menus abertos em vez de conferir o nó |
| Open | gatilho | painel montado; foco no painel, setas ativas |
| Item destacado | ponteiro ou setas | fundo accent a 20%, texto `--accent-foreground` |
| Item com foco visível | navegação por teclado | soma o anel interno (D2) |
| Item desabilitado | `data-disabled` nas libs, `aria-disabled="true"` no vanilla | 50% de opacidade, sem eventos de ponteiro; as setas continuam pousando nele |
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

No vue, o item de marcação não fala a mesma API nos três membros: o `DropdownMenuCheckboxItem` liga `v-model` (`modelValue`, o nome da reka 2), e o `ContextMenuCheckboxItem` e o `MenubarCheckboxItem` expõem `checked`/`update:checked`, que os wrappers declaram. É divergência de API de framework dentro de uma stack, registrada em 2026-09-11 e não alinhada: alinhar muda a API pública de dois componentes, e é decisão da dona.

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

Nove eventos, três por membro da família, **no mesmo formato** — e é o tipo das
cinco `analytics.ts` que o cobra: evento fora dele não compila.

| evento | quando | payload |
|---|---|---|
| `dropdown_menu_open` · `context_menu_open` · `menubar_open` | o menu abre (no ContextMenu: clique direito, tecla de menu ou Shift+F10; no Menubar: um menu da barra) | `{ component, menu, location }` |
| `dropdown_menu_close` · `context_menu_close` · `menubar_close` | o menu fecha | `{ component, menu, reason, location }` |
| `dropdown_menu_item_select` · `context_menu_item_select` · `menubar_item_select` | item escolhido — marcar e escolher rádio também, sem fechar (C10) | `{ component, menu, label, location }` |

- **`component`** é o slug em kebab: `dropdown-menu`, `context-menu`, `menubar`.
- **`menu`** é o id estável do menu, em inglês e kebab. Numa prévia de UM
  menu, o id da prévia — `demo` (ContextMenu), `pair1-do`, `pair1-dont`…, ou o
  nome do card em kebab (`with-checkbox-items`). Numa prévia de VÁRIOS menus, o
  id da prévia + `-` + a chave do rótulo do gatilho em kebab — as quatro células
  da demonstração do DropdownMenu (`demo-account` … `demo-file`) e toda barra
  de mais de um menu (`demo-file`, `pair1-do-edit`, `editor-complete-help`);
  barra de um menu só leva só o id da prévia (`with-shortcuts`). Nunca o texto
  do gatilho.
- **`label`** só existe na escolha de item: é a chave de
  `demonstration.labels.*` que nomeia o item, em kebab (`showGrid` →
  `show-grid`). A regra é mecânica de propósito — as cinco stacks chegam ao
  mesmo valor sem combinar entre si.
- **`reason`** é `escape`, `overlay` (clique fora, Tab, clique no gatilho
  aberto e, no Menubar, a passagem ao menu vizinho — saiu sem decidir) ou `api`
  (item escolhido que fecha, ou fechamento pelo código — "decisão de dentro",
  como no resto da categoria). `close-button` não ocorre — menu não tem
  controle de fechar —, e **o tipo declara três palavras**, não quatro: até
  2026-09-11 o React carregava a quarta, que nenhum caminho produzia, enquanto as
  outras declaravam três. Palavra sem comportamento atrás é a mesma dívida do
  comportamento sem palavra, do outro lado.
- **A tradução do motivo mora AO LADO DO PRIMITIVO, e é UMA para a família
  inteira** — `ui/menu-close-reason.ts` no react, no angular e no svelte, plano
  ao lado das três pastas de propósito, porque um arquivo por componente vira
  três cópias que divergem; no vanilla cada fábrica entrega `onClose(reason)` de
  primeira mão; no vue o motivo já vem do contexto do próprio wrapper
  (`ui/<menu>/<menu>.context.ts`), um por componente, que é a forma da stack.
  Até 2026-09-12 as docs pages do Svelte declaravam o vocabulário por conta
  própria, e uma delas numa união ANÔNIMA, que não tinha nome para ninguém
  procurar. Portão: `motivo_sintetizado_na_docs_page`.

  O que a mudança de casa pagou de imediato: a guarda de submenu usava
  `event.target instanceof Element`, que só existe no navegador — assim que a
  dedução passou a ter teste de unidade em node, ela quebrou com
  `ReferenceError`. Enquanto morava na página, esse trecho não tinha como ser
  exercitado fora do navegador.
- **`location`** é a seção da página onde a prévia está (`docs_demo`,
  `docs_variantes`, `docs_composicoes`, `docs_do_dont`) — toda prévia viva
  rastreia, e a seção vem do chamador.

**Os ids são em inglês, e o texto nunca entra** (D10). Traduzido, o mesmo item
viraria três valores no GA4, um por idioma, e a série não juntaria.

**Histórico — o que este formato substituiu, e por quê.**

- **2026-09-10, eventos do ContextMenu**: eram `menu_open` e `menu_item_click`,
  outro vocabulário que o do irmão, com o evento de item sem `component`, e o
  fechamento não era medido. A dona decidiu renomear para `context_menu_*`, e a
  série `menu_*` parou de crescer nessa data.
- **2026-09-11, o resto da família**, por decisão da dona:
  - o `dropdown_menu_open`/`_close` mandava o id do menu em `label`, e o
    `dropdown_menu_item_select` o mandava em `menu` — a mesma dimensão do GA4
    guardava o menu num evento e o item no outro. Passa a `menu`, e a série de
    `label` desses dois eventos para de crescer em 2026-09-11;
  - o `dropdown_menu_close` não tinha `reason`, e o portão aceitava a ausência
    (`reason_vocabulario_divergente` pulava o evento sem o campo). Agora a
    ausência reprova, salvo exceção declarada com premissa — hoje só o
    `hover_card_close`;
  - os ids eram em português no DropdownMenu (`acoes`, `configuracoes`) e em
    inglês no ContextMenu — e o vanilla dava ao item `value: 'settings'` e
    rastreava `configuracoes`. Passam a inglês, pela chave do rótulo;
  - Variantes e Do & Don't do DropdownMenu não rastreavam: os dois helpers de
    cada stack cravavam `docs_demo`, com um comentário dizendo que só a
    demonstração era atendida. O `location_so_da_demo` exigia três literais e
    a página tinha dois — a regra agora dispara com um, e a dívida do resto do
    repositório está declarada em
    `docs/shared/primitives/location-so-da-demo-divida.json`;
  - **destruir não é fechar**: a fábrica do vanilla destruída com o menu aberto
    mandava `*_close` com `api`, e toda troca de idioma de uma docs page com um
    menu aberto virava um fechamento falso. Hoje a destruição não avisa nada,
    nos três menus;
  - o **Menubar** não disparava nada, e o conteúdo prometia
    `menubar_menu_open`, `menubar_item_select` e `menubar_shortcut_invoke`, com
    o texto do item no payload. Passa a rastrear, no formato da família; o
    `menubar_shortcut_invoke` não existe — o atalho exibido é só texto (C9), e
    nada o registra.

As duas pendências abertas aqui em 2026-09-10 — o `reason` do DropdownMenu e os
eventos do Menubar — estavam endereçadas "à passagem do DropdownMenu" e "à
passagem do Menubar". Este PRD descreve os dois, e nenhuma dessas passagens
estava marcada: é o mecanismo que o `.claude/commands/pipeline.md` agora proíbe
("A família é a unidade").

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
