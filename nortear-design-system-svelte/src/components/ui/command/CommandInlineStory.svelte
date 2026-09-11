<script lang="ts">
  // Nomes achatados (CommandGroup, CommandSeparator…) e não o namespace: é a
  // API que `anatomy.structureCode` ensina e a que os snippets do painel Code
  // escrevem.
  import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
    CommandShortcut,
  } from '@/components/ui/command';
  import {
    commandBlocks,
    NO_RESULT,
    type CommandEntry,
    type CommandEntryItem,
  } from './command.fixtures';

  /**
   * A paleta inline de TODA story que não precisa de hospedeiro — Playground,
   * variantes, estados e composições.
   *
   * A lista chega como dado, e é o mesmo dado que a transform do painel Code
   * lê (`command.source.ts`): o que a story desenha e o que o painel ensina
   * passam por `commandBlocks` e não têm como divergir. `search` é a busca com
   * que a paleta NASCE — o EmptyState já abre sem resultado, que é o quadro
   * que ele documenta.
   */
  // Tudo opcional: é o formato de props que o `render` de uma story aceita
  // (`Args` do Storybook não promete campo nenhum).
  let {
    placeholder = 'Buscar componente...',
    emptyMessage = NO_RESULT,
    items = [],
    search = '',
    onItemSelect,
    ...rest
  }: {
    placeholder?: string;
    emptyMessage?: string;
    items?: readonly CommandEntry[];
    search?: string;
    onItemSelect?: (value: string) => void;
    [key: string]: unknown;
  } = $props();

  const blocks = $derived(commandBlocks(items));
</script>

{#snippet row(item: CommandEntryItem)}
  <CommandItem
    value={item.value}
    disabled={item.disabled}
    checked={item.checked}
    onSelect={() => onItemSelect?.(item.value)}
  >
    {item.label}
    {#if item.shortcut}
      <CommandShortcut>{item.shortcut}</CommandShortcut>
    {/if}
  </CommandItem>
{/snippet}

<div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
  <Command {...rest}>
    <CommandInput {placeholder} value={search} />
    <CommandList>
      {#each blocks as block, index (index)}
        {#if block.kind === 'separator'}
          <CommandSeparator />
        {:else if block.kind === 'group'}
          <CommandGroup heading={block.heading}>
            {#each block.items as item (item.value)}
              {@render row(item)}
            {/each}
          </CommandGroup>
        {:else}
          <!-- Comandos sem grupo: grupo SEM cabeçalho, que dá o respiro de
               4px e não se anuncia como grupo — a forma da fábrica do Vanilla. -->
          <CommandGroup>
            {#each block.items as item (item.value)}
              {@render row(item)}
            {/each}
          </CommandGroup>
        {/if}
      {/each}
    </CommandList>
    <CommandEmpty>{emptyMessage}</CommandEmpty>
  </Command>
</div>
