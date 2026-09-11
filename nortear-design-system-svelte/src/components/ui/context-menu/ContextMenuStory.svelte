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
  import { Button } from '@/components/ui/button';
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
    neighbors = false,
    withSubmenu = false,
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
    /**
     * Botões antes e depois da área, que dão DESTINO ao Tab que sai do menu —
     * a story `TabLeavesMenu` mede para onde o foco vai.
     */
    neighbors?: boolean;
    /**
     * O submenu "Compartilhar", o do vanilla na mesma story: é de dentro dele
     * que o Tab também tem de fechar o menu inteiro (F12).
     */
    withSubmenu?: boolean;
    onOpenChange?: (open: boolean) => void;
  } = $props();
</script>

<div class={neighbors ? 'nds-cluster' : undefined} data-spacing={neighbors ? 'md' : undefined}>
  {#if neighbors}<Button variant="ghost">Antes</Button>{/if}
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
      {#if withSubmenu}
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>Compartilhar</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>Por e-mail</ContextMenu.Item>
            <ContextMenu.Item>Por link</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      {/if}
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
  {#if neighbors}<Button variant="ghost">Depois</Button>{/if}
</div>
