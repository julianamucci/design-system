<script lang="ts">
  // Nomes achatados: é a API que a docs page ensina, e `CommandShortcut` só
  // existia exportado — nenhuma story o renderizava por esse nome.
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
</script>

<div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
  <Command>
    <CommandInput placeholder="Buscar ação..." />
    <CommandList>
      <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      <CommandGroup heading="Ações">
        <CommandItem value="new-file">
          Novo arquivo
          <CommandShortcut>⌘N</CommandShortcut>
        </CommandItem>
        <CommandItem value="open-file">
          Abrir arquivo
          <CommandShortcut>⌘O</CommandShortcut>
        </CommandItem>
        <CommandItem value="save-file">
          Salvar
          <CommandShortcut>⌘S</CommandShortcut>
        </CommandItem>
        <CommandItem value="find">
          Buscar
          <CommandShortcut>⌘F</CommandShortcut>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Navegação">
        <CommandItem value="settings">
          Configurações
          <CommandShortcut>⌘,</CommandShortcut>
        </CommandItem>
        <CommandItem value="command-palette">
          Command Palette
          <CommandShortcut>⌘K</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</div>
