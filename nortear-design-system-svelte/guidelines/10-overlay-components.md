# Overlay Components

---

## Regras Globais de Overlay

### Tokens de fundo por tipo

| Tipo de overlay | Token correto | Componentes |
|-----------------|---------------|-------------|
| Painel de conteúdo (modal, lateral) | `bg-card text-card-foreground` | Dialog, Sheet, Drawer |
| Menu e overlay flutuante | `bg-popover text-popover-foreground` | DropdownMenu, Popover, Tooltip, Command |

### Comportamento de teclado

| Tecla | Ação |
|-------|------|
| `Escape` | Fecha o overlay e retorna foco ao trigger |
| `Tab` / `Shift+Tab` | Navega entre elementos focáveis (focus trap em Dialog, Sheet, Drawer) |
| `Enter` / `Space` | Ativa o item focado |
| `Arrow Down/Up` | Navega entre itens de menu |

Todos esses comportamentos são gerenciados automaticamente pelo **Bits UI** — não reimplementar.

### Triggers com `asChild` / builder pattern

Bits UI usa um padrão de builder para passar props de acessibilidade ao trigger customizado: o trigger declara `asChild let:builder` e o elemento alvo (`Button`, `a`, etc.) recebe `builders={[builder]}`. Consultar `src/components/ui/<componente>/` para os exemplos canônicos.

---

## Alert Dialog

**Propósito**: modal de confirmação para ações críticas ou irreversíveis — excluir conta, remover dados permanentemente, cancelar assinatura. Sem botão X — exige resposta explícita.

**API e exemplos**: `src/components/ui/alert-dialog/alert-dialog.svelte` + stories + `AlertDialogDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
AlertDialog
├── AlertDialogTrigger (asChild → Button)
└── AlertDialogContent (bg-card text-card-foreground)
    ├── AlertDialogHeader
    │   ├── AlertDialogTitle
    │   └── AlertDialogDescription
    └── AlertDialogFooter
        ├── AlertDialogCancel
        └── AlertDialogAction (bg-destructive em ações destrutivas)
```

**Regras de UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Título: ação no infinitivo com consequência — "Excluir conta permanentemente?"
- Descrição: consequência concreta sem culpar o usuário
- Botão destrutivo: repete o verbo do título — "Excluir conta"
- Botão cancelar: sempre "Cancelar" — à esquerda

**Analytics**: `track('dialog_open', { component: 'alert_dialog', trigger })` em `onOpenChange(true)` e `track('dialog_confirm', { component: 'alert_dialog' })` no `AlertDialogAction`. Ver `../../docs/shared/guidelines/07-analytics.md`.

---

## Dialog

**Propósito**: modal para formulários, edição, criação ou visualização de conteúdo.

**API e exemplos**: `src/components/ui/dialog/dialog.svelte` + stories + `DialogDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Dialog
├── DialogTrigger (asChild → Button)
└── DialogContent (bg-card text-card-foreground)
    ├── DialogHeader
    │   ├── DialogTitle (obrigatório)
    │   └── DialogDescription (obrigatório)
    ├── (conteúdo — ex.: form)
    └── DialogFooter
        ├── Button variant="outline" (Cancelar)
        └── Button type="submit"
```

**Regras**:
- `DialogTitle` e `DialogDescription` **obrigatórios** em todo Dialog

**Analytics**: `track('dialog_open' | 'dialog_close', { component: 'dialog', trigger })` em `onOpenChange`.

---

## Drawer

**Propósito**: painel deslizante a partir de uma borda da tela — mobile-first.

**API e exemplos**: `src/components/ui/drawer/drawer.svelte` + stories + `DrawerDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Drawer (direction: top | bottom | left | right)
├── DrawerTrigger (asChild → Button)
└── DrawerContent (bg-card text-card-foreground)
    ├── DrawerHeader
    │   ├── DrawerTitle
    │   └── DrawerDescription
    ├── (conteúdo)
    └── DrawerFooter
        ├── Button (ação primária)
        └── DrawerClose (asChild → Button variant="outline")
```

**Regras**:
- `direction` é prop de `<Drawer>` — **não** de `<DrawerContent>`
- `DrawerTitle` e `DrawerDescription` obrigatórios

---

## Dropdown Menu

**Propósito**: menu contextual de ações para um elemento.

**API e exemplos**: `src/components/ui/dropdown-menu/dropdown-menu.svelte` + stories + `DropdownMenuDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
DropdownMenu
├── DropdownMenuTrigger (asChild → Button icon, aria-label contextual)
└── DropdownMenuContent (align)
    ├── DropdownMenuLabel
    ├── DropdownMenuSeparator
    ├── DropdownMenuItem
    └── DropdownMenuItem (text-destructive em ações destrutivas)
```

**Regras**:
- Trigger icon-only requer `aria-label` contextual
- Itens destrutivos usam `text-destructive focus:text-destructive`

---

## Popover

**Propósito**: painel flutuante para controles auxiliares (datepicker, filtro avançado, seletor de cor).

**API e exemplos**: `src/components/ui/popover/popover.svelte` + stories + `PopoverDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Popover
├── PopoverTrigger (asChild → Button)
└── PopoverContent (align)
    └── (conteúdo)
```

---

## Sheet

**Propósito**: painel lateral persistente (sidebar ou formulário de edição).

**API e exemplos**: `src/components/ui/sheet/sheet.svelte` + stories + `SheetDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Sheet
├── SheetTrigger (asChild → Button)
└── SheetContent (side: left | right | top | bottom, bg-card text-card-foreground)
    ├── SheetHeader
    │   ├── SheetTitle (obrigatório)
    │   └── SheetDescription (obrigatório)
    └── (conteúdo)
```

**Regras**:
- `SheetTitle` e `SheetDescription` **obrigatórios** em todo Sheet

---

## Tooltip

**Propósito**: informação contextual breve que aparece ao hover/focus em um elemento.

**API e exemplos**: `src/components/ui/tooltip/tooltip.svelte` + stories + `TooltipDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
TooltipProvider (root do app)
└── Tooltip
    ├── TooltipTrigger (asChild → Button com aria-label)
    └── TooltipContent
```

**Regras**:
- `TooltipProvider` deve envolver todos os tooltips (idealmente no root do app)
- Tooltip complementa o `aria-label` — não o substitui
- Evitar em mobile — preferir Popover para compatibilidade touch

---

## Command (Combobox)

**Propósito**: busca e seleção de items em lista — substitui Select quando busca é necessária.

**API e exemplos**: `src/components/ui/command/command.svelte` + stories + `CommandDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura** (combobox = Popover + Command):

```
Popover (bind:open)
├── PopoverTrigger (asChild → Button role="combobox" aria-expanded)
└── PopoverContent
    └── Command
        ├── CommandInput (placeholder de busca)
        └── CommandList
            ├── CommandEmpty
            └── CommandGroup
                └── CommandItem (value, onSelect)
                    ├── Check (opacity-100 quando selecionado)
                    └── (label)
```

**Regras**:
- Trigger declara `role="combobox"` e `aria-expanded={aberto}`
- Indicador de seleção: `Check` com `opacity-100` no item ativo, `opacity-0` nos demais (mantém layout estável)
- Empty state obrigatório (`CommandEmpty`) — nunca lista vazia silenciosa
