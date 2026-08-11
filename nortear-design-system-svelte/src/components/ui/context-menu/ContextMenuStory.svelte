<script lang="ts">
  // Os rótulos são texto puro e chegam por `args` — `triggerLabel` é inclusive
  // um control de texto editável no painel do Storybook. Renderizar por `{@html}`
  // abria um sink de HTML para uma entrada que nunca precisou de markup; a saída
  // é idêntica com interpolação de texto, e some a superfície de ataque
  // (guideline 09: se não precisa de HTML, não use HTML).
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
    class="nds-cluster nds-rounded-lg border-2 nds-border-dashed nds-bg-muted-30 nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: 8rem; width: 16rem" data-align="center" data-justify="center" 
  >
    {triggerLabel}
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item>
      {editLabel}
      {#if showShortcuts}
        <ContextMenu.Shortcut>{editShortcut}</ContextMenu.Shortcut>
      {/if}
    </ContextMenu.Item>
    <ContextMenu.Item>{duplicateLabel}</ContextMenu.Item>
    <ContextMenu.Item>{shareLabel}</ContextMenu.Item>
    {#if showDestructive}
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive">
        {deleteLabel}
        {#if showShortcuts}
          <ContextMenu.Shortcut>{deleteShortcut}</ContextMenu.Shortcut>
        {/if}
      </ContextMenu.Item>
    {/if}
  </ContextMenu.Content>
</ContextMenu.Root>
