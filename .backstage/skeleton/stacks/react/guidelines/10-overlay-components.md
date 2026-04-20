# Overlay Components

---

## Regras Globais de Overlay

### Tokens de fundo por tipo de overlay

O Shadcn usa tokens semânticos diferentes para painéis de conteúdo e menus flutuantes. Sobrescrever o token errado quebra a coerência do tema, especialmente em dark mode.

| Tipo de overlay | Token correto | Componentes |
|-----------------|---------------|-------------|
| Painel de conteúdo (modal, lateral) | `bg-card text-card-foreground` | Dialog, Sheet, Drawer |
| Menu e overlay flutuante | `bg-popover text-popover-foreground` | DropdownMenu, ContextMenu, Popover, HoverCard, Command, Tooltip |

```tsx
{/* ✅ Dialog — painel de conteúdo */}
<DialogContent className="bg-card text-card-foreground">

{/* ✅ DropdownMenu — overlay flutuante (padrão do Shadcn, não precisa sobrescrever) */}
<DropdownMenuContent> {/* bg-popover aplicado automaticamente */}

{/* ❌ Incorreto — força bg-card em overlay flutuante */}
<DropdownMenuContent className="bg-card">
```

### Padding consistente entre header, content e footer

Todos os painéis de conteúdo (Dialog, Sheet, Drawer) devem usar o token de padding do projeto para garantir alinhamento visual entre cabeçalho, corpo e rodapé.

```css
/* globals.css — adicionar junto com os demais tokens do projeto */
:root {
  --overlay-padding: 1.5rem;      /* 24px — padding padrão para Dialog, Sheet, Drawer */
  --overlay-padding-sm: 1rem;     /* 16px — padding compacto para Popover, HoverCard */
}
```

| Componente | Aplicação |
|------------|-----------|
| `DialogContent` | `p-[var(--overlay-padding)]` |
| `DrawerHeader` / `DrawerFooter` | `p-[var(--overlay-padding)]` |
| `SheetHeader` / `SheetFooter` | `p-[var(--overlay-padding)]` |
| `PopoverContent` | `p-[var(--overlay-padding-sm)]` |
| `HoverCardContent` | `p-[var(--overlay-padding-sm)]` |

> Esses tokens são customizados do projeto — não fazem parte do Shadcn padrão. Definir no `globals.css` junto com os demais tokens do projeto (ver `03-sistema-design.md` para contexto geral de tokens).

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

**Propósito**: modal de confirmação que interrompe o fluxo para obter resposta explícita antes de ações críticas ou irreversíveis. Diferencia-se do `Dialog` por não ter botão X — exige confirmação ou cancelamento explícitos.

**Quando usar**: excluir conta, cancelar assinatura, encerrar sessão, remover dados permanentemente. Para workflows com formulário ou edição, usar `Dialog`.

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

