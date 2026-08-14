<script lang="ts">
  import * as Command from '@/components/ui/command';

  let { onItemSelect }: { onItemSelect?: (value: string) => void } = $props();
</script>

<div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar comando..." />
    <Command.List>
      <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
      <Command.Group heading="Arquivo">
        <Command.Item value="novo" onSelect={() => onItemSelect?.('novo')}>Novo</Command.Item>
        <Command.Item
          value="arquivar"
          disabled={true}
          onSelect={() => onItemSelect?.('arquivar')}
        >
          Arquivar
        </Command.Item>
        <Command.Item value="renomear" onSelect={() => onItemSelect?.('renomear')}>
          Renomear
        </Command.Item>
      </Command.Group>
    </Command.List>
  </Command.Root>
</div>
