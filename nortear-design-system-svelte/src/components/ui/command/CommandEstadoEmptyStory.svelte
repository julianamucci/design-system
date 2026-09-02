<script lang="ts">
  import * as Command from '@/components/ui/command';
</script>

<div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar componente..." />
    <Command.List>
      <Command.Group heading="Componentes">
        <Command.Item value="button">Button</Command.Item>
        <Command.Item value="input">Input</Command.Item>
      </Command.Group>
    </Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
  </Command.Root>
</div>
