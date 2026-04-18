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

Bits UI usa um padrão de builder para passar props de acessibilidade ao trigger customizado:

```svelte
<DialogTrigger asChild let:builder>
  <Button builders={[builder]}>Abrir dialog</Button>
</DialogTrigger>
```

---

## Alert Dialog

**Propósito**: modal de confirmação para ações críticas ou irreversíveis. Sem botão X — exige resposta explícita.

**Quando usar**: excluir conta, remover dados permanentemente, cancelar assinatura.

**Implementação**:
```svelte
<script lang="ts">
  import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger
  } from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
</script>

<AlertDialog>
  <AlertDialogTrigger asChild let:builder>
    <Button builders={[builder]} variant="destructive">Excluir conta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent class="bg-card text-card-foreground">
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta ação não pode ser desfeita. Todos os seus dados serão removidos permanentemente dos nossos servidores.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Excluir conta
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Regras de UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Título: ação no infinitivo com consequência — "Excluir conta permanentemente?"
- Descrição: consequência concreta sem culpar o usuário
- Botão destrutivo: repete o verbo do título — "Excluir conta"
- Botão cancelar: sempre "Cancelar" — à esquerda

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
```svelte
<script lang="ts">
  import { track } from '$lib/analytics';
</script>

<AlertDialog onOpenChange={(open) => {
  if (open) track('dialog_open', { component: 'alert_dialog', trigger: 'button' });
}}>
  <AlertDialogTrigger asChild let:builder>
    <Button builders={[builder]} variant="destructive">Excluir conta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <!-- ... -->
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onclick={() => track('dialog_confirm', { component: 'alert_dialog' })}>
        Excluir conta
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Dialog

**Propósito**: modal para formulários, edição, criação ou visualização de conteúdo.

**Implementação**:
```svelte
<script lang="ts">
  import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger
  } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
</script>

<Dialog>
  <DialogTrigger asChild let:builder>
    <Button builders={[builder]}>Editar perfil</Button>
  </DialogTrigger>
  <DialogContent class="bg-card text-card-foreground sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais. Clique em Salvar quando terminar.
      </DialogDescription>
    </DialogHeader>
    <!-- Conteúdo do dialog (form) -->
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button type="submit">Salvar alterações</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Obrigatório**: `DialogTitle` e `DialogDescription` em todo Dialog.

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
```svelte
<Dialog onOpenChange={(open) => {
  if (open) track('dialog_open', { component: 'dialog', trigger: 'button' });
  else track('dialog_close', { component: 'dialog' });
}}>
```

---

## Drawer

**Propósito**: painel deslizante a partir de uma borda da tela — mobile-first.

**Implementação**:
```svelte
<script lang="ts">
  import {
    Drawer, DrawerClose, DrawerContent, DrawerDescription,
    DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger
  } from '$lib/components/ui/drawer';
  import { Button } from '$lib/components/ui/button';
</script>

<!-- direction é prop do <Drawer>, não do <DrawerContent> -->
<Drawer direction="bottom">
  <DrawerTrigger asChild let:builder>
    <Button builders={[builder]}>Abrir drawer</Button>
  </DrawerTrigger>
  <DrawerContent class="bg-card text-card-foreground">
    <DrawerHeader>
      <DrawerTitle>Filtrar resultados</DrawerTitle>
      <DrawerDescription>Selecione os filtros desejados.</DrawerDescription>
    </DrawerHeader>
    <!-- Conteúdo -->
    <DrawerFooter>
      <Button>Aplicar filtros</Button>
      <DrawerClose asChild let:builder>
        <Button builders={[builder]} variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

**Atenção**: `direction` é prop de `<Drawer>` — não de `<DrawerContent>`.

---

## Dropdown Menu

**Propósito**: menu contextual de ações para um elemento.

