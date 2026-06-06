# Overlay Components

---

## Regras Globais de Overlay

### Tokens de fundo por tipo de overlay

O Shadcn usa tokens semânticos diferentes para painéis de conteúdo e menus flutuantes. Sobrescrever o token errado quebra a coerência do tema, especialmente em dark mode.

| Tipo de overlay | Token correto | Componentes |
|-----------------|---------------|-------------|
| Painel de conteúdo (modal, lateral) | `bg-card text-card-foreground` | Dialog, Sheet, Drawer |
| Menu e overlay flutuante | `bg-popover text-popover-foreground` | DropdownMenu, ContextMenu, Popover, HoverCard, Command, Tooltip |

> O token `bg-popover` já é aplicado automaticamente nos overlays flutuantes — **não sobrescrever** com `bg-card`.

### Padding consistente entre header, content e footer

Todos os painéis de conteúdo (Dialog, Sheet, Drawer) devem usar o token de padding do projeto para garantir alinhamento visual entre cabeçalho, corpo e rodapé. Os tokens `--overlay-padding` (1.5rem / 24px) e `--overlay-padding-sm` (1rem / 16px) são customizados do projeto — definir no `globals.css`.

| Componente | Aplicação |
|------------|-----------|
| `DialogContent` | `p-[var(--overlay-padding)]` |
| `DrawerHeader` / `DrawerFooter` | `p-[var(--overlay-padding)]` |
| `SheetHeader` / `SheetFooter` | `p-[var(--overlay-padding)]` |
| `PopoverContent` | `p-[var(--overlay-padding-sm)]` |
| `HoverCardContent` | `p-[var(--overlay-padding-sm)]` |

### Comportamento de teclado — todos os overlays

| Tecla | Ação |
|-------|------|
| `Escape` | Fecha o overlay e retorna foco ao trigger |
| `Tab` / `Shift+Tab` | Navega entre elementos focáveis (focus trap ativo em Dialog, Sheet, Drawer) |
| `Enter` / `Space` | Ativa o item focado |
| `Arrow Down/Up` | Navega entre itens de menu (DropdownMenu, ContextMenu, Command) |

Todos esses comportamentos são gerenciados automaticamente pelo Radix UI ou Vaul — não reimplementar.

---

## Alert Dialog

**Propósito**: modal de confirmação que interrompe o fluxo para obter resposta explícita antes de ações críticas ou irreversíveis. Diferencia-se do `Dialog` por não ter botão X — exige confirmação ou cancelamento explícitos. Use em excluir conta, cancelar assinatura, encerrar sessão, remover dados permanentemente. Para workflows com formulário ou edição, usar `Dialog`.

**API e exemplos**: `src/components/ui/alert-dialog.tsx` + stories + `AlertDialogDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão — AlertDialog vs Dialog**:

| Situação | Componente |
|----------|------------|
| Confirmação de ação destrutiva / irreversível | AlertDialog |
| Formulário, edição, criação, visualização | Dialog |
| Informação que o usuário precisa confirmar ter lido | AlertDialog |

**Estrutura de subcomponentes**:
```
AlertDialog
├── AlertDialogTrigger (asChild obrigatório)
└── AlertDialogContent
    ├── AlertDialogHeader
    │   ├── AlertDialogTitle       (obrigatório)
    │   └── AlertDialogDescription (obrigatório)
    └── AlertDialogFooter
        ├── AlertDialogCancel
        └── AlertDialogAction
