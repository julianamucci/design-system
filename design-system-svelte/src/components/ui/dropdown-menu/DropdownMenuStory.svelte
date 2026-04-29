<script lang="ts">
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuGroup,
  } from './index';
  import { Button } from '@/components/ui/button';

  type Side = 'top' | 'bottom' | 'left' | 'right';
  type Align = 'start' | 'center' | 'end';
  type Variant =
    | 'default'
    | 'destructive'
    | 'withLabel'
    | 'withCheckbox'
    | 'withRadio'
    | 'withSubmenu'
    | 'withShortcuts'
    | 'itemDisabled';

  interface Props {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    modal?: boolean;
    defaultOpen?: boolean;
    open?: boolean;
    triggerLabel?: string;
    variant?: Variant;
  }

  let {
    side = 'bottom',
    align = 'start',
    sideOffset = 4,
    modal = true,
    defaultOpen = false,
    open = $bindable(undefined),
    triggerLabel = 'Mais ações',
    variant = 'default',
  }: Props = $props();

  // states for interactive variants
  let showStatusBar = $state(true);
  let showActivityBar = $state(false);
  let position = $state('bottom');
</script>

<div style="contain: layout">
  {#key `${side}-${align}-${defaultOpen}-${modal}-${variant}`}
    {#if open !== undefined}
      <DropdownMenu bind:open {modal}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{triggerLabel}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent {side} {align} {sideOffset}>
          {#if variant === 'destructive'}
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
          {:else if variant === 'withLabel'}
            <DropdownMenuLabel>Conta</DropdownMenuLabel>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
          {:else if variant === 'withCheckbox'}
            <DropdownMenuLabel>Visualização</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showStatusBar}
              onCheckedChange={(v) => (showStatusBar = v)}
            >
              Status bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showActivityBar}
              onCheckedChange={(v) => (showActivityBar = v)}
            >
              Activity bar
            </DropdownMenuCheckboxItem>
          {:else if variant === 'withRadio'}
            <DropdownMenuLabel>Posição</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup bind:value={position}>
              <DropdownMenuRadioItem value="top">Topo</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="bottom">Inferior</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="right">Direita</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          {:else if variant === 'withSubmenu'}
            <DropdownMenuItem>Novo arquivo</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Exportar como</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>PDF</DropdownMenuItem>
                <DropdownMenuItem>CSV</DropdownMenuItem>
                <DropdownMenuItem>JSON</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
          {:else if variant === 'withShortcuts'}
            <DropdownMenuItem>
              Salvar
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Duplicar
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              Excluir
              <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          {:else if variant === 'itemDisabled'}
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem disabled>Arquivar (indisponível)</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
          {:else}
            <DropdownMenuGroup>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuItem>Equipe</DropdownMenuItem>
            </DropdownMenuGroup>
          {/if}
        </DropdownMenuContent>
      </DropdownMenu>
    {:else}
      <DropdownMenu {defaultOpen} {modal}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{triggerLabel}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent {side} {align} {sideOffset}>
          {#if variant === 'destructive'}
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
          {:else if variant === 'withLabel'}
            <DropdownMenuLabel>Conta</DropdownMenuLabel>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
          {:else if variant === 'withCheckbox'}
            <DropdownMenuLabel>Visualização</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showStatusBar}
              onCheckedChange={(v) => (showStatusBar = v)}
            >
              Status bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showActivityBar}
              onCheckedChange={(v) => (showActivityBar = v)}
            >
              Activity bar
            </DropdownMenuCheckboxItem>
          {:else if variant === 'withRadio'}
            <DropdownMenuLabel>Posição</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup bind:value={position}>
              <DropdownMenuRadioItem value="top">Topo</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="bottom">Inferior</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="right">Direita</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          {:else if variant === 'withSubmenu'}
            <DropdownMenuItem>Novo arquivo</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Exportar como</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>PDF</DropdownMenuItem>
                <DropdownMenuItem>CSV</DropdownMenuItem>
                <DropdownMenuItem>JSON</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
          {:else if variant === 'withShortcuts'}
            <DropdownMenuItem>
              Salvar
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Duplicar
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              Excluir
              <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          {:else if variant === 'itemDisabled'}
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem disabled>Arquivar (indisponível)</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
          {:else}
            <DropdownMenuGroup>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuItem>Equipe</DropdownMenuItem>
            </DropdownMenuGroup>
          {/if}
        </DropdownMenuContent>
      </DropdownMenu>
    {/if}
  {/key}
</div>
