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
    class="nds-cluster nds-rounded-lg border-2 border-dashed bg-muted/30 nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: 8rem; width: 16rem" data-align="center" data-justify="center" 
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