```

**Regras**:
- `AlertDialogTrigger asChild` obrigatório.
- **Consistência visual trigger → action**: trigger `destructive` → `AlertDialogAction` com `className` `bg-destructive text-destructive-foreground hover:bg-destructive/90`. Aplicar via `className` diretamente no `AlertDialogAction` — ele tem estilo próprio que pode sobrescrever o Button filho.
- `AlertDialogCancel` antes do `AlertDialogAction` no DOM — confirmação sempre à direita.
- Não usar para confirmações reversíveis — reservar para ações de alto impacto.

**Acessibilidade** (ver `11-acessibilidade.md`):
- Focus trap e retorno de foco ao trigger automáticos.
- `AlertDialogTitle` e `AlertDialogDescription` obrigatórios — base para `aria-labelledby` e `aria-describedby`.
- `aria-label` contextual no `AlertDialogAction` quando o texto do botão sozinho não tem contexto suficiente.

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Título: frase nominal que nomeia a ação — "Excluir conta", "Cancelar assinatura".
- Descrição: consequência em frase completa — "Esta ação não pode ser desfeita."
- `AlertDialogAction`: repete o verbo do título — "Excluir".
- `AlertDialogCancel`: sempre "Cancelar".

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):

| Evento | Quando | Payload |
|---|---|---|
| `dialog_open` | `onOpenChange(true)` | `component: "alert_dialog"`, `label` (título) |
| `dialog_confirm` | Clique no `AlertDialogAction` | `label` |
| `dialog_close` | Cancelar ou fechar | `label`, `trigger: "cancel_button"` |

---

## Command

**Propósito**: interface de busca e seleção rápida de comandos, ações ou itens com filtro fuzzy integrado.

**API e exemplos**: `src/components/ui/command.tsx` + stories + `CommandDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Três padrões de uso**:
- **Inline**: renderizado diretamente na página — busca local, combobox simples.
- **Popover (Combobox)**: trigger clicável que abre uma lista pesquisável — substituto do Select com busca.
- **Dialog (Command Palette)**: ativado por atalho de teclado — acesso rápido a ações globais.

**Estrutura de subcomponentes**:
```
Command
├── CommandInput       (campo de busca com filtro fuzzy automático)
├── CommandList        (container com scroll)
│   ├── CommandEmpty   (exibido quando nenhum resultado)
│   ├── CommandGroup   (agrupamento com heading)
│   │   ├── CommandItem
│   │   └── CommandItem
│   ├── CommandSeparator
│   └── CommandGroup
│       └── CommandItem
└── CommandShortcut    (atalho visual dentro de um CommandItem)
```

**Regras**:
- `CommandEmpty` obrigatório — sem ele, resultado vazio fica em branco.
- `CommandGroup` com `heading` para organizar ações relacionadas — sem heading quando há apenas um grupo.
- Preferência: menu simples sem ícones, salvo instrução específica.
- Sempre fechar o Dialog/Popover após `onSelect` (`setOpen(false)`).
- **Command Palette (Cmd+K)**: o atalho **não é nativo** — implementar via `useEffect` + `addEventListener` para detectar `metaKey/ctrlKey + "k"` e alternar o estado do Dialog. Dica visual do atalho obrigatória (`<kbd>⌘K</kbd>` em botão de busca) — o usuário precisa descobrir o atalho.
- **Combobox (Command + Popover)**: padrão substituto do `Select` com busca. Usar quando `Select` é insuficiente: listas com 10+ itens, busca por texto, seleção com preview. Para listas fixas pequenas sem busca, usar `Select`. No trigger, aplicar `role="combobox"` e `aria-expanded` no Button manualmente — o Radix não aplica automaticamente.

**Acessibilidade** (ver `11-acessibilidade.md`):
- O filtro fuzzy e a navegação por Arrow keys são nativos.
- `CommandShortcut` é apenas visual — a lógica do atalho deve ser implementada via `useEffect`.
- No Combobox: `role="combobox"` e `aria-expanded` no trigger.

---

## Context Menu

**Propósito**: menu de ações contextuais ativado por clique direito (right-click) sobre uma área específica. Use em arquivos, linhas de tabela, itens de canvas. **Nunca como único ponto de acesso a funcionalidades** — right-click não é descobrível em touch e não é óbvio para todos os usuários.

**API e exemplos**: `src/components/ui/context-menu.tsx` + stories + `ContextMenuDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
ContextMenu
├── ContextMenuTrigger   (área de right-click)
└── ContextMenuContent
    ├── ContextMenuGroup
    │   ├── ContextMenuLabel
    │   ├── ContextMenuItem
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
- Evitar submenus — aumentam a carga cognitiva e dificultam navegação por teclado.
- Item destrutivo: `className="text-destructive focus:text-destructive"` — sem variante de prop.
- Sempre oferecer alternativa explícita (botão, ícone de ação) para as mesmas ações do menu.
- `ContextMenuShortcut` é apenas visual — implementar o atalho via `useEffect`.

**Acessibilidade** (ver `11-acessibilidade.md`):

> **Aviso crítico**: ContextMenu ativado por right-click é inacessível em touch devices e não é descobrível por usuários que navegam apenas por teclado. **Toda ação disponível no ContextMenu deve ter uma alternativa acessível** — botão visível, ícone de ação na linha ou DropdownMenu.

---

## Dialog

**Propósito**: overlay modal para workflows que exigem atenção focada — formulários, confirmações, visualizações de conteúdo. Use para edição de dados em formulário, criação de item, visualização de detalhes. Para confirmação de ações destrutivas, usar `AlertDialog`. Para painéis laterais, usar `Sheet`. Para mobile, considerar `Drawer`.

**API e exemplos**: `src/components/ui/dialog.tsx` + stories + `DialogDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão — Dialog vs AlertDialog vs Sheet vs Drawer**:

