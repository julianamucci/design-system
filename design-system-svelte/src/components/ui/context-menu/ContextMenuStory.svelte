<script lang="ts">
  import * as ContextMenu from '@/components/ui/context-menu';

  let {
    triggerLabel = 'Clique com o botão direito aqui',
    editLabel = 'Editar',
    duplicateLabel = 'Duplicar',
    shareLabel = 'Compartilhar',
    deleteLabel = 'Excluir',
    editShortcut = '⌘E',
    deleteShortcut = '⌫',
    showDestructive = true,
    showShortcuts = true,
  }: {
    triggerLabel?: string;
    editLabel?: string;
    duplicateLabel?: string;
    shareLabel?: string;
    deleteLabel?: string;
    editShortcut?: string;
    deleteShortcut?: string;
    showDestructive?: boolean;
    showShortcuts?: boolean;
  } = $props();
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger
    class="flex h-32 w-64 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default"
  >
    {@html triggerLabel}
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item>
      {@html editLabel}
      {#if showShortcuts}
        <ContextMenu.Shortcut>{editShortcut}</ContextMenu.Shortcut>
      {/if}
    </ContextMenu.Item>
    <ContextMenu.Item>{@html duplicateLabel}</ContextMenu.Item>
    <ContextMenu.Item>{@html shareLabel}</ContextMenu.Item>
    {#if showDestructive}
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive">
        {@html deleteLabel}
        {#if showShortcuts}
          <ContextMenu.Shortcut>{deleteShortcut}</ContextMenu.Shortcut>
        {/if}
      </ContextMenu.Item>
    {/if}
  </ContextMenu.Content>
</ContextMenu.Root>
