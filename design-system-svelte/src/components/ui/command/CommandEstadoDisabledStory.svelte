<script lang="ts">
  import * as Command from '@/components/ui/command';
</script>

<div class="w-full max-w-sm rounded-xl border shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar componente..." aria-controls="cmd-disabled-listbox" />
    <Command.List id="cmd-disabled-listbox">
      <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
      <Command.Group heading="Componentes">
        <Command.Item value="button">Button</Command.Item>
        <Command.Item value="input" disabled={true}>Input (desabilitado)</Command.Item>
        <Command.Item value="select">Select</Command.Item>
      </Command.Group>
    </Command.List>
  </Command.Root>
</div>
