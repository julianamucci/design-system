# Overlay Components

---

## Regras Globais de Overlay

### Tokens de fundo por tipo de overlay

Não existe utilitária de cor de superfície: quem lê o token é a folha de cada overlay. A tabela diz qual token vale e qual seletor o aplica.

| Tipo de overlay | Tokens | Quem aplica |
|-----------------|--------|-------------|
| Painel de conteúdo (modal, lateral) | `--card` / `--card-foreground` | `.nds-dialog-content` · `.nds-sheet-content` · `.nds-drawer-content` |
| Menu e overlay flutuante | `--popover` / `--popover-foreground` | `.nds-dropdown-menu-content` (também é o painel do ContextMenu) · `.nds-popover-content` · `.nds-hover-card-content` · `.nds-command` · `.nds-tooltip-content` |
| Fundo escurecido atrás do modal | opacidade sobre preto, definida na folha | `.nds-dialog-overlay` |

> Pintar a superfície por fora quebra a coerência do tema, e o modo escuro é onde isso aparece primeiro. A cor entra pela classe do componente — nunca por uma classe de fundo avulsa, nem por um valor cravado no estilo.

### Padding consistente entre header, content e footer

O respiro interno de cada painel é da folha do próprio overlay, e sai da escada de espaçamento do tema (`--spacing-*`) — não de uma classe de padding aplicada por fora, que sairia do passo quando a densidade mudasse.

Esta seção já prescreveu um par de tokens de overlay (`--overlay-padding` e `--overlay-padding-sm`) como obrigatórios, com valores fixos e origem no `globals.css`. **Nenhum dos dois existe** — não há uma única declaração deles no repositório, e nunca houve seletor que os lesse. A regra que sobra é a de fato: alinhamento entre cabeçalho, corpo e rodapé se obtém deixando o respiro na folha, e conferindo que o corpo não reintroduza recuo próprio.

### Comportamento de teclado — todos os overlays

| Tecla | Ação |
|-------|------|
| `Escape` | Fecha o overlay e retorna foco ao trigger |
| `Tab` / `Shift+Tab` | Navega entre elementos focáveis (focus trap em Dialog, Sheet, Drawer) |
| `Enter` / `Space` | Ativa o item focado |
| `Arrow Down/Up` | Navega entre itens de menu (DropdownMenu, ContextMenu, Command) |

Comportamentos gerenciados automaticamente pelo Reka UI ou Vaul — não reimplementar.

---

## Alert Dialog

**Propósito**: modal de confirmação que interrompe o fluxo para obter resposta explícita antes de ações críticas ou irreversíveis. Diferencia-se do `Dialog` por não ter botão X — exige confirmação ou cancelamento explícitos.

**Quando usar**: excluir conta, cancelar assinatura, encerrar sessão, remover dados permanentemente. Para workflows com formulário ou edição, usar `Dialog`.

**API e exemplos**: `src/components/ui/alert-dialog/alert-dialog.vue` + stories + `AlertDialogDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão — AlertDialog vs Dialog**:

| Situação | Componente |
|----------|------------|
| Confirmação de ação destrutiva / irreversível | AlertDialog |
| Formulário, edição, criação, visualização | Dialog |
| Informação que o usuário precisa confirmar ter lido | AlertDialog |

**Estrutura de subcomponentes**:

```
AlertDialog
├── AlertDialogTrigger (as-child obrigatório)
└── AlertDialogContent
    ├── AlertDialogHeader
    │   ├── AlertDialogTitle       (obrigatório)
    │   └── AlertDialogDescription (opcional, recomendado)
    └── AlertDialogFooter
        ├── AlertDialogCancel
        └── AlertDialogAction
