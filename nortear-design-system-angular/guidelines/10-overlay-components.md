# Overlay Components (Nortear — Angular)

---

## Regras Globais de Overlay

### O padrão de composição deste stack

Todo overlay segue a mesma forma, e ela é diferente das outras quatro stacks:

```
<orquestrador>                          (dono do estado; nds-* ou diretiva no host)
├── gatilho                             ← FICA na página
└── ng-template[…Content]               ← o painel, portalizado ao abrir
```

O painel vive num **`<ng-template>`**, não num elemento escrito na página. Isso não é preferência: o painel é instanciado dentro de um portal no corpo do documento e destruído ao fechar. Um elemento escrito pelo consumidor teria de ser teleportado para lá e devolvido no fechamento; um template é criado e destruído junto com o portal, sem nó órfão.

Duas consequências que valem para todos:

- **Em teste, o painel não está no canvas.** Procure no corpo do documento, e espere a animação assentar antes de afirmar — o painel entra com fade e zoom, e ler o primeiro frame produz uma falsa violação de contraste com razão perto de 1.0
- **Não há input de classe no painel** em vários deles: quem escreve não é dono daquele elemento. Classe extra no painel seria API nova, e enquanto não houver caso concreto o painel tem uma classe só, a do design system

### Tokens de fundo por tipo

| Tipo de overlay | Tokens | Componentes |
|---|---|---|
| Painel de conteúdo | `--card` / `--card-foreground` | Dialog, Alert Dialog, Sheet, Drawer |
| Menu e overlay flutuante | `--popover` / `--popover-foreground` | Dropdown Menu, Context Menu, Menubar, Popover, Hover Card, Tooltip, Select, Command |

### Comportamento de teclado

Vem do primitivo headless — **não reimplemente**:

- **Escape** fecha o overlay do topo da pilha
- **Foco circula** dentro de overlay modal, e volta ao gatilho ao fechar
- **Clique fora** fecha, exceto onde o perfil do componente desliga isso (Alert Dialog)
- Tooltip não fecha por clique; fecha por saída do ponteiro ou perda de foco

### Camadas

A ordem vem dos tokens `--z-dropdown`, `--z-modal-backdrop`, `--z-modal`, `--z-popover`, `--z-tooltip`, `--z-toast`. Não escrever número: a escada existe para que dois overlays nunca empatem.

### Uma âncora de foco que o axe acusa

O primitivo cerca o conteúdo portalizado com duas âncoras de foco de 1 pixel, escondidas do leitor e focáveis — é o que devolve o foco ao limite certo quando o Tab entra ou sai do portal. O axe lê `aria-hidden` mais focável como armadilha de foco, que é o **contrário** do que essas âncoras fazem.

Tirar o atributo escondido calaria o axe e faria o leitor anunciar dois elementos vazios em todo menu; tirar o tab stop desmontaria o mecanismo. A regra é desligada **só** nas stories que terminam com um overlay aberto, o que mantém as outras valendo. A correção é da biblioteca.

---

## Dialog

**Propósito**: painel modal para formulário, edição ou conteúdo que exige atenção exclusiva. Para decisão de sim/não, **Alert Dialog**.

**Peças**: `div[ndsDialog]`, `button[ndsDialogTrigger]`, `ng-template[ndsDialogPortal]`, `div[ndsDialogOverlay]`, `div[ndsDialogContent]`, `div[ndsDialogHeader]`, `h2|h3[ndsDialogTitle]`, `p[ndsDialogDescription]`, `div[ndsDialogBody]`, `div[ndsDialogFooter]`, `button[ndsDialogClose]`.

**Estrutura**:

