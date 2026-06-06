<script lang="ts">
  import * as Command from '@/components/ui/command';
</script>

<div class="w-full max-w-sm rounded-xl border shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar ação..." aria-controls="cmd-shortcuts-listbox" />
    <Command.List id="cmd-shortcuts-listbox">
      <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
      <Command.Group heading="Ações">
        <Command.Item value="new-file">
          Novo arquivo
          <Command.Shortcut>⌘N</Command.Shortcut>
        </Command.Item>
        <Command.Item value="open-file">
          Abrir arquivo
          <Command.Shortcut>⌘O</Command.Shortcut>
        </Command.Item>
        <Command.Item value="save-file">
          Salvar
          <Command.Shortcut>⌘S</Command.Shortcut>
        </Command.Item>
        <Command.Item value="find">
          Buscar
          <Command.Shortcut>⌘F</Command.Shortcut>
        </Command.Item>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Navegação">
        <Command.Item value="settings">
          Configurações
          <Command.Shortcut>⌘,</Command.Shortcut>
        </Command.Item>
        <Command.Item value="command-palette">
          Command Palette
          <Command.Shortcut>⌘K</Command.Shortcut>
        </Command.Item>
      </Command.Group>
    </Command.List>
  </Command.Root>
</div>
