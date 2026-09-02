<script lang="ts">
  // Nomes achatados (CommandGroup, CommandSeparator…) e não o namespace: é a
  // API que `anatomy.structureCode` ensina, e enquanto só o namespace era usado
  // esses apelidos existiam exportados sem nada renderizá-los.
  import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
  } from '@/components/ui/command';

  let {
    placeholder = 'Buscar componente...',
    emptyMessage = 'Nenhum resultado encontrado.',
    onItemSelect,
    ...rest
  }: {
    placeholder?: string;
    emptyMessage?: string;
    onItemSelect?: (value: string) => void;
    [key: string]: unknown;
  } = $props();
</script>

<div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
  <Command {...rest}>
    <CommandInput {placeholder} />
    <CommandList>
      <CommandGroup heading="Componentes">
        <CommandItem value="button" onSelect={() => onItemSelect?.('button')}>Button</CommandItem>
        <CommandItem value="input" onSelect={() => onItemSelect?.('input')}>Input</CommandItem>
        <CommandItem value="separator" onSelect={() => onItemSelect?.('separator')}>Separator</CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Utilitários">
        <CommandItem value="cn" onSelect={() => onItemSelect?.('cn')}>cn()</CommandItem>
        <CommandItem value="clsx" onSelect={() => onItemSelect?.('clsx')}>clsx()</CommandItem>
      </CommandGroup>
    </CommandList>
    <CommandEmpty>{emptyMessage}</CommandEmpty>
  </Command>
</div>
