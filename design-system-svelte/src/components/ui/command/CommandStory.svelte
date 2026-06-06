<script lang="ts">
  import * as Command from '@/components/ui/command';

  let {
    label = 'Label',
    placeholder = 'Buscar...',
    emptyMessage = 'Nenhum resultado encontrado.',
    ...rest
  }: {
    label?: string;
    placeholder?: string;
    emptyMessage?: string;
    [key: string]: unknown;
  } = $props();
</script>

<div class="w-full max-w-sm rounded-xl border shadow-md">
  <Command.Root {...rest}>
    <Command.Input {placeholder} aria-controls="command-story-listbox" />
    <Command.List id="command-story-listbox">
      <Command.Empty>{emptyMessage}</Command.Empty>
      <Command.Group heading="Componentes">
        <Command.Item value="button">Button</Command.Item>
        <Command.Item value="input">Input</Command.Item>
        <Command.Item value="select">Select</Command.Item>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Utilitários">
        <Command.Item value="separator">Separator</Command.Item>
        <Command.Item value="badge">Badge</Command.Item>
      </Command.Group>
    </Command.List>
  </Command.Root>
</div>