```

**Regras**:
- `AlertDialogTrigger as-child` obrigatório
- **Consistência visual trigger → action**: trigger `destructive` → `AlertDialogAction` `destructive`. Aplicar a variante diretamente no `AlertDialogAction` — ele tem estilo próprio que pode sobrescrever o Button filho
- `AlertDialogCancel` antes do `AlertDialogAction` no DOM — confirmação sempre à direita
- Não usar para confirmações reversíveis — reservar para ações de alto impacto

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- Focus trap e retorno de foco ao trigger automáticos
- `AlertDialogTitle` obrigatório — base do `aria-labelledby`. `AlertDialogDescription` é opcional e recomendado: quando existe alimenta o `aria-describedby`, e quando não existe o painel omite o atributo. O primitivo desta stack gera o id da descrição sozinho e ligaria o atributo mesmo sem descrição — o wrapper do design system corta isso, porque referência para id ausente reprova no axe e não anuncia nada
- `aria-label` contextual no `AlertDialogAction` quando o texto do botão sozinho não tem contexto suficiente

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Título: frase nominal que nomeia a ação — "Excluir conta", "Cancelar assinatura"
- Descrição: consequência em frase completa — "Esta ação não pode ser desfeita."
- `AlertDialogAction`: repete o verbo do título — "Excluir"
- `AlertDialogCancel`: sempre "Cancelar"

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):

| Evento | Quando | Payload |
|--------|--------|---------|
| `dialog_open` | Abertura | `label` (título) |
| `dialog_confirm` | Clique em `AlertDialogAction` | `label` |
| `dialog_close` | Cancelar ou fechar | `label`, `trigger` ("cancel_button", "backdrop") |

---

## Command

**Propósito**: interface de busca e seleção rápida de comandos, ações ou itens com filtro fuzzy integrado.

**API e exemplos**: `src/components/ui/command/command.vue` + stories + `CommandDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Dois padrões de uso**:

| Padrão | Uso |
|--------|-----|
| **Inline** | Renderizado diretamente na página — busca local sobre uma lista de ações |
| **Dialog (Command Palette)** | Ativado por atalho de teclado — acesso rápido a ações globais |

Para escolher um valor de formulário com busca, o componente é o `Combobox` (`06-form-components.md`) — não esta paleta.

**Estrutura de subcomponentes**:

```
Command
├── CommandInput       (campo de busca com filtro fuzzy automático)
├── CommandList        (container com scroll)
│   ├── CommandEmpty   (exibido quando nenhum resultado)
│   ├── CommandGroup (heading)
│   │   └── CommandItem (value, onSelect)
│   ├── CommandSeparator
│   └── CommandGroup
│       └── CommandItem
└── CommandShortcut    (atalho visual dentro de um CommandItem)
```

**Regras**:
- `CommandEmpty` obrigatório — sem ele, resultado vazio fica em branco
- `CommandGroup` com `heading` para organizar ações relacionadas — sem heading quando há apenas um grupo
- Preferência: menu simples sem ícones, salvo instrução específica
- Sempre fechar o Dialog/Popover após `onSelect` (`setOpen(false)`)
- Dica visual do atalho (`<kbd>Ctrl+K</kbd>`) obrigatória quando usar Command Palette — o usuário precisa descobrir o atalho
- Atalho global (Cmd+K) **não é nativo** do componente — requer listener manual no `mounted`/`onMounted`

- **Não é escolha de valor**: lista de opções de formulário com busca é `Combobox`, que tem campo, chips, estado vazio e serialização próprios. Command é para executar ação, não para preencher campo

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- Filtro fuzzy e navegação por Arrow keys nativos do componente
- `CommandShortcut` é apenas visual — a lógica do atalho deve ser implementada via listener global
- O papel de combobox fica no CAMPO DE BUSCA, ligado à lista real, com a opção ativa apontada por `aria-activedescendant` — o foco não sai do campo

---

## Context Menu

**Propósito**: menu de ações contextuais ativado por clique direito (right-click) sobre uma área específica.

**Quando usar**: ações que fazem sentido no contexto de um elemento específico — arquivo, linha de tabela, item de canvas. **Nunca como único ponto de acesso a funcionalidades** — right-click não é descobrível em touch e não é óbvio para todos os usuários.

**API e exemplos**: `src/components/ui/context-menu/context-menu.vue` + stories + `ContextMenuDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
ContextMenu
├── ContextMenuTrigger   (área de right-click)
└── ContextMenuContent
    ├── ContextMenuGroup
    │   ├── ContextMenuLabel
    │   └── ContextMenuItem
    ├── ContextMenuSeparator
    ├── ContextMenuCheckboxItem
    ├── ContextMenuRadioGroup
    │   └── ContextMenuRadioItem
    └── ContextMenuSub
        ├── ContextMenuSubTrigger
        └── ContextMenuSubContent
            └── ContextMenuItem
```

