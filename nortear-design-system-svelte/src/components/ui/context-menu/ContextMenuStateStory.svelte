<script lang="ts">
  import * as ContextMenu from '@/components/ui/context-menu';
  import { AREA_CLICK_DIREITO } from '@shared/testing/context-menu-area';

  type State = 'disabled' | 'inset' | 'destructive' | 'dark' | 'indeterminate';

  let { state = 'disabled' as State }: { state?: State } = $props();
</script>

<!--
  Conteúdo de cada estado = o do vanilla. Rótulo só dentro de grupo, que é onde
  ele nomeia alguma coisa; e grupo só com rótulo, porque sem nome ele não agrupa
  nada para quem ouve.
-->
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

{#if state === 'disabled'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Item data-testid="edit">Editar</ContextMenu.Item>
      <ContextMenu.Item disabled data-testid="off">Duplicar</ContextMenu.Item>
      <ContextMenu.Item data-testid="rename">Renomear</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive" disabled data-testid="danger-off">
        Excluir
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if state === 'inset'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Group>
        <ContextMenu.Label inset>Arquivo</ContextMenu.Label>
        <ContextMenu.Item data-testid="plain">Editar</ContextMenu.Item>
        <ContextMenu.Item inset data-testid="inset">Duplicar</ContextMenu.Item>
      </ContextMenu.Group>
      <ContextMenu.Separator />
      <ContextMenu.Item inset variant="destructive">Excluir</ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if state === 'destructive'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Item data-testid="plain">
        Editar
        <ContextMenu.Shortcut>Ctrl+E</ContextMenu.Shortcut>
      </ContextMenu.Item>
      <ContextMenu.Item>Duplicar</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive" data-testid="danger">
        Excluir permanentemente
        <ContextMenu.Shortcut>Delete</ContextMenu.Shortcut>
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if state === 'indeterminate'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Group>
        <ContextMenu.Label>Mostrar na tela</ContextMenu.Label>
        <ContextMenu.CheckboxItem indeterminate>Colunas</ContextMenu.CheckboxItem>
        <ContextMenu.CheckboxItem checked>Régua</ContextMenu.CheckboxItem>
        <ContextMenu.CheckboxItem>Grade</ContextMenu.CheckboxItem>
      </ContextMenu.Group>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if state === 'dark'}
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