```
div[ndsDialog]
├── button[ndsDialogTrigger]
└── ng-template[ndsDialogPortal]
    ├── div[ndsDialogOverlay]
    └── div[ndsDialogContent]              (role="dialog", modal)
        ├── div[ndsDialogHeader]
        │   ├── h2|h3[ndsDialogTitle]
        │   └── p[ndsDialogDescription]
        ├── div[ndsDialogBody]
        └── div[ndsDialogFooter]
            ├── button[ndsDialogClose]
            └── botão primário
```

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsDialog` (host) | aberto, aberto inicial, modal, dispensa por ponteiro | do primitivo | Estado e perfil |
| `ndsDialogContent` | `showCloseButton` | `true` | Botão de fechar no canto |
| `ndsDialogContent` | `closeLabel` | `Fechar` | Nome acessível do botão de fechar |
| `ndsDialogContent` | `scroll` | `false` | O corpo rola em vez de a página |
| `ndsDialogFooter` | `showCloseButton` | `false` | Botão de fechar no rodapé |

**Regras**:
- `modal` fica exposto porque é ele que decide se há trava de rolagem e inércia no resto da página
- Desligar a dispensa por ponteiro é o que separa este Dialog de um Alert Dialog **sem trocar de componente** — mas se a decisão é obrigatória, o componente certo é o outro
- Título e descrição são obrigatórios
- `scroll` no conteúdo quando o corpo é longo: sem ele o painel cresce além da tela e o rodapé sai de alcance
- Não aninhar Dialog em Dialog — fluxo sequencial
- **`disabled` é exposto no gatilho**, ao contrário do Collapsible, e a razão é concreta: `ndsDialogTrigger` e o primitivo que vem com `ndsButton` ligam **os dois** o atributo no host. Se só um recebesse o valor, o outro escreveria vazio e apagaria o atributo que o primeiro acabou de pôr, sem erro, dependendo da ordem em que as diretivas casaram
- **`ndsDialogClose` composto com `ndsButton` é caso conhecido de disputa de `data-slot`** — a saída aqui foi o `ndsDialogClose` não ligar o atributo. Ver `RULES.md` §8

**Acessibilidade**:
- Papel de diálogo com modal, nome pelo título, descrição pela descrição
- Foco entra no painel e volta ao gatilho ao fechar; o resto da página fica inerte
- Botão de fechar com nome acessível — um "X" sem nome não é botão

**Analytics**: `dialog_open` e `dialog_close`, com a origem do fechamento em valor estável.

---

## Sheet

**Propósito**: painel que entra por uma borda da tela, para conteúdo secundário sem tirar o contexto da página.

**Peças**: `nds-sheet`, `button[ndsSheetTrigger]`, `ng-template[ndsSheetContent]`, `div[ndsSheetHeader]`, `h2|h3[ndsSheetTitle]`, `p[ndsSheetDescription]`, `div[ndsSheetBody]`, `div[ndsSheetFooter]`, `button[ndsSheetClose]`.

**Estrutura**:

```
nds-sheet
├── button[ndsSheetTrigger]
└── ng-template[ndsSheetContent]
    ├── fundo escurecido
    └── painel                        (encostado no lado escolhido)
        ├── div[ndsSheetHeader]
        │   ├── h2|h3[ndsSheetTitle]
        │   └── p[ndsSheetDescription]
        ├── div[ndsSheetBody]
        └── div[ndsSheetFooter]
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `side` | `right` | `top`, `right`, `bottom`, `left` |
| `showCloseButton` | `true` | Botão de fechar no canto |
| `closeLabel` | `Fechar` | Nome acessível do botão de fechar |
| `panelClass` | `''` | Classe extra no painel (largura, por exemplo) |

**Regras**:
- Lado lateral para conteúdo em coluna; lado inferior para conteúdo curto em tela estreita
- Título e descrição obrigatórios — é painel modal
- `panelClass` existe para dimensão, não para recolorir: o fundo é o token de painel de conteúdo
- Um Sheet por vez

**Acessibilidade**: mesmo contrato do Dialog — nome, descrição, foco que entra e volta, resto da página inerte.

---

## Drawer

**Propósito**: painel arrastável que entra por uma borda, com alça de arraste. É a variante gestual do Sheet.

**Peças**: `nds-drawer`, `button[ndsDrawerTrigger]`, `ng-template[ndsDrawerContent]`, `div[ndsDrawerHeader]`, `h2|h3[ndsDrawerTitle]`, `p[ndsDrawerDescription]`, `div[ndsDrawerBody]`, `div[ndsDrawerFooter]`, `button[ndsDrawerClose]`.

**Estrutura**:

