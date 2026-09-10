<script lang="ts">
  import { Button } from '@/components/ui/button';
  import {
    CommandDialog,
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
    type CommandEntryItem,
    NO_RESULT,
    PALETTE_DESCRIPTION,
    PALETTE_ITEMS,
    PALETTE_SHORTCUT,
    PALETTE_TITLE,
    PALETTE_TRIGGER,
  } from './command.source';

  let { onCommandRun }: { onCommandRun?: (value: string) => void } = $props();

  let open = $state(false);

  /** A mesma lista que `commandPaletteSource` escreve no painel Code. */
  const blocks = commandBlocks(PALETTE_ITEMS);

  function handleSelect(value: string) {
    // Escolher executa E fecha: é o gesto inteiro da paleta, e a lib não fecha
    // o hospedeiro sozinha (`usage.guidelines.item2`).
    open = false;
    onCommandRun?.(value);
  }

  // O Ctrl+K não é nativo de componente nenhum — é um ouvinte de janela, e é o
  // consumidor que o registra. Nasce com a story e MORRE com ela: um ouvinte
  // de janela que sobrevive à troca de story vira flake em qualquer teste que
  // use a mesma tecla.
  $effect(() => {
    function onKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        // Sem isto o navegador leva o Cmd+K para a barra de endereço.
        event.preventDefault();
        // `= true`, e não um alternador: o atalho existe para ABRIR a paleta, e
        // repetir a tecla não pode fechar o que se acabou de pedir.
        open = true;
      }
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  });
</script>

{#snippet row(item: CommandEntryItem)}
  <CommandItem value={item.value} onSelect={() => handleSelect(item.value)}>
    {item.label}
    {#if item.shortcut}
      <CommandShortcut>{item.shortcut}</CommandShortcut>
    {/if}
  </CommandItem>
{/snippet}

<!-- A dica do atalho mora DENTRO do gatilho, e sem `aria-label`: o nome do
     botão sai do texto visível (WCAG 2.5.3, Label in Name) — quem usa comando
     de voz fala o que vê. Forma da story do Vanilla.

     `aria-haspopup` e `aria-expanded` à mão: o CommandDialog não expõe
     gatilho, então quem abre é um botão comum, e ele precisa anunciar ANTES
     do clique que abre um diálogo — e depois, se o diálogo está aberto. É o
     par que o Dialog do Vanilla escreve no gatilho dele. -->
<Button
  variant="outline"
  aria-haspopup="dialog"
  aria-expanded={open ? 'true' : 'false'}
  onclick={() => (open = true)}
>
  {PALETTE_TRIGGER}
  <kbd class="nds-kbd">{PALETTE_SHORTCUT}</kbd>
</Button>

<CommandDialog bind:open title={PALETTE_TITLE} description={PALETTE_DESCRIPTION}>
  <CommandInput placeholder="Buscar componente..." />
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
        <!-- Comandos sem grupo: grupo SEM cabeçalho (ver CommandInlineStory). -->
        <CommandGroup>
          {#each block.items as item (item.value)}
            {@render row(item)}
          {/each}
        </CommandGroup>
      {/if}
    {/each}
  </CommandList>
  <CommandEmpty>{NO_RESULT}</CommandEmpty>
</CommandDialog>
