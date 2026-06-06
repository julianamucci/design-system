<script lang="ts">
  import * as Command from '@/components/ui/command';
</script>

<div class="w-full max-w-sm rounded-xl border shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar componente..." aria-controls="cmd-empty-listbox" />
    <Command.List id="cmd-empty-listbox">
      <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
      <Command.Group heading="Componentes">
        <Command.Item value="button">Button</Command.Item>
        <Command.Item value="input">Input</Command.Item>
      </Command.Group>
    </Command.List>
  </Command.Root>
</div>