```
nds-drawer
├── button[ndsDrawerTrigger]
└── ng-template[ndsDrawerContent]
    ├── fundo escurecido
    └── painel
        ├── alça de arraste
        ├── div[ndsDrawerHeader]
        ├── div[ndsDrawerBody]
        └── div[ndsDrawerFooter]
```

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `nds-drawer` | `direction` | `bottom` | `bottom`, `top`, `left`, `right` |
| `ndsDrawerContent` | `panelClass` | `''` | Classe extra no painel |

**Regras**:
- A direção se chama `direction`, não `side` — o Sheet usa `side`. São componentes diferentes e a divergência é intencional: o Drawer se move num eixo, o Sheet encosta num lado
- Arrastar é **atalho**, não a única via de fechar: o botão de fechar e o Escape continuam obrigatórios
- Direção inferior é o caso típico em tela estreita

**Acessibilidade**:
- Mesmo contrato do Dialog
- A alça é decorativa: quem navega por teclado usa o botão de fechar e o Escape. Alça como único mecanismo de fechamento reprova WCAG 2.1.1

---

## Dropdown Menu

**Propósito**: menu de ações disparado por um botão. Para escolher um valor de uma lista, **Select**.

**Peças**: `nds-dropdown-menu` e `nds-dropdown-menu-sub`, `button[ndsDropdownMenuTrigger]`, `ng-template[ndsDropdownMenuContent]` e `[ndsDropdownMenuSubContent]`, `div[ndsDropdownMenuItem]`, `a[ndsDropdownMenuLinkItem]`, `div[ndsDropdownMenuCheckboxItem]`, `div[ndsDropdownMenuRadioGroup]`, `div[ndsDropdownMenuRadioItem]`, `div[ndsDropdownMenuSubTrigger]`, `div[ndsDropdownMenuGroup]`, `div[ndsDropdownMenuLabel]`, `div[ndsDropdownMenuSeparator]`, `span[ndsDropdownMenuShortcut]`, `svg[ndsDropdownMenuIcon]`.

**Estrutura**:

```
nds-dropdown-menu
├── button[ndsDropdownMenuTrigger]           (aria-expanded, aria-haspopup)
└── ng-template[ndsDropdownMenuContent]      ← portalizado
    ├── div[ndsDropdownMenuLabel]
    ├── div[ndsDropdownMenuGroup]
    │   ├── div[ndsDropdownMenuItem]
    │   │   └── span[ndsDropdownMenuShortcut]
    │   └── a[ndsDropdownMenuLinkItem]
    ├── div[ndsDropdownMenuSeparator]
    ├── div[ndsDropdownMenuCheckboxItem]
    ├── div[ndsDropdownMenuRadioGroup]
    │   └── div[ndsDropdownMenuRadioItem]
    └── nds-dropdown-menu-sub
        ├── div[ndsDropdownMenuSubTrigger]
        └── ng-template[ndsDropdownMenuSubContent]
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `side`, `align`, `sideOffset`, `alignOffset` | do primitivo | Posicionamento do painel |
| `variant` (item) | `default` | `default` ou destrutivo |
| `inset` | `false` | Recua o item para alinhar com a calha de ícone dos irmãos |

**Regras**:
- **Item que navega é `a[ndsDropdownMenuLinkItem]`**, com `href` de verdade: item que navega sem ser link perde Ctrl+clique, "abrir em nova aba" e o menu de contexto do navegador
- `inset` é alinhamento óptico, para menu em que só alguns itens têm ícone ou marca
- Atalho é **rótulo**: exibir a combinação não registra o atalho
- Item destrutivo carrega a cor semântica e continua precisando de texto que diga o que faz
- Separador é decorativo

**Acessibilidade**:
- Gatilho reflete o estado de expansão
- Setas navegam, Enter executa, Escape fecha e devolve o foco ao gatilho
- Item de marcação anuncia o estado; grupo de opção exclusiva anuncia a escolhida
- Submenu abre ao lado, e a seta para a direita entra nele

**Analytics**: `menu_item_click` com identificador estável do item.

---

## Context Menu

**Propósito**: menu de ações no botão direito, sobre uma região da página.

**Peças**: `div[ndsContextMenu]`, `div[ndsContextMenuTrigger]`, `ng-template[ndsContextMenuContent]` e `[ndsContextMenuSubContent]`, `div[ndsContextMenuSub]`, mais as mesmas peças de item, marcação, opção exclusiva, grupo, rótulo, separador, atalho e ícone do Dropdown Menu.

**Estrutura**:

```
div[ndsContextMenu]
├── div[ndsContextMenuTrigger]           ← a região que responde ao botão direito
└── ng-template[ndsContextMenuContent]   ← portalizado na posição do ponteiro
    └── (mesma anatomia de itens do Dropdown Menu)