**Regras**:
- Evitar submenus — aumentam a carga cognitiva e dificultam navegação por teclado
- Item destrutivo: `data-variant="destructive"` no item. A folha `.nds-dropdown-menu-item[data-variant="destructive"]` pinta texto e ícone e mantém a cor no estado destacado — não pintar o item por fora
- Sempre oferecer alternativa explícita (botão, ícone de ação) para as mesmas ações do menu
- `ContextMenuShortcut` é apenas visual — implementar o atalho via listener global

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):

> **Aviso crítico**: ContextMenu ativado por right-click é inacessível em touch devices e não é descobrível por usuários que navegam apenas por teclado. **Toda ação disponível no ContextMenu deve ter uma alternativa acessível** — botão visível, ícone de ação na linha ou DropdownMenu.

---

## Dialog

**Propósito**: overlay modal para workflows que exigem atenção focada — formulários, confirmações, visualizações de conteúdo.

**Quando usar**: edição de dados em formulário, criação de item, visualização de detalhes. Para confirmação de ações destrutivas, usar `AlertDialog`. Para painéis laterais, usar `Sheet`. Para mobile, considerar `Drawer`.

**API e exemplos**: `src/components/ui/dialog/dialog.vue` + stories + `DialogDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão — Dialog vs AlertDialog vs Sheet vs Drawer**:

| Situação | Componente |
|----------|------------|
| Formulário, edição, criação | Dialog |
| Confirmação de ação destrutiva | AlertDialog |
| Painel lateral persistente (configurações, filtros) | Sheet |
| Mobile — ação rápida ou formulário | Drawer |

**Estrutura de subcomponentes**:

```
Dialog (open, onOpenChange)
├── DialogTrigger (as-child obrigatório)
└── DialogContent
    ├── DialogHeader
    │   ├── DialogTitle       (obrigatório para acessibilidade)
    │   └── DialogDescription (obrigatório para acessibilidade)
    ├── [conteúdo principal]
    └── DialogFooter
        ├── Button (variant="outline") — Cancelar
        └── Button (variant="default") — Ação primária
```

**Regras**:
- `DialogTrigger as-child` obrigatório — evita renderizar um `<button>` extra dentro do trigger
- `DialogTitle` e `DialogDescription` obrigatórios — sem eles o Reka emite warning e leitores de tela não têm contexto
- Teto de largura pela escada do sistema: `.nds-max-w-lg` no conteúdo. Sem teto, o modal estica com a janela e a linha de texto passa do confortável
- Botão de fechar nativo (X) sempre visível — não remover salvo instrução específica
- Rolagem interna: `.nds-dialog-body-scroll` no CORPO do modal — nunca no `DialogContent` inteiro, que levaria cabeçalho e rodapé junto. A folha define o teto de altura e o respiro para a barra não encostar no texto

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- Focus trap automático — ao abrir, foco vai para o primeiro elemento focável
- Ao fechar, foco retorna ao `DialogTrigger` automaticamente
- `Escape` fecha o Dialog — comportamento nativo, não sobrescrever
- `aria-labelledby` e `aria-describedby` aplicados automaticamente via `DialogTitle` e `DialogDescription`

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- `DialogTitle`: frase nominal que nomeia a ação — "Editar perfil", "Adicionar item"
- `DialogDescription`: contexto ou instrução, frase completa com ponto — "Atualize suas informações. Clique em salvar ao terminar."
- Botão primário: repete o verbo do título — "Editar" → "Salvar edições" ou simplesmente "Salvar"
- Botão secundário: sempre "Cancelar"

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):

| Evento | Quando | Payload |
|--------|--------|---------|
| `dialog_open` | Abertura | `label` |
| `dialog_close` | Fechamento | `label`, `trigger` ("close_button", "backdrop", "escape") |

---

## Drawer

**Propósito**: painel deslizante com suporte a gesture de arrastar, construído sobre a biblioteca **Vaul**. Otimizado para mobile.

**Quando usar**: formulários rápidos em mobile, filtros, ações contextuais em telas pequenas. Para desktop, usar `Sheet`.

**API e exemplos**: `src/components/ui/drawer/drawer.vue` + stories + `DrawerDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

> Usa **Vaul** (não Reka). A prop de direção é `direction` no `Drawer` — diferente do `Sheet`, que usa `side` no `SheetContent`.

**Critério de decisão — Drawer vs Sheet**:

| Aspecto | Drawer | Sheet |
|---------|--------|-------|
| Base técnica | Vaul | Reka Dialog |
| Gesture de arrastar | Sim (bottom) | Não |
| Handle visual | Automático (bottom) | Não |
| Melhor para | Mobile | Desktop |
| Prop de direção | `direction` no `Drawer` | `side` no `SheetContent` |

**Estrutura de subcomponentes**:

```
Drawer (direction)
├── DrawerTrigger (as-child)
└── DrawerContent
    ├── DrawerHeader
    │   ├── DrawerTitle       (obrigatório)
    │   └── DrawerDescription (obrigatório)
    ├── [conteúdo principal]
    └── DrawerFooter
        ├── Button            — ação primária
        └── DrawerClose
            └── Button (variant="outline") — Cancelar
```

**Props relevantes**:

| Prop | Default | Função |
|------|---------|--------|
| `direction` | `bottom` | `bottom` (com handle e gesture) · `top` · `right` · `left` |

**Regras**:
- `direction` na prop do `Drawer` (não no `DrawerContent`)
- Handle de arrastar: automático apenas em `direction="bottom"` — não aparece em outras direções
- `DrawerTitle` e `DrawerDescription` obrigatórios para acessibilidade
- Botões alinhados à direita no rodapé: `.nds-cluster` com `data-justify="end"`. A ordem no DOM segue a ordem visual — `[secundário] [primário]`, confirmação à direita
- `DrawerClose` envolve o botão de cancelar para fechar o Drawer automaticamente

---

## Dropdown Menu

**Propósito**: lista de ações ativada por clique em um trigger explícito.

**Quando usar**: ações de linha em tabelas, menu de usuário, ações secundárias em cards. Para lista de opções de formulário, usar `Select`; com busca, `Combobox`.

**API e exemplos**: `src/components/ui/dropdown-menu/dropdown-menu.vue` + stories + `DropdownMenuDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
DropdownMenu
├── DropdownMenuTrigger (as-child obrigatório)
└── DropdownMenuContent (align)
    ├── DropdownMenuLabel
    ├── DropdownMenuGroup
    │   └── DropdownMenuItem (onSelect)
    │       └── DropdownMenuShortcut
    ├── DropdownMenuSeparator
    ├── DropdownMenuCheckboxItem
    └── DropdownMenuRadioGroup
        └── DropdownMenuRadioItem
```

**Regras**:
- `DropdownMenuTrigger as-child` obrigatório
- Preferência: sem ícones nos itens, salvo instrução específica
- Item destrutivo: `data-variant="destructive"` no item. A folha `.nds-dropdown-menu-item[data-variant="destructive"]` pinta texto e ícone e mantém a cor no estado destacado — não pintar o item por fora
- `align="end"` no `DropdownMenuContent` quando o trigger é um botão de ação de linha

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `aria-label` contextual no trigger quando é icon-only — "Ações para [item]"
- `role="menu"` e `role="menuitem"` aplicados automaticamente
- Arrow keys navegam entre itens — comportamento nativo

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`): `menu_item_click` com `label` e `menu` (nome do menu pai).

---

## Hover Card

**Propósito**: card informativo que aparece ao passar o mouse sobre um trigger, exibindo contexto adicional.

**Quando usar**: preview de usuário ao passar sobre avatar ou nome, informações adicionais sobre um link, detalhes de item sem abrir modal. **Não usar em touch devices** — hover não existe em touchscreen.

**API e exemplos**: `src/components/ui/hover-card/hover-card.vue` + stories + `HoverCardDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
HoverCard (openDelay, closeDelay)
├── HoverCardTrigger (as-child)
└── HoverCardContent (side, align)
```

**Props relevantes**:

| Prop | Default sugerido | Função |
|------|------------------|--------|
| `openDelay` | `700` | Evita abertura acidental ao passar o mouse |
| `closeDelay` | `300` | Tempo para o usuário mover o cursor para dentro do card |

**Regras**:
- O `HoverCardContent` suporta conteúdo interativo (links, botões) — use com moderação
- Nunca usar o HoverCard como **único meio** de acessar informação crítica — deve ser complementar
- Em touch: suprimir ou substituir por outro padrão (Tooltip via tap, link explícito)

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `role="tooltip"` e gerenciamento de foco automáticos
- Conteúdo do HoverCard não é lido proativamente por leitores de tela — informação crítica deve estar disponível de outra forma

---

## Popover

**Propósito**: overlay flutuante com conteúdo rico, ativado por clique em um trigger.

**Quando usar**: formulários contextuais pequenos (filtro de data, seleção de cor), conteúdo interativo mais rico que um Tooltip mas sem necessidade de modal completo.

**API e exemplos**: `src/components/ui/popover/popover.vue` + stories + `PopoverDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão — Popover vs Tooltip vs DropdownMenu**:

