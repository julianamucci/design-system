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
    DropdownMenuGroupHeading,
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
    defaultOpen?: boolean;
    open?: boolean;
    triggerLabel?: string;
    variant?: Variant;
  }
  // `defaultOpen` não existe no bits-ui nem no vaul-svelte: a prop era
  // passada, ignorada, e o overlay nunca abria. A API real é `open`
  // (bindable). Inicializar `open` com `defaultOpen` cobre os dois usos e
  // apaga o ramo duplicado que existia só para o caso não controlado.

  let {
    side = 'bottom',
    align = 'start',
    sideOffset = 4,
    defaultOpen = false,
    open = $bindable(defaultOpen),
    triggerLabel = 'Mais ações',
    variant = 'default',
  }: Props = $props();

  // states for interactive variants
  let showStatusBar = $state(true);
  let showActivityBar = $state(false);
  let position = $state('bottom');
</script>

<div style="contain: layout">
  {#key `${side}-${align}-${defaultOpen}-${variant}`}
      <!--
        Sem `modal`: a prop não existe na API deste primitivo — era passada,
        aceita e ignorada em silêncio, e o control do Storybook não mudava nada.
        Divergência de API de framework não se alinha: fica registrada aqui, e o
        control saiu junto, porque control morto é pior que control ausente.
      -->
      <DropdownMenu bind:open>
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
            <!--
              `Group` + `GroupHeading` é a dupla que dá NOME ao agrupamento: o
              heading vira o `aria-labelledby` do grupo, e sem ele o leitor de
              tela anuncia "grupo" sem dizer de qual bloco se trata. Um `Label`
              solto rotula visualmente e não nomeia nada.
            -->
            <DropdownMenuGroup>
              <DropdownMenuGroupHeading>Conta</DropdownMenuGroupHeading>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuGroupHeading>Suporte</DropdownMenuGroupHeading>
              <DropdownMenuItem>Documentação</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
            </DropdownMenuGroup>
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
  {/key}
</div>
