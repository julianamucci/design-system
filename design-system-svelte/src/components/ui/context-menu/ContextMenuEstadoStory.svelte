<script lang="ts">
  import * as ContextMenu from '@/components/ui/context-menu';

  type Estado = 'disabled' | 'inset';

  let { estado = 'disabled' as Estado }: { estado?: Estado } = $props();
</script>

{#if estado === 'disabled'}
  <ContextMenu.Root>
    <ContextMenu.Trigger
      class="flex h-32 w-64 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default"
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
      class="flex h-32 w-64 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default"
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