**Implementação**:
```svelte
<script lang="ts">
  import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
  } from '$lib/components/ui/dropdown-menu';
  import { Button } from '$lib/components/ui/button';
  import { MoreHorizontal } from 'lucide-svelte';
</script>

<DropdownMenu>
  <DropdownMenuTrigger asChild let:builder>
    <Button builders={[builder]} variant="ghost" size="icon" aria-label="Opções do produto Cadeira Gamer Pro">
      <MoreHorizontal class="h-4 w-4" aria-hidden="true" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Ações</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuItem class="text-destructive focus:text-destructive">
      Excluir
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Popover

**Propósito**: painel flutuante para controles auxiliares (datepicker, filtro avançado, seletor de cor).

**Implementação**:
```svelte
<script lang="ts">
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Button } from '$lib/components/ui/button';
</script>

<Popover>
  <PopoverTrigger asChild let:builder>
    <Button builders={[builder]} variant="outline">Filtros avançados</Button>
  </PopoverTrigger>
  <PopoverContent class="w-80" align="start">
    <!-- Conteúdo do popover -->
  </PopoverContent>
</Popover>
```

---

## Sheet

**Propósito**: painel lateral persistente (sidebar ou formulário de edição).

**Implementação**:
```svelte
<script lang="ts">
  import {
    Sheet, SheetContent, SheetDescription,
    SheetHeader, SheetTitle, SheetTrigger
  } from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';
</script>

<Sheet>
  <SheetTrigger asChild let:builder>
    <Button builders={[builder]}>Configurações</Button>
  </SheetTrigger>
  <SheetContent class="bg-card text-card-foreground" side="right">
    <SheetHeader>
      <SheetTitle>Configurações</SheetTitle>
      <SheetDescription>Gerencie suas preferências do sistema.</SheetDescription>
    </SheetHeader>
    <!-- Conteúdo -->
  </SheetContent>
</Sheet>
```

**Obrigatório**: `SheetTitle` e `SheetDescription` em todo Sheet.

---

## Tooltip

**Propósito**: informação contextual breve que aparece ao hover/focus em um elemento.

**Implementação**:
```svelte
<script lang="ts">
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';
  import { Button } from '$lib/components/ui/button';
  import { Settings } from 'lucide-svelte';
</script>

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild let:builder>
      <Button builders={[builder]} variant="ghost" size="icon" aria-label="Configurações da conta">
        <Settings class="h-4 w-4" aria-hidden="true" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Configurações</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Regras**:
- `TooltipProvider` deve envolver todos os tooltips (idealmente no root do app)
- Tooltip complementa o `aria-label` — não o substitui
- Evitar em mobile — preferir Popover para compatibilidade touch

---

## Command (Combobox)

**Propósito**: busca e seleção de items em lista — substitui Select quando busca é necessária.

**Implementação**:
```svelte
<script lang="ts">
  import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '$lib/components/ui/command';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Button } from '$lib/components/ui/button';
  import { Check, ChevronsUpDown } from 'lucide-svelte';
  import { cn } from '$lib/utils';

  let aberto = $state(false);
  let valorSelecionado = $state('');

  const opcoes = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' },
  ];
</script>

<Popover bind:open={aberto}>
  <PopoverTrigger asChild let:builder>
    <Button
      builders={[builder]}
      variant="outline"
      role="combobox"
      aria-expanded={aberto}
      class="w-[200px] justify-between"
    >
      {valorSelecionado || 'Selecione um framework...'}
      <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
    </Button>
  </PopoverTrigger>
  <PopoverContent class="w-[200px] p-0">
    <Command>
      <CommandInput placeholder="Buscar framework..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup>
          {#each opcoes as opcao (opcao.value)}
            <CommandItem
              value={opcao.value}
              onSelect={(currentValue) => {
                valorSelecionado = currentValue === valorSelecionado ? '' : currentValue;
                aberto = false;
              }}
            >
              <Check
                class={cn('mr-2 h-4 w-4', valorSelecionado === opcao.value ? 'opacity-100' : 'opacity-0')}
                aria-hidden="true"
              />
              {opcao.label}
            </CommandItem>
          {/each}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```
