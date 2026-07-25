<script lang="ts">
  import * as ContextMenu from '@/components/ui/context-menu';

  type Composition = 'checkbox' | 'radio' | 'submenu' | 'shortcut';

  let {
    composition = 'shortcut' as Composition,
  }: { composition?: Composition } = $props();

  let showBookmarks = $state(true);
  let showFullUrls = $state(false);
  let radioValue = $state('pedro');
</script>

{#if composition === 'shortcut'}
  <ContextMenu.Root>
    <ContextMenu.Trigger
      class="nds-cluster nds-rounded-lg border-2 nds-border-dashed nds-bg-muted-30 nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: 8rem; width: 16rem" data-align="center" data-justify="center" 
    >
      Clique com o botão direito aqui
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      <ContextMenu.Item>
        Editar
        <ContextMenu.Shortcut>⌘E</ContextMenu.Shortcut>
      </ContextMenu.Item>
      <ContextMenu.Item>
        Duplicar
        <ContextMenu.Shortcut>⌘D</ContextMenu.Shortcut>
      </ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive">
        Excluir
        <ContextMenu.Shortcut>⌫</ContextMenu.Shortcut>
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if composition === 'checkbox'}
  <ContextMenu.Root>
    <ContextMenu.Trigger
      class="nds-cluster nds-rounded-lg border-2 nds-border-dashed nds-bg-muted-30 nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: 8rem; width: 16rem" data-align="center" data-justify="center" 
    >
      Clique com o botão direito aqui
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      <ContextMenu.Label>Preferências</ContextMenu.Label>
      <ContextMenu.Separator />
      <ContextMenu.CheckboxItem bind:checked={showBookmarks}>
        Mostrar favoritos
      </ContextMenu.CheckboxItem>
      <ContextMenu.CheckboxItem bind:checked={showFullUrls}>
        Mostrar URLs completas
      </ContextMenu.CheckboxItem>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if composition === 'radio'}
  <ContextMenu.Root>
    <ContextMenu.Trigger
      class="nds-cluster nds-rounded-lg border-2 nds-border-dashed nds-bg-muted-30 nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: 8rem; width: 16rem" data-align="center" data-justify="center" 
    >
      Clique com o botão direito aqui
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      <ContextMenu.Label>Equipe</ContextMenu.Label>
      <ContextMenu.Separator />
      <ContextMenu.RadioGroup bind:value={radioValue}>
        <ContextMenu.RadioItem value="pedro">Pedro</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="ana">Ana</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="carlos">Carlos</ContextMenu.RadioItem>
      </ContextMenu.RadioGroup>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if composition === 'submenu'}
  <ContextMenu.Root>
    <ContextMenu.Trigger
      class="nds-cluster nds-rounded-lg border-2 nds-border-dashed nds-bg-muted-30 nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: 8rem; width: 16rem" data-align="center" data-justify="center" 
    >
      Clique com o botão direito aqui
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      <ContextMenu.Item>Editar</ContextMenu.Item>
      <ContextMenu.Item>Duplicar</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger>Compartilhar</ContextMenu.SubTrigger>
        <ContextMenu.SubContent>
          <ContextMenu.Item>Por e-mail</ContextMenu.Item>
          <ContextMenu.Item>Por link</ContextMenu.Item>
        </ContextMenu.SubContent>
      </ContextMenu.Sub>
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive">
        Excluir
        <ContextMenu.Shortcut>⌫</ContextMenu.Shortcut>
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/if}