| Situação | Componente |
|----------|------------|
| Texto explicativo curto, não interativo | Tooltip |
| Lista de ações clicáveis | DropdownMenu |
| Formulário ou conteúdo interativo contextual | Popover |
| Preview informativo ao hover | HoverCard |

**Estrutura de subcomponentes**:

```
Popover
├── PopoverTrigger (as-child)
└── PopoverContent (side, align, sideOffset)
```

**Regras**:
- `PopoverTrigger as-child` para usar o Button como trigger sem elemento extra
- `side` e `align` no `PopoverContent` controlam o posicionamento — auto-flip nativo (collision detection)
- Não usar para ações críticas ou destrutivas — usar Dialog ou AlertDialog
- Fechar ao clicar fora é comportamento nativo — não reimplementar

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `role="dialog"` no `PopoverContent` e gerenciamento de foco automáticos
- `Escape` fecha o Popover e retorna foco ao trigger

---

## Sheet

**Propósito**: painel lateral deslizante baseado em Reka Dialog. Ideal para configurações, filtros avançados e navegação secundária em desktop.

**API e exemplos**: `src/components/ui/sheet/sheet.vue` + stories + `SheetDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão — Sheet vs Drawer**:

| Aspecto | Sheet | Drawer |
|---------|-------|--------|
| Base técnica | Reka Dialog | Vaul |
| Gesture de arrastar | Não | Sim (bottom) |
| Melhor para | Desktop | Mobile |
| Prop de direção | `side` no `SheetContent` | `direction` no `Drawer` |

**Estrutura de subcomponentes**:

```
Sheet
├── SheetTrigger (as-child)
└── SheetContent (side)
    ├── SheetHeader
    │   ├── SheetTitle       (obrigatório)
    │   └── SheetDescription (obrigatório)
    ├── [conteúdo principal]
    └── SheetFooter
        ├── SheetClose → Button (variant="outline") — Cancelar
        └── Button — Ação primária
```

**Props relevantes**:

| Prop | Default | Função |
|------|---------|--------|
| `side` (no `SheetContent`) | `right` | `right` · `left` · `top` · `bottom` |

**Regras**:
- `side` fica no `SheetContent`, não no `Sheet`
- `SheetTitle` e `SheetDescription` obrigatórios para acessibilidade
- Botões alinhados à direita no rodapé: `.nds-cluster` com `data-justify="end"`. A ordem no DOM segue a ordem visual — `[secundário] [primário]`, confirmação à direita
- Overlay (backdrop) escuro automático — não desabilitar
- `Escape` fecha o Sheet — comportamento nativo

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`): mesmo padrão do Dialog — `dialog_open`, `dialog_close`, `dialog_confirm` com `component: "sheet"`.

---

## Tooltip

**Propósito**: texto explicativo curto que aparece ao passar o mouse ou focar em um elemento.

**Quando usar**: explicar ação de botão icon-only, fornecer contexto adicional não crítico. **Não usar** para informações obrigatórias — deve ser complementar ao label visível.

**API e exemplos**: `src/components/ui/tooltip/tooltip.vue` + stories + `TooltipDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

> **Setup obrigatório**: `TooltipProvider` adicionado no root da aplicação. Sem ele, os tooltips **não aparecem**. `delayDuration` configurado globalmente (sugestão: `400`).

**Estrutura de subcomponentes**:

```
TooltipProvider (no root da aplicação)
└── Tooltip
    ├── TooltipTrigger (as-child)
    └── TooltipContent (side)
