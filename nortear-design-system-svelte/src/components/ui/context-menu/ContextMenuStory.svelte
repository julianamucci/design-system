<script lang="ts">
  // Os rótulos são texto puro e chegam por `args` — `triggerLabel` é inclusive
  // um control de texto editável no painel do Storybook. Renderizar por `{@html}`
  // abria um sink de HTML para uma entrada que nunca precisou de markup; a saída
  // é idêntica com interpolação de texto, e some a superfície de ataque
  // (guideline 09: se não precisa de HTML, não use HTML).
  import * as ContextMenu from '@/components/ui/context-menu';
  import { AREA_CLICK_DIREITO } from '@shared/testing/context-menu-area';

  let {
    triggerLabel = 'Clique com o botão direito aqui',
    editLabel = 'Editar',
    duplicateLabel = 'Duplicar',
    deleteLabel = 'Excluir',
    editShortcut = 'Ctrl+E',
    deleteShortcut = 'Delete',
    showDestructive = true,
    showShortcuts = true,
  }: {
    triggerLabel?: string;
    editLabel?: string;
    duplicateLabel?: string;
    deleteLabel?: string;
    editShortcut?: string;
    deleteShortcut?: string;
    showDestructive?: boolean;
    showShortcuts?: boolean;
  } = $props();
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger
    class={AREA_CLICK_DIREITO}
    data-align="center"
    data-justify="center"
    data-testid="area"
  >
    {triggerLabel}
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Group>
      <ContextMenu.Item>
        {editLabel}
        {#if showShortcuts}
          <ContextMenu.Shortcut>{editShortcut}</ContextMenu.Shortcut>
        {/if}
      </ContextMenu.Item>
      <ContextMenu.Item>{duplicateLabel}</ContextMenu.Item>
    </ContextMenu.Group>
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
