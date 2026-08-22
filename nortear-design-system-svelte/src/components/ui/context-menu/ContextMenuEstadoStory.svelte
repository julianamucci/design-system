<script lang="ts">
  import * as ContextMenu from '@/components/ui/context-menu';
  import { AREA_CLICK_DIREITO } from '@shared/testing/context-menu-area';

  type State = 'disabled' | 'inset' | 'destructive' | 'dark' | 'indeterminate';

  let { estado = 'disabled' as State }: { estado?: State } = $props();
</script>

{#snippet area()}
  <ContextMenu.Trigger
    class={AREA_CLICK_DIREITO}
    data-align="center"
    data-justify="center"
    data-testid="area"
  >
    Clique com o botão direito aqui
  </ContextMenu.Trigger>
{/snippet}

{#if estado === 'disabled'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Group>
        <ContextMenu.Item data-testid="primeiro">Editar</ContextMenu.Item>
        <ContextMenu.Item disabled data-testid="off">Duplicar</ContextMenu.Item>
        <ContextMenu.Item data-testid="ultimo">Renomear</ContextMenu.Item>
      </ContextMenu.Group>
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive" disabled data-testid="perigo-off">
        Excluir
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if estado === 'inset'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Label inset>Arquivo</ContextMenu.Label>
      <ContextMenu.Item data-testid="normal">Editar</ContextMenu.Item>
      <ContextMenu.Item inset data-testid="recuado">Duplicar</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item inset variant="destructive">Excluir</ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if estado === 'destructive'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Item data-testid="normal">
        Editar
        <ContextMenu.Shortcut>⌘E</ContextMenu.Shortcut>
      </ContextMenu.Item>
      <ContextMenu.Item>Duplicar</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive" data-testid="perigo">
        Excluir permanentemente
        <ContextMenu.Shortcut>⌫</ContextMenu.Shortcut>
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if estado === 'indeterminate'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Label>Mostrar na tela</ContextMenu.Label>
      <ContextMenu.CheckboxItem indeterminate>Colunas</ContextMenu.CheckboxItem>
      <ContextMenu.CheckboxItem checked>Régua</ContextMenu.CheckboxItem>
      <ContextMenu.CheckboxItem>Grade</ContextMenu.CheckboxItem>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if estado === 'dark'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Item>Editar</ContextMenu.Item>
      <ContextMenu.Item disabled>Duplicar</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive">Excluir</ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/if}
