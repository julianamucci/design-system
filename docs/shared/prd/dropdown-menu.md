# PRD — DropdownMenu

> **Estado descrito**: 2026-09-07. **Revisão serial fechada em** 2026-09-07.
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
| C2 | **Não prende o foco**: Tab sai do menu e o fecha | `accessibility.keyboard.tab` |
| C3 | Setas cima/baixo andam; Home/End vão às pontas | `accessibility.items.item4` |
| C4 | Letra digitada move o foco para o item que começa com ela (typeahead), com `preventDefault` | `accessibility.keyboard.typeahead` |
| C5 | `Escape` fecha e devolve o foco ao gatilho; clique fora também fecha | `accessibility.items.item5` |
| C6 | Setas direita/esquerda abrem e fecham submenu | `accessibility.keyboard.arrows` |
| C7 | O gatilho declara `aria-haspopup="menu"` e `aria-expanded` | `accessibility.items.item1` |
| C8 | Papéis por tipo de item: `menuitem`, `menuitemcheckbox`, `menuitemradio` | `accessibility.items.item3` |
| C9 | O atalho exibido é só texto — a tecla real é registrada por quem consome | `accessibility.items.item6` |

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

### D3 · Texto secundário sobre item destacado é `--accent-foreground` a 85%

**Medição**: o accent é o laranja/teal da marca, não um quase-branco.
`--muted-foreground` sobre ele mede **2,64:1** — o axe reprovou no `command`, e o
defeito é o mesmo em todo segundo texto dentro de item destacado. **85% é o PISO
medido**: a 80% a razão cai para 4,34:1.

### D4 · O item destacado é `--accent` a 20%; no `command` é 10%

**Estado**: `[data-highlighted]` e `:focus` pintam o item com `--accent / 0.2`; a
variante destrutiva usa `--destructive / 0.1`.
**Contraste registrado**: o `command` usa 10% para o item selecionado. Mesmo
token, pesos diferentes, e as duas folhas dizem isso separadamente — não unifique
sem medir os dois casos.

### D5 · Menu fecha instantâneo, sem animação de saída

**Estado**: há keyframes de entrada e saída, mas manter o menu montado durante a
transição de fechamento deixa os focus-guards da lib visíveis para o axe
(`aria-hidden-focus`).
**O que vale**: menus fecham instantâneo, como no vanilla.

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
| Submenu aberto | seta direita ou ponteiro | o sub-gatilho permanece destacado |

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
| angular | `div[ndsContextMenuCheckboxItem]`, `div[ndsContextMenuGroup]`, `div[ndsContextMenuItem]`, `div[ndsContextMenuLabel]`, `div[ndsContextMenuRadioGroup]`, `div[ndsContextMenuRadioItem]`, `div[ndsContextMenuSeparator]`, `div[ndsContextMenuSubTrigger]`, `div[ndsContextMenuSub]`, `div[ndsContextMenuTrigger]`, `div[ndsContextMenu]`, `ng-template[ndsContextMenuContent], ng-template[ndsContextMenuSubContent]`, `span[ndsContextMenuShortcut]`, `svg[ndsContextMenuIcon]` |

O índice do svelte também reexporta as formas curtas — `CheckboxItem`, `Content`, `Group`, `GroupHeading`, `Item`, `Label`, `RadioGroup`, `RadioItem`, `Root`, `Separator`, `Shortcut`, `Sub`, `SubContent`, `SubTrigger`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo. Onde há dois seletores para a mesma peça
(`h2[...]` e `h3[...]`), os dois existem para a peça caber em níveis de
cabeçalho diferentes sem pular hierarquia.

## 8. Acessibilidade

**Papéis**: `menu` no painel; `menuitem`, `menuitemcheckbox` e `menuitemradio`
nos itens, conforme o tipo. O gatilho traz `aria-haspopup="menu"` e
`aria-expanded`.

**Teclado**: setas andam, Home/End vão às pontas, letra é typeahead com
`preventDefault`, Enter e Espaço ativam, Escape fecha e devolve o foco, Tab fecha
e segue a página (C2).

**O que NÃO se faz, de propósito:**

- não se põe campo de texto nem conteúdo composto aqui — quebra o papel e o
  typeahead ao mesmo tempo;
- não se prende o foco: menu não é diálogo (D1);
- não se anima a saída, para não deixar focus-guard visível ao axe (D5).

## 9. Analytics

Payload com valores estáveis, nunca texto localizado (D10).

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