| Situação | Componente |
|----------|------------|
| Formulário, edição, criação | Dialog |
| Confirmação de ação destrutiva | AlertDialog |
| Painel lateral persistente (configurações, filtros) | Sheet |
| Mobile — ação rápida ou formulário | Drawer |

**Estrutura de subcomponentes**:
```
Dialog
├── DialogTrigger (asChild obrigatório)
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
- `DialogTrigger asChild` obrigatório — evita renderizar um `<button>` extra dentro do trigger.
- `DialogTitle` e `DialogDescription` obrigatórios — sem eles o Radix emite warning e leitores de tela não têm contexto.
- Máximo 80% da viewport: `sm:max-w-[425px]` ou similar.
- Botão de fechar nativo do Shadcn (X) sempre visível — não remover com `showCloseButton={false}` salvo instrução específica.
- Scroll interno via `overflow-y-auto` no conteúdo — nunca no `DialogContent` inteiro.

**Acessibilidade** (ver `11-acessibilidade.md`):
- Focus trap automático — ao abrir, foco vai para o primeiro elemento focável.
- Ao fechar, foco retorna ao `DialogTrigger` automaticamente.
- `Escape` fecha o Dialog — comportamento nativo, não sobrescrever.
- `aria-labelledby` e `aria-describedby` aplicados automaticamente via `DialogTitle` e `DialogDescription`.

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- `DialogTitle`: frase nominal que nomeia a ação — "Editar perfil", "Adicionar item".
- `DialogDescription`: contexto ou instrução, frase completa com ponto.
- Botão primário: repete o verbo do título — "Editar" → "Salvar".
- Botão secundário: sempre "Cancelar".

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
- `dialog_open` no `onOpenChange(true)` com `label` (título).
- `dialog_close` no `onOpenChange(false)` com `label` e `trigger` ("backdrop", "escape", "close_button").

---

## Drawer

**Propósito**: painel deslizante com suporte a gesture de arrastar, construído sobre **Vaul**. Otimizado para mobile. Use para formulários rápidos em mobile, filtros, ações contextuais em telas pequenas. Para desktop, usar `Sheet`.

**API e exemplos**: `src/components/ui/drawer.tsx` + stories + `DrawerDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

> **Importante**: o Drawer usa **Vaul** (não Radix). A prop de direção é `direction` no `Drawer` — diferente do `Sheet`, que usa `side` no `SheetContent`.

**Critério de decisão — Drawer vs Sheet**:

| Aspecto | Drawer | Sheet |
|---------|--------|-------|
| Base técnica | Vaul | Radix Dialog |
| Gesture de arrastar | Sim (bottom) | Não |
| Handle visual | Automático (bottom) | Não |
| Melhor para | Mobile | Desktop |
| Prop de direção | `direction` no `Drawer` | `side` no `SheetContent` |

