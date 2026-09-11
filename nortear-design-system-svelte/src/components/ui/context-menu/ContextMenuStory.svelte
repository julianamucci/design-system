<script lang="ts">
  // Os rótulos são texto puro e chegam por `args` — `triggerLabel` é inclusive
  // um control de texto editável no painel do Storybook. Renderizar por `{@html}`
  // abria um sink de HTML para uma entrada que nunca precisou de markup; a saída
  // é idêntica com interpolação de texto, e some a superfície de ataque
  // (guideline 09: se não precisa de HTML, não use HTML).
  //
  // O menu é o do vanilla: duas ações, a divisória e a ação destrutiva, sem
  // grupo — grupo sem rótulo não agrupa nada para quem ouve. A divisória tem
  // control próprio, e `onOpenChange` chega da story como espião.
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
    showSeparator = true,
    showShortcuts = true,
    onOpenChange,
  }: {
    triggerLabel?: string;
    editLabel?: string;
    duplicateLabel?: string;
    deleteLabel?: string;
    editShortcut?: string;
    deleteShortcut?: string;
    showDestructive?: boolean;
    showSeparator?: boolean;
    showShortcuts?: boolean;
    onOpenChange?: (open: boolean) => void;
  } = $props();
</script>

<ContextMenu.Root {onOpenChange}>
  <ContextMenu.Trigger
    class={AREA_CLICK_DIREITO}
    data-align="center"
    data-justify="center"
    data-testid="area"
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
    {#if showSeparator}
      <ContextMenu.Separator />
    {/if}
    {#if showDestructive}
      <ContextMenu.Item variant="destructive">
        {deleteLabel}
        {#if showShortcuts}
          <ContextMenu.Shortcut>{deleteShortcut}</ContextMenu.Shortcut>
        {/if}
      </ContextMenu.Item>
    {/if}
  </ContextMenu.Content>
</ContextMenu.Root>