**Implementação**:
```tsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Excluir conta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent className="bg-card text-card-foreground">
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir conta</AlertDialogTitle>
      <AlertDialogDescription>
        Todos os seus dados serão removidos permanentemente.
        Esta ação não pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        aria-label="Excluir conta permanentemente"
        onClick={handleDelete}
      >
        Excluir
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Regras**:
- `AlertDialogTrigger asChild` obrigatório
- **Consistência visual trigger → action**: trigger `destructive` → `AlertDialogAction` `destructive`. Aplicar via `className` diretamente no `AlertDialogAction` — ele tem estilo próprio que pode sobrescrever o Button filho
- `AlertDialogCancel` antes do `AlertDialogAction` no DOM — confirmação sempre à direita
- Não usar para confirmações reversíveis — reservar para ações de alto impacto

**Acessibilidade** (ver `11-acessibilidade.md`):
- Focus trap e retorno de foco ao trigger automáticos pelo Radix
- `AlertDialogTitle` e `AlertDialogDescription` obrigatórios — base para `aria-labelledby` e `aria-describedby`
- `aria-label` contextual no `AlertDialogAction` quando o texto do botão sozinho não tem contexto suficiente para leitores de tela

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Título: frase nominal que nomeia a ação — "Excluir conta", "Cancelar assinatura"
- Descrição: consequência em frase completa — "Esta ação não pode ser desfeita."
- `AlertDialogAction`: repete o verbo do título — "Excluir"
- `AlertDialogCancel`: sempre "Cancelar"

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
```tsx
<AlertDialog onOpenChange={(open) => {
  if (open) track("dialog_open", { component: "alert_dialog", location: currentPage, label: "Excluir conta" })
}}>
  <AlertDialogAction onClick={() => {
    track("dialog_confirm", { component: "alert_dialog", location: currentPage, label: "Excluir conta" })
    handleDelete()
  }}>Excluir</AlertDialogAction>
  <AlertDialogCancel onClick={() =>
    track("dialog_close", { component: "alert_dialog", location: currentPage, label: "Excluir conta", trigger: "cancel_button" })
  }>Cancelar</AlertDialogCancel>
</AlertDialog>
```

---

## Command

**Propósito**: interface de busca e seleção rápida de comandos, ações ou itens com filtro fuzzy integrado.

**Três padrões de uso**:
- **Inline**: renderizado diretamente na página — busca local, combobox simples
- **Popover (Combobox)**: trigger clicável que abre uma lista pesquisável — substituto do Select com busca
- **Dialog (Command Palette)**: ativado por atalho de teclado — acesso rápido a ações globais

**Estrutura de subcomponentes**:
```
Command
├── CommandInput       (campo de busca com filtro fuzzy automático)
├── CommandList        (container com scroll)
│   ├── CommandEmpty   (exibido quando nenhum resultado)
│   ├── CommandGroup   (agrupamento com label)
│   │   ├── CommandItem
│   │   └── CommandItem
│   ├── CommandSeparator
│   └── CommandGroup
│       └── CommandItem
└── CommandShortcut    (atalho visual dentro de um CommandItem)
```

**Implementação — inline**:
```tsx
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command"

<Command className="rounded-lg border border-border shadow-sm">
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
    <CommandGroup heading="Componentes">
      <CommandItem value="button" onSelect={() => navigateTo("button")}>
        Button
      </CommandItem>
      <CommandItem value="input" onSelect={() => navigateTo("input")}>
        Input
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="separator" onSelect={() => navigateTo("separator")}>
        Separator
      </CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

**Implementação — Command Palette com atalho Cmd+K**:

> O atalho de teclado **não é nativo** do componente — requer `useEffect` + `addEventListener` para detectar o atalho e controlar o estado do Dialog.

```tsx
const [open, setOpen] = useState(false)

// Listener de teclado — implementar manualmente
useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setOpen((prev) => !prev)
    }
  }
  document.addEventListener("keydown", down)
  return () => document.removeEventListener("keydown", down)
}, [])

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="overflow-hidden p-0 bg-card">
    <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group]]:px-2">
      <CommandInput placeholder="Digite um comando ou busca..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        <CommandGroup heading="Sugestões">
          <CommandItem onSelect={() => { runAction("novo"); setOpen(false) }}>
            Novo documento
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { navigateTo("config"); setOpen(false) }}>
            Configurações
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  </DialogContent>
</Dialog>

{/* Dica visual do atalho — sempre visível na interface */}
<Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
  <Search className="h-4 w-4" aria-hidden="true" />
  Buscar
  <kbd className="pointer-events-none text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
    ⌘K
  </kbd>
</Button>
```

**Regras**:
- `CommandEmpty` obrigatório — sem ele, resultado vazio fica em branco
- `CommandGroup` com `heading` para organizar ações relacionadas — sem heading quando há apenas um grupo
- Preferência: menu simples sem ícones, salvo instrução específica
- Sempre fechar o Dialog/Popover após `onSelect` (`setOpen(false)`)
- Dica visual do atalho obrigatória quando usar Command Palette — o usuário precisa descobrir o atalho