**Estrutura de subcomponentes**:
```
Drawer (direction)
├── DrawerTrigger (asChild)
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
|---|---|---|
| `direction` (no `Drawer`) | `"bottom"` | `"bottom"` \| `"top"` \| `"right"` \| `"left"` |

**Regras**:
- `direction` na prop do `Drawer` (não no `DrawerContent`).
- Handle de arrastar: automático apenas em `direction="bottom"` — não aparece em outras direções.
- `DrawerTitle` e `DrawerDescription` obrigatórios para acessibilidade.
- Botões alinhados à direita via `flex justify-end` no footer.
- `DrawerClose` envolve o botão de cancelar para fechar o Drawer automaticamente.

---

## Dropdown Menu

**Propósito**: lista de ações ativada por clique em um trigger explícito. Use em ações de linha em tabelas, menu de usuário, ações secundárias em cards. Para lista de opções de formulário, usar `Select`. Para busca com seleção, usar `Command` (Combobox).

**API e exemplos**: `src/components/ui/dropdown-menu.tsx` + stories + `DropdownMenuDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
DropdownMenu
├── DropdownMenuTrigger (asChild obrigatório)
└── DropdownMenuContent
    ├── DropdownMenuLabel
    ├── DropdownMenuGroup
    │   └── DropdownMenuItem
    ├── DropdownMenuSeparator
    ├── DropdownMenuCheckboxItem
    └── DropdownMenuRadioGroup
        └── DropdownMenuRadioItem
```

**Regras**:
- `DropdownMenuTrigger asChild` obrigatório.
- Preferência: sem ícones nos itens, salvo instrução específica.
- Item destrutivo: `className="text-destructive focus:text-destructive"` — sem prop de variante.
- `align="end"` no `DropdownMenuContent` quando o trigger é um botão de ação de linha.

**Acessibilidade** (ver `11-acessibilidade.md`):
- `aria-label` contextual no trigger quando é icon-only — "Ações para [item]".
- Aplica `role="menu"` e `role="menuitem"` automaticamente.
- Arrow keys navegam entre itens — comportamento nativo.

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`): `menu_item_click` com `label` e `menu` (nome do menu pai).

---

## Hover Card

**Propósito**: card informativo que aparece ao passar o mouse sobre um trigger, exibindo contexto adicional. Use em preview de usuário ao passar sobre avatar ou nome, informações adicionais sobre um link, detalhes de item sem abrir modal. **Não usar em touch devices** — hover não existe em touchscreen.

**API e exemplos**: `src/components/ui/hover-card.tsx` + stories + `HoverCardDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
HoverCard (openDelay, closeDelay)
├── HoverCardTrigger (asChild)
└── HoverCardContent (side, align)
```

**Props relevantes**:

| Prop | Default recomendado | Função |
|---|---|---|
| `openDelay` | `700` | Evita abertura acidental ao passar o mouse |
| `closeDelay` | `300` | Dá tempo para o usuário mover o cursor para dentro do card |

**Regras**:
- `openDelay={700}` — evita abertura acidental.
- `closeDelay={300}` — dá tempo para o usuário mover o cursor para dentro do card.
- `HoverCardContent` suporta conteúdo interativo (links, botões) — use com moderação.
- Nunca usar o HoverCard como **único meio** de acessar informação crítica — deve ser complementar.
- Em touch: suprimir ou substituir por outro padrão (Tooltip via tap, link explícito).

**Acessibilidade** (ver `11-acessibilidade.md`):
- Aplica `role="tooltip"` e gerencia foco automaticamente.
- Conteúdo do HoverCard não é lido proativamente por leitores de tela — informação crítica deve estar disponível de outra forma.

---

## Popover

**Propósito**: overlay flutuante com conteúdo rico, ativado por clique em um trigger. Use em formulários contextuais pequenos (filtro de data, seleção de cor), conteúdo interativo mais rico que um Tooltip mas sem necessidade de modal completo.

**API e exemplos**: `src/components/ui/popover.tsx` + stories + `PopoverDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

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
├── PopoverTrigger (asChild)
└── PopoverContent (side, align, sideOffset)
```

**Regras**:
- `PopoverTrigger asChild` para usar o Button como trigger sem elemento extra.
- `side` e `align` no `PopoverContent` controlam o posicionamento — auto-flip nativo (collision detection).
- Não usar para ações críticas ou destrutivas — usar Dialog ou AlertDialog.
- Fechar ao clicar fora é comportamento nativo — não reimplementar.

**Acessibilidade** (ver `11-acessibilidade.md`):
- Aplica `role="dialog"` no `PopoverContent` e gerencia foco automaticamente.
- `Escape` fecha o Popover e retorna foco ao trigger.

---

## Sheet

**Propósito**: painel lateral deslizante baseado em Radix Dialog. Ideal para configurações, filtros avançados e navegação secundária em desktop.

**API e exemplos**: `src/components/ui/sheet.tsx` + stories + `SheetDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão — Sheet vs Drawer**:

| Aspecto | Sheet | Drawer |
|---------|-------|--------|
| Base técnica | Radix Dialog | Vaul |
| Gesture de arrastar | Não | Sim (bottom) |
| Melhor para | Desktop | Mobile |
| Prop de direção | `side` no `SheetContent` | `direction` no `Drawer` |

**Estrutura de subcomponentes**:
```
Sheet
├── SheetTrigger (asChild)
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

| Prop | Função |
|---|---|
| `side` (no `SheetContent`) | `"right"` \| `"left"` \| `"top"` \| `"bottom"` |

**Regras**:
- `side` fica no `SheetContent`, não no `Sheet`.
- `SheetTitle` e `SheetDescription` obrigatórios para acessibilidade.
- Botões alinhados à direita via `flex justify-end` no footer.
- Overlay (backdrop) escuro automático — não desabilitar.
- `Escape` fecha o Sheet — comportamento nativo.

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`): mesmo padrão do Dialog — `dialog_open`, `dialog_close`, `dialog_confirm` com `component: "sheet"`.

---

## Tooltip

**Propósito**: texto explicativo curto que aparece ao passar o mouse ou focar em um elemento. Use para explicar ação de botão icon-only, fornecer contexto adicional não crítico. **Não usar** para informações obrigatórias — deve ser complementar ao label visível.

**API e exemplos**: `src/components/ui/tooltip.tsx` + stories + `TooltipDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

> **Setup obrigatório**: `TooltipProvider` (com `delayDuration={400}` recomendado) deve ser adicionado no root da aplicação (App.tsx). Sem ele, os tooltips **não aparecem**.

**Estrutura de subcomponentes**:
```
Tooltip
├── TooltipTrigger (asChild)
└── TooltipContent (side)
```

**Regras**:
- `TooltipProvider` no root obrigatório — `delayDuration` configurado globalmente.
- `TooltipTrigger asChild` para usar componentes existentes como trigger.
- Conteúdo máximo: 2 linhas de texto — para mais, usar Popover.
- **Não usar em touch devices** — o Tooltip não aparece sem hover.
- Texto do tooltip: complementa o label, não repete — "Salvar" no botão, "Salvar como rascunho" no tooltip.
- Botão desabilitado: envolver em `<span tabIndex={0}>` para que o tooltip funcione (`disabled` bloqueia eventos de pointer).

**Acessibilidade** (ver `11-acessibilidade.md`):
- Aplica `role="tooltip"` e conecta via `aria-describedby` automaticamente.
- Tooltip aparece no foco por teclado além do hover — comportamento nativo.
- **Nunca usar o Tooltip como único portador de informação crítica** — deve complementar, não substituir.

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Complementa o label visível: se o botão diz "Salvar", o tooltip pode dizer "Salvar como rascunho".
- Nunca repetir o label: botão "Editar" + tooltip "Editar" — inútil.
- Sem ponto final em textos curtos de tooltip (1 linha).

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`): `tooltip_view` — rastrear apenas quando medir se usuários precisam de ajuda contextual em uma feature específica.

---

## Padrão Responsivo — Dialog (desktop) + Drawer (mobile)

Para overlays que precisam funcionar em ambos os contextos, o Shadcn recomenda renderizar `Dialog` em desktop e `Drawer` em mobile com o mesmo conteúdo.

**Regras**:
- Extrair o conteúdo para um componente separado — evita duplicação de JSX.
- `useMediaQuery` implementado com `addEventListener` para reagir a mudanças de viewport.
- Breakpoint padrão: `768px` (md) — alinhado com os breakpoints do Tailwind do projeto.
- Compartilhar `open` / `onOpenChange` entre Dialog e Drawer — estado único no caller.

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
- Painéis (Dialog, Sheet, Drawer): `bg-card text-card-foreground`
- Menus e overlays flutuantes (DropdownMenu, ContextMenu, Popover, HoverCard, Command, Tooltip): `bg-popover text-popover-foreground` (padrão do Shadcn — não sobrescrever)

**Acessibilidade transversal** (ver `11-acessibilidade.md`):
- Focus trap automático em Dialog, Sheet, Drawer — não reimplementar
- `Escape` fecha todos os overlays — comportamento nativo do Radix/Vaul
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
