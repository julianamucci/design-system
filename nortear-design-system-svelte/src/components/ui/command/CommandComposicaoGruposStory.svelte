<script lang="ts">
  import * as Command from '@/components/ui/command';
</script>

<!-- Mesmo exemplo da seção "Com grupos" da docs page (codeCompWithGroups). -->
<div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar componente..." />
    <Command.List>
      <Command.Group heading="Componentes">
        <Command.Item value="button">Button</Command.Item>
        <Command.Item value="input">Input</Command.Item>
        <Command.Item value="badge">Badge</Command.Item>
        <Command.Item value="separator">Separator</Command.Item>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Utilitários">
        <Command.Item value="cn">cn()</Command.Item>
        <Command.Item value="clsx">clsx()</Command.Item>
        <Command.Item value="twmerge">twMerge()</Command.Item>
      </Command.Group>
    </Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
  </Command.Root>
</div>