```

**Entradas**: posicionamento e as mesmas entradas de item do Dropdown Menu.

**Regras**:
- **Nunca é a única via de uma ação.** Menu de contexto não existe em toque, e não é descobrível — toda ação dele precisa de um caminho alternativo visível
- A região do gatilho tem de ser visualmente reconhecível como alvo
- Não substituir o menu do navegador em página de conteúdo: use onde a ação faz sentido para o objeto sob o ponteiro

**Acessibilidade**:
- Precisa abrir também por teclado (tecla de menu de contexto, ou Shift+F10)
- Fora isso, o contrato é o do Dropdown Menu

---

## Popover

**Propósito**: painel flutuante com conteúdo **interativo** ancorado a um gatilho. Para texto curto e passivo, Tooltip.

**Peças**: `div[ndsPopover]`, `button[ndsPopoverTrigger]`, `ng-template[ndsPopoverContent]`, `div[ndsPopoverHeader]`, `[ndsPopoverTitle]`, `[ndsPopoverDescription]`, `button[ndsPopoverClose]`.

**Estrutura**:

```
div[ndsPopover]
├── button[ndsPopoverTrigger]            (aria-expanded)
└── ng-template[ndsPopoverContent]       ← portalizado
    ├── div[ndsPopoverHeader]
    │   ├── [ndsPopoverTitle]
    │   └── [ndsPopoverDescription]
    ├── conteúdo interativo
    └── button[ndsPopoverClose]
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `side` | `bottom` | Lado preferido |
| `align` | `center` | Alinhamento no eixo do lado |
| `sideOffset` | `4` | Distância do gatilho |
| `alignOffset` | `0` | Deslocamento no eixo do alinhamento |

**Regras**:
- Abre por **clique**, não por hover: conteúdo interativo aberto por hover é inalcançável em toque
- É o componente preferido em relação a Tooltip e Hover Card quando há uso em celular
- Não é modal por padrão — a página continua utilizável atrás
- Conteúdo longo pede Dialog ou Sheet

**Acessibilidade**:
- Gatilho reflete o estado de expansão
- Foco entra no painel; Escape fecha e devolve o foco ao gatilho
- Título rotula o painel

---

## Hover Card

**Propósito**: prévia de conteúdo ao pousar o ponteiro sobre um link — cartão de perfil, resumo de registro.

**Peças**: `div` com gatilho e `ng-template[ndsHoverCardContent]`.

**Estrutura**:

```
(orquestrador)
├── a[ndsHoverCardTrigger]               ← geralmente um link
└── ng-template[ndsHoverCardContent]     ← portalizado
    └── conteúdo de prévia
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `side` | `bottom` | Lado preferido |
| `align` | `center` | Alinhamento |
| `sideOffset` | `8` | Distância do gatilho |
| `alignOffset` | `0` | Deslocamento |
| `label` | `''` | Nome acessível do cartão |
| `contentClass` | `''` | Classe extra no cartão |

**Regras**:
- **Nunca carrega informação exclusiva.** O cartão não abre em toque nem por teclado de forma confiável: tudo que está nele tem de existir no destino do link
- O gatilho é um link de verdade — a prévia é enfeite do link, não substituto dele
- Conteúdo de prévia é curto. Prévia que precisa rolar é a página errada
- Em uso mobile, prefira Popover

**Acessibilidade**:
- O cartão é rotulado, para não ser uma região anônima
- Mesmo aberto, o caminho principal é o link — o cartão não pode conter a única cópia de um controle

---

## Tooltip

**Propósito**: descrição curta de um controle, mostrada no hover e no foco. Para conteúdo interativo, Popover.

**Peças**: `[ndsTooltipProvider]`, `[ndsTooltip]`, `button[ndsTooltipTrigger]`, `ng-template[ndsTooltipContent]`.

**Estrutura**:

```
[ndsTooltipProvider]                     ← no elemento raiz que contém tooltips
└── [ndsTooltip]
    ├── button[ndsTooltipTrigger]
    └── ng-template[ndsTooltipContent]   ← balão portalizado (role="tooltip")
