<script lang="ts">
  import * as ContextMenu from '@/components/ui/context-menu';

  type Estado = 'disabled' | 'inset';

  let { estado = 'disabled' as Estado }: { estado?: Estado } = $props();
</script>

{#if estado === 'disabled'}
  <ContextMenu.Root>
    <ContextMenu.Trigger
      class="nds-cluster nds-rounded-lg border-2 border-dashed bg-muted/30 nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: 8rem; width: 16rem" data-align="center" data-justify="center" 
    >
      Clique com o botão direito aqui
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      <ContextMenu.Item>Editar</ContextMenu.Item>
      <ContextMenu.Item disabled>
        Duplicar (desabilitado)
      </ContextMenu.Item>
      <ContextMenu.Item>Compartilhar</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive" disabled>
        Excluir (desabilitado)
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if estado === 'inset'}
  <ContextMenu.Root>
    <ContextMenu.Trigger
      class="nds-cluster nds-rounded-lg border-2 border-dashed bg-muted/30 nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: 8rem; width: 16rem" data-align="center" data-justify="center" 
    >
      Clique com o botão direito aqui
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      <ContextMenu.Label inset>Ações</ContextMenu.Label>
      <ContextMenu.Item inset>Editar</ContextMenu.Item>
      <ContextMenu.Item inset>Duplicar</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item inset variant="destructive">Excluir</ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/if}