```

**Regras**:
- `TooltipProvider` no root obrigatório
- `TooltipTrigger as-child` para usar componentes existentes como trigger
- Conteúdo máximo: 2 linhas de texto — para mais, usar Popover
- **Não usar em touch devices** — o Tooltip não aparece sem hover
- Texto do tooltip: complementa o label, não repete — "Salvar" no botão, "Salvar como rascunho" no tooltip
- Botão desabilitado: envolver em um `<span tabindex="0">` para que o tooltip funcione — `disabled` bloqueia os eventos de ponteiro do próprio botão

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `role="tooltip"` aplicado e conexão via `aria-describedby` automática
- Tooltip aparece no foco por teclado além do hover — comportamento nativo
- **Nunca usar o Tooltip como único portador de informação crítica** — deve complementar, não substituir

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Complementa o label visível: se o botão diz "Salvar", o tooltip pode dizer "Salvar como rascunho"
- Nunca repetir o label: botão "Editar" + tooltip "Editar" — inútil
- Sem ponto final em textos curtos de tooltip (1 linha)

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`): `tooltip_view` — rastrear apenas quando medir se usuários precisam de ajuda contextual em uma feature específica.

---

## Padrão Responsivo — Dialog (desktop) + Drawer (mobile)

Para overlays que precisam funcionar em ambos os contextos, renderizar `Dialog` em desktop e `Drawer` em mobile com o mesmo conteúdo.

**Regras**:
- Extrair o conteúdo para um componente separado — evita duplicação
- Detecção de viewport via `useMediaQuery` (composable customizado) com listener `addEventListener("change", …)` para reagir a mudanças
- Breakpoint padrão: `768px` (md) — alinhado com os breakpoints responsivos do projeto
- Ambas as variantes recebem o mesmo `open` / `onOpenChange` — o estado do overlay é compartilhado

---

## Regras transversais de Overlay Components

**Critério de decisão consolidado**:

| Situação | Componente |
|----------|------------|
| Formulário, criação, edição (modal) | Dialog |
| Confirmação de ação destrutiva | AlertDialog |
| Painel lateral em desktop | Sheet |
| Painel deslizante com gesture em mobile | Drawer |
| Lista de ações por clique explícito | DropdownMenu |
| Ações contextuais por right-click | ContextMenu + alternativa acessível |
| Conteúdo interativo contextual rico | Popover |
| Preview informativo ao hover | HoverCard |
| Texto explicativo curto | Tooltip |
| Busca rápida / command palette | Command |

**Tokens de fundo** (ver regra global no início deste arquivo):
- Painéis (Dialog, Sheet, Drawer): `--card` / `--card-foreground`, lidos pela folha de cada painel
- Menus e overlays flutuantes (DropdownMenu, ContextMenu, Popover, HoverCard, Command, Tooltip): `--popover` / `--popover-foreground`, lidos pela folha de cada painel — não sobrescrever por fora

**Acessibilidade transversal** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- Focus trap automático em Dialog, Sheet, Drawer — não reimplementar
- `Escape` fecha todos os overlays — comportamento nativo do Reka/Vaul
- `DialogTitle` / `SheetTitle` / `DrawerTitle` obrigatórios — base para `aria-labelledby`
- `TooltipProvider` no root obrigatório para Tooltip funcionar
- ContextMenu sempre com alternativa acessível — right-click não é descobrível

**Analytics transversal** (ver `../../docs/shared/guidelines/07-analytics.md`):

| Componente | Evento | Payload |
|------------|--------|---------|
| Dialog, Sheet, Drawer | `dialog_open` | `label` (título) |
| Dialog, Sheet, Drawer | `dialog_close` | `label`, `trigger` |
| Dialog, Sheet, Drawer | `dialog_confirm` | `label` |
| DropdownMenu, ContextMenu | `menu_item_click` | `label`, `menu` |
| Tooltip | `tooltip_view` | `label` (apenas em funis críticos) |
| Command | — | Rastrear via `onSelect` de cada item |

**UX Writing transversal** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Títulos de overlay: frase nominal, ação no infinitivo — "Editar perfil", "Excluir conta"
- Descrições: frase completa, ponto final, explica consequência ou contexto
- Botão primário: repete o verbo do título
- Botão secundário: sempre "Cancelar"
- Tooltip: complementa sem repetir o label visível