**Implementação — Combobox (Command + Popover)**:

O padrão de Combobox — substituto do `Select` com busca integrada — é construído com `Command` dentro de um `Popover`. É o uso mais comum do `Command` no dia a dia.

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

const estados = [
  { value: "sp", label: "São Paulo" },
  { value: "rj", label: "Rio de Janeiro" },
  { value: "mg", label: "Minas Gerais" },
]

const [open, setOpen] = useState(false)
const [value, setValue] = useState("")

<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      aria-label="Selecionar estado"
      className="w-[240px] justify-between"
    >
      {value
        ? estados.find((e) => e.value === value)?.label
        : "Selecione um estado..."}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-[240px] p-0">
    <Command>
      <CommandInput placeholder="Buscar estado..." />
      <CommandList>
        <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
        <CommandGroup>
          {estados.map((estado) => (
            <CommandItem
              key={estado.value}
              value={estado.value}
              onSelect={(currentValue) => {
                setValue(currentValue === value ? "" : currentValue)
                setOpen(false)
              }}
            >
              <Check
                className={cn("mr-2 h-4 w-4", value === estado.value ? "opacity-100" : "opacity-0")}
                aria-hidden="true"
              />
              {estado.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

> Usar Combobox quando `Select` é insuficiente: listas com 10+ itens, busca por texto, seleção com preview. Para listas fixas pequenas sem busca, usar `Select`.

**Acessibilidade** (ver `11-acessibilidade.md`):
- O filtro fuzzy e a navegação por Arrow keys são nativos do componente
- `CommandShortcut` é apenas visual — a lógica do atalho deve ser implementada via `useEffect`
- No Combobox: `role="combobox"` e `aria-expanded` no trigger — o Radix não aplica automaticamente no Button

---

## Context Menu

**Propósito**: menu de ações contextuais ativado por clique direito (right-click) sobre uma área específica.

**Quando usar**: ações que fazem sentido no contexto de um elemento específico — arquivo, linha de tabela, item de canvas. **Nunca como único ponto de acesso a funcionalidades** — right-click não é descobrível em touch e não é óbvio para todos os usuários.

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

**Implementação**:
```tsx
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent,
  ContextMenuSubTrigger, ContextMenuTrigger, ContextMenuShortcut,
} from "@/components/ui/context-menu"

<ContextMenu>
  <ContextMenuTrigger className="flex h-32 w-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
    Clique com o botão direito aqui
  </ContextMenuTrigger>
  <ContextMenuContent className="w-48">
    <ContextMenuItem onSelect={handleEdit}>
      Editar
      <ContextMenuShortcut>⌘E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem onSelect={handleDuplicate}>
      Duplicar
    </ContextMenuItem>
    <ContextMenuSeparator />
    {/* Submenu — usar com moderação */}
    <ContextMenuSub>
      <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Por email</ContextMenuItem>
        <ContextMenuItem>Por link</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
    <ContextMenuSeparator />
    <ContextMenuItem
      onSelect={handleDelete}
      className="text-destructive focus:text-destructive"
    >
      Excluir
      <ContextMenuShortcut>⌫</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

**Regras**:
- Evitar submenus — aumentam a carga cognitiva e dificultam navegação por teclado
- Item destrutivo: `className="text-destructive focus:text-destructive"` — sem variante de prop
- Sempre oferecer alternativa explícita (botão, ícone de ação) para as mesmas ações do menu
- `ContextMenuShortcut` é apenas visual — implementar o atalho via `useEffect`

**Acessibilidade** (ver `11-acessibilidade.md`):

> **Aviso crítico**: ContextMenu ativado por right-click é inacessível em touch devices e não é descobrível por usuários que navegam apenas por teclado. **Toda ação disponível no ContextMenu deve ter uma alternativa acessível** — botão visível, ícone de ação na linha ou DropdownMenu.

---

## Dialog

**Propósito**: overlay modal para workflows que exigem atenção focada — formulários, confirmações, visualizações de conteúdo.

**Quando usar**: edição de dados em formulário, criação de item, visualização de detalhes. Para confirmação de ações destrutivas, usar `AlertDialog`. Para painéis laterais, usar `Sheet`. Para mobile, considerar `Drawer`.

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

**Implementação**:
```tsx
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant="outline">Editar perfil</Button>
  </DialogTrigger>

  <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground p-[var(--overlay-padding)]">
    <DialogHeader>
      {/* DialogTitle e DialogDescription obrigatórios — o Radix os usa para aria-labelledby e aria-describedby */}
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>
        Atualize suas informações de perfil. Clique em salvar ao terminar.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      {/* Conteúdo do formulário */}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
      <Button type="submit" onClick={handleSave}>Salvar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Regras**:
- `DialogTrigger asChild` obrigatório — evita renderizar um `<button>` extra dentro do trigger
- `DialogTitle` e `DialogDescription` obrigatórios — sem eles o Radix emite warning e leitores de tela não têm contexto
- Máximo 80% da viewport: `sm:max-w-[425px]` ou similar
- Botão de fechar nativo do Shadcn (X) sempre visível — não remover com `showCloseButton={false}` salvo instrução específica
- Scroll interno via `overflow-y-auto` no conteúdo — nunca no `DialogContent` inteiro

**Acessibilidade** (ver `11-acessibilidade.md`):
- Focus trap automático pelo Radix — ao abrir, foco vai para o primeiro elemento focável
- Ao fechar, foco retorna ao `DialogTrigger` automaticamente
- `Escape` fecha o Dialog — comportamento nativo, não sobrescrever
- `aria-labelledby` e `aria-describedby` aplicados automaticamente via `DialogTitle` e `DialogDescription`

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- `DialogTitle`: frase nominal que nomeia a ação — "Editar perfil", "Adicionar item"
- `DialogDescription`: contexto ou instrução, frase completa com ponto — "Atualize suas informações. Clique em salvar ao terminar."
- Botão primário: repete o verbo do título — "Editar" → "Salvar edições" ou simplesmente "Salvar"
- Botão secundário: sempre "Cancelar"

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
```tsx
<Dialog
  open={open}
  onOpenChange={(isOpen) => {
    setOpen(isOpen)
    if (isOpen) {
      track("dialog_open", { component: "dialog", location: currentPage, label: "Editar perfil" })
    } else {
      track("dialog_close", { component: "dialog", location: currentPage, label: "Editar perfil", trigger: "backdrop" })
    }
  }}
>
```

---

## Drawer

**Propósito**: painel deslizante com suporte a gesture de arrastar, construído sobre a biblioteca **Vaul**. Otimizado para mobile.

**Quando usar**: formulários rápidos em mobile, filtros, ações contextuais em telas pequenas. Para desktop, usar `Sheet`.

> **Importante**: o Drawer usa **Vaul** (não Radix). A prop de direção é `direction` — diferente do `Sheet`, que usa `side` no `SheetContent`.

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

**Implementação**:
```tsx
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription,
  DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer"

{/* Drawer padrão — bottom, com handle e gesture */}
<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Abrir filtros</Button>
  </DrawerTrigger>
  <DrawerContent className="bg-card text-card-foreground">
    <div className="mx-auto w-full max-w-sm">
      <DrawerHeader className="p-[var(--overlay-padding)]">
        <DrawerTitle>Filtros</DrawerTitle>
        <DrawerDescription>
          Aplique filtros para refinar os resultados.
        </DrawerDescription>
      </DrawerHeader>

      <div className="px-4 pb-4">
        {/* Conteúdo */}
      </div>

      <DrawerFooter className="p-[var(--overlay-padding)] flex justify-end gap-2">
        <DrawerClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DrawerClose>
        <Button onClick={handleApply}>Aplicar</Button>
      </DrawerFooter>
    </div>
  </DrawerContent>
</Drawer>

{/* Drawer lateral — sem handle automático */}
<Drawer direction="right">
  <DrawerTrigger asChild>
    <Button>Detalhes</Button>
  </DrawerTrigger>
  <DrawerContent className="bottom-2 left-auto right-2 top-2 mt-0 w-[310px] rounded-[10px]">
    ...
  </DrawerContent>
</Drawer>
```

**Regras**:
- `direction` na prop do `Drawer` (não no `DrawerContent`): `"bottom"` | `"top"` | `"right"` | `"left"`
- Handle de arrastar: automático apenas em `direction="bottom"` — não aparece em outras direções
- `DrawerTitle` e `DrawerDescription` obrigatórios para acessibilidade
- Botões alinhados à direita via `flex justify-end` no footer
- `DrawerClose` envolve o botão de cancelar para fechar o Drawer automaticamente

---

## Dropdown Menu

**Propósito**: lista de ações ativada por clique em um trigger explícito.

**Quando usar**: ações de linha em tabelas, menu de usuário, ações secundárias em cards. Para lista de opções de formulário, usar `Select`. Para busca com seleção, usar `Command` (Combobox).

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

**Implementação**:
```tsx
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuShortcut, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Ações para item João Silva">
      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end" className="w-48">
    <DropdownMenuLabel>Ações</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem onSelect={handleEdit}>
        Editar
        <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={handleDuplicate}>
        Duplicar
      </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    {/* Item destrutivo — className, não prop */}
    <DropdownMenuItem
      onSelect={handleDelete}
      className="text-destructive focus:text-destructive"
    >
      Excluir
      <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Regras**:
- `DropdownMenuTrigger asChild` obrigatório
- Preferência: sem ícones nos itens, salvo instrução específica
- Item destrutivo: `className="text-destructive focus:text-destructive"` — sem prop de variante
- `align="end"` no `DropdownMenuContent` quando o trigger é um botão de ação de linha

**Acessibilidade** (ver `11-acessibilidade.md`):
- `aria-label` contextual no trigger quando é icon-only — "Ações para [item]"
- Radix aplica `role="menu"` e `role="menuitem"` automaticamente
- Arrow keys navegam entre itens — comportamento nativo

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`): `menu_item_click` com `label` e `menu` (nome do menu pai).

---

## Hover Card

**Propósito**: card informativo que aparece ao passar o mouse sobre um trigger, exibindo contexto adicional.

**Quando usar**: preview de usuário ao passar sobre avatar ou nome, informações adicionais sobre um link, detalhes de item sem abrir modal. **Não usar em touch devices** — hover não existe em touchscreen.

**Estrutura de subcomponentes**:
```
HoverCard (openDelay, closeDelay)
├── HoverCardTrigger (asChild)
└── HoverCardContent (side, align)
```

**Implementação**:
```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

<HoverCard openDelay={700} closeDelay={300}>
  <HoverCardTrigger asChild>
    <Button variant="link" className="p-0 h-auto">
      @shadcn
    </Button>
  </HoverCardTrigger>
  <HoverCardContent
    side="bottom"
    align="start"
    className="w-80 bg-card text-card-foreground p-[var(--overlay-padding-sm)]"
  >
    <div className="flex gap-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src="..." alt="Foto de perfil de shadcn" />
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">shadcn</h4>
        <p className="text-sm text-muted-foreground">
          Criador do Shadcn/UI. Design system open-source.
        </p>
        <p className="text-xs text-muted-foreground">
          Membro desde janeiro de 2023
        </p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>
```

**Regras**:
- `openDelay={700}` — evita abertura acidental ao passar o mouse
- `closeDelay={300}` — dá tempo para o usuário mover o cursor para dentro do card
- O `HoverCardContent` suporta conteúdo interativo (links, botões) — use com moderação
- Nunca usar o HoverCard como **único meio** de acessar informação crítica — deve ser complementar
- Em touch: suprimir ou substituir por outro padrão (Tooltip via tap, link explícito)

**Acessibilidade** (ver `11-acessibilidade.md`):
- O Radix aplica `role="tooltip"` e gerencia foco automaticamente
- Conteúdo do HoverCard não é lido proativamente por leitores de tela — informação crítica deve estar disponível de outra forma

---

## Popover

**Propósito**: overlay flutuante com conteúdo rico, ativado por clique em um trigger.

**Quando usar**: formulários contextuais pequenos (filtro de data, seleção de cor), conteúdo interativo mais rico que um Tooltip mas sem necessidade de modal completo.

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

**Implementação**:
```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <CalendarIcon className="h-4 w-4 mr-2" aria-hidden="true" />
      Selecionar data
    </Button>
  </PopoverTrigger>
  <PopoverContent
    side="bottom"
    align="start"
    sideOffset={4}
    className="w-auto p-[var(--overlay-padding-sm)]"
  >
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      locale={ptBR}
    />
  </PopoverContent>
</Popover>
```

**Regras**:
- `PopoverTrigger asChild` para usar o Button como trigger sem elemento extra
- `side` e `align` no `PopoverContent` controlam o posicionamento — auto-flip nativo (collision detection)
- Não usar para ações críticas ou destrutivas — usar Dialog ou AlertDialog
- Fechar ao clicar fora é comportamento nativo — não reimplementar

**Acessibilidade** (ver `11-acessibilidade.md`):
- Radix aplica `role="dialog"` no `PopoverContent` e gerencia foco automaticamente
- `Escape` fecha o Popover e retorna foco ao trigger

---

## Sheet

**Propósito**: painel lateral deslizante baseado em Radix Dialog. Ideal para configurações, filtros avançados e navegação secundária em desktop.

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
        ├── Button (variant="outline") — Cancelar
        └── Button — Ação primária
```

**Implementação**:
```tsx
import {
  Sheet, SheetContent, SheetDescription,
  SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Filtros avançados</Button>
  </SheetTrigger>

  {/* side no SheetContent, não no Sheet */}
  <SheetContent
    side="right"
    className="bg-card text-card-foreground p-[var(--overlay-padding)] w-[400px] sm:w-[540px]"
  >
    <SheetHeader className="pb-4">
      <SheetTitle>Filtros avançados</SheetTitle>
      <SheetDescription>
        Configure os filtros para refinar os resultados da busca.
      </SheetDescription>
    </SheetHeader>

    <div className="space-y-4 flex-1 overflow-y-auto">
      {/* Conteúdo dos filtros */}
    </div>

    <SheetFooter className="pt-4 flex justify-end gap-2">
      <SheetClose asChild>
        <Button variant="outline">Cancelar</Button>
      </SheetClose>
      <Button onClick={handleApply}>Aplicar filtros</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Regras**:
- `side` fica no `SheetContent`, não no `Sheet` — valores: `"right"` | `"left"` | `"top"` | `"bottom"`
- `SheetTitle` e `SheetDescription` obrigatórios para acessibilidade
- Botões alinhados à direita via `flex justify-end` no footer
- Overlay (backdrop) escuro automático — não desabilitar
- `Escape` fecha o Sheet — comportamento nativo

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`): mesmo padrão do Dialog — `dialog_open`, `dialog_close`, `dialog_confirm` com `component: "sheet"`.

---

## Tooltip

**Propósito**: texto explicativo curto que aparece ao passar o mouse ou focar em um elemento.

**Quando usar**: explicar ação de botão icon-only, fornecer contexto adicional não crítico. **Não usar** para informações obrigatórias — deve ser complementar ao label visível.

> **Setup obrigatório**: `TooltipProvider` deve ser adicionado no root da aplicação (App.tsx). Sem ele, os tooltips **não aparecem**.

**Estrutura**:
```tsx
{/* App.tsx — uma vez no root */}
import { TooltipProvider } from "@/components/ui/tooltip"

<TooltipProvider delayDuration={400}>
  {/* resto da aplicação */}
</TooltipProvider>
```

**Implementação**:
```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

{/* Botão icon-only — caso de uso principal */}
<Tooltip>
  <TooltipTrigger asChild>
    <Button size="icon" aria-label="Salvar documento">
      <Save className="h-4 w-4" aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom">
    <p>Salvar</p>
  </TooltipContent>
</Tooltip>

{/* Botão desabilitado com tooltip — requer wrapper <span> */}
{/* disabled bloqueia eventos de pointer, impedindo o tooltip de abrir */}
<Tooltip>
  <TooltipTrigger asChild>
    <span tabIndex={0}>
      <Button disabled aria-label="Publicar artigo — preencha todos os campos obrigatórios">
        Publicar
      </Button>
    </span>
  </TooltipTrigger>
  <TooltipContent>
    <p>Preencha todos os campos obrigatórios</p>
  </TooltipContent>
</Tooltip>
```

**Regras**:
- `TooltipProvider` no root obrigatório — `delayDuration` configurado globalmente
- `TooltipTrigger asChild` para usar componentes existentes como trigger
- Conteúdo máximo: 2 linhas de texto — para mais, usar Popover
- **Não usar em touch devices** — o Tooltip não aparece sem hover
- Texto do tooltip: complementa o label, não repete — "Salvar" no botão, "Salvar como rascunho" no tooltip
- Botão desabilitado: envolver em `<span tabIndex={0}>` para que o tooltip funcione

**Acessibilidade** (ver `11-acessibilidade.md`):
- Radix aplica `role="tooltip"` e conecta via `aria-describedby` automaticamente
- Tooltip aparece no foco por teclado além do hover — comportamento nativo do Radix
- **Nunca usar o Tooltip como único portador de informação crítica** — deve complementar, não substituir

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Complementa o label visível: se o botão diz "Salvar", o tooltip pode dizer "Salvar como rascunho"
- Nunca repetir o label: botão "Editar" + tooltip "Editar" — inútil
- Sem ponto final em textos curtos de tooltip (1 linha)

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`): `tooltip_view` — rastrear apenas quando medir se usuários precisam de ajuda contextual em uma feature específica.

---

## Padrão Responsivo — Dialog (desktop) + Drawer (mobile)

Para overlays que precisam funcionar em ambos os contextos, o Shadcn recomenda renderizar `Dialog` em desktop e `Drawer` em mobile com o mesmo conteúdo.

```tsx
import { useMediaQuery } from "@/hooks/use-media-query" // hook customizado

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [query])
  return matches
}

// Conteúdo compartilhado entre Dialog e Drawer
function OverlayContent({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="space-y-4 py-4">
        {/* formulário ou conteúdo */}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave}>Salvar</Button>
      </div>
    </>
  )
}

// Componente responsivo
export function ResponsiveOverlay({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card text-card-foreground sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Atualize suas informações.</DialogDescription>
          </DialogHeader>
          <OverlayContent onClose={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card text-card-foreground">
        <DrawerHeader>
          <DrawerTitle>Editar perfil</DrawerTitle>
          <DrawerDescription>Atualize suas informações.</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <OverlayContent onClose={() => onOpenChange(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
```

**Regras**:
- Extrair o conteúdo para um componente separado — evita duplicação de JSX
- `useMediaQuery` implementado com `addEventListener` para reagir a mudanças de viewport
- Breakpoint padrão: `768px` (md) — alinhado com os breakpoints do Tailwind do projeto

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