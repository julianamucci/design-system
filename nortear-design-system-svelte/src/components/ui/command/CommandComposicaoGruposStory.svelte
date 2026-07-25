<script lang="ts">
  import * as Command from '@/components/ui/command';
</script>

<div class="nds-w-full nds-max-w-sm rounded-xl nds-border-default nds-shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar componente..." aria-controls="cmd-grupos-listbox" />
    <Command.List id="cmd-grupos-listbox">
      <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
      <Command.Group heading="Componentes">
        <Command.Item value="button">Button</Command.Item>
        <Command.Item value="input">Input</Command.Item>
        <Command.Item value="select">Select</Command.Item>
        <Command.Item value="textarea">Textarea</Command.Item>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Utilitários">
        <Command.Item value="separator">Separator</Command.Item>
        <Command.Item value="badge">Badge</Command.Item>
        <Command.Item value="tooltip">Tooltip</Command.Item>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Overlay">
        <Command.Item value="dialog">Dialog</Command.Item>
        <Command.Item value="popover">Popover</Command.Item>
        <Command.Item value="command">Command</Command.Item>
      </Command.Group>
    </Command.List>
  </Command.Root>
</div>