```

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsTooltipProvider` | atraso de abrir, de fechar, e janela de abertura instantânea | do primitivo | Comportamento do grupo |
| `ndsTooltipContent` | `side` | `top` | Lado preferido |
| `ndsTooltipContent` | `align` | `center` | Alinhamento |
| `ndsTooltipContent` | `sideOffset` | `4` | Distância do gatilho |

**Regras**:
- O provider é **de grupo**, e é o que faz uma barra de ferramentas parecer uma coisa só: depois que um tooltip do grupo abriu, os vizinhos abrem sem esperar de novo, em vez de seis esperas independentes
- **O gatilho é `<button>`**, por seletor. Um `<span>` com tooltip é exatamente o caso que o componente não deve facilitar: o balão precisa aparecer no **foco**, e só elemento focável tem foco (WCAG 2.1.1)
- Não pode conter conteúdo interativo — botão ou link dentro do balão é inalcançável
- Texto curto: o tooltip **complementa** o rótulo visível, não o repete
- **Divergência de API registrada**: não há input de classe no balão, ao contrário do que o conteúdo compartilhado descreve. Quem escreve não é dono do elemento do balão
- **Divergência de API registrada**: `disabled` do primitivo de gatilho não é exposto. Quando o gatilho é um botão do design system, o `[disabled]` escrito no elemento já é o do botão — e botão nativamente desabilitado não recebe foco nem evento de ponteiro, então o tooltip não abre de qualquer forma. Duas diretivas disputando o mesmo nome de input só duplicariam o mecanismo
- **`ndsTooltipTrigger` composto com `ndsSidebarMenuButton` é caso conhecido de disputa de `data-slot`** — em teste, procure pela classe

**Acessibilidade**:
- Papel de tooltip com id único; o gatilho aponta para ele como **descrição**, não como rótulo — tooltip descreve, não nomeia
- Visível no foco, não só no hover
- Dispensável pelo Escape e permanente enquanto o ponteiro está sobre ele (WCAG 1.4.13)

---

## Command

**Propósito**: paleta de comandos com busca — a lista filtrável de ações e destinos. Composto com Dialog ou Popover para virar a paleta que abre por atalho.

**Peças**: `nds-command`, `input[ndsCommandInput]`, `div[ndsCommandList]`, `div[ndsCommandEmpty]`, `div[ndsCommandGroup]`, `div[ndsCommandItem]`, `span[ndsCommandShortcut]`, `div[ndsCommandSeparator]`.

**Estrutura**:

```
nds-command
├── input[ndsCommandInput]              (role="combobox", aria-expanded)
├── div[ndsCommandList]                 (role="listbox")
│   ├── div[ndsCommandEmpty]            (quando o filtro não casa)
│   ├── div[ndsCommandGroup]            (heading do grupo)
│   │   └── div[ndsCommandItem]         (role="option")
│   │       └── span[ndsCommandShortcut]
│   └── div[ndsCommandSeparator]
```

**Entradas**:

| Peça | Nome | Função |
|---|---|---|
| `ndsCommandInput` | `label` | Nome acessível do campo de busca |
| `ndsCommandList` | `label` | Nome acessível da lista |
| `ndsCommandGroup` | `heading` | Título do grupo |
| `ndsCommandItem` | `checked` | Marca o item, quando faz sentido |

**Saídas**: seleção de item, no componente raiz e no item.

**Regras**:
- **Estado vazio é obrigatório**: filtro que não casa e lista que fica em branco parece defeito. A frase diz o que fazer em seguida
- Grupo precisa de título — lista longa sem grupo é ilegível
- Atalho é rótulo, como nos menus
- A busca casa pelo **texto visível** do item; item cujo rótulo não contém a palavra que a pessoa digitaria é item que não será encontrado
- Composto com Popover quando é seleção com busca (é a resposta para "Select com busca"); composto com Dialog quando é paleta global

**Acessibilidade**:
- O campo é combobox e a lista é listbox, com o item ativo apontado pelo campo
- Setas navegam sem tirar o foco do campo, Enter executa, Escape fecha
- Campo e lista têm nome acessível próprio
- O item ativo é distinguível sem depender de cor
