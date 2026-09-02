<script lang="ts">
  import * as ContextMenu from '@/components/ui/context-menu';
  // Os dois nomes longos entram por import nomeado, e não pelo namespace: são a
  // API pública que o `index.ts` publica, e é por ela que a docs page e quem
  // consome o pacote escrevem. Chamando só `ContextMenu.Group`, o nome longo
  // ficaria exportado sem ninguém renderizando — o sinal de peça especificada e
  // não entregue.
  import {
    ContextMenuGroup,
    ContextMenuGroupHeading,
  } from '@/components/ui/context-menu';
  import { AREA_CLICK_DIREITO } from '@shared/testing/context-menu-area';

  type Composition = 'checkbox' | 'radio' | 'submenu' | 'shortcut' | 'complete';

  let {
    composition = 'shortcut' as Composition,
  }: { composition?: Composition } = $props();

  let mostrarGrid = $state(false);
  let mostrarReguas = $state(true);
  let layout = $state('grid');
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

{#if composition === 'shortcut'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Item data-testid="editar">
        Editar
        <ContextMenu.Shortcut>Ctrl+E</ContextMenu.Shortcut>
      </ContextMenu.Item>
      <ContextMenu.Item>
        Desfazer
        <ContextMenu.Shortcut>Ctrl+Z</ContextMenu.Shortcut>
      </ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive">
        Excluir
        <ContextMenu.Shortcut>Delete</ContextMenu.Shortcut>
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if composition === 'checkbox'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Label>Visualização</ContextMenu.Label>
      <ContextMenu.CheckboxItem bind:checked={mostrarGrid} data-testid="grade">
        Mostrar grade
      </ContextMenu.CheckboxItem>
      <ContextMenu.CheckboxItem bind:checked={mostrarReguas} data-testid="reguas">
        Mostrar réguas
      </ContextMenu.CheckboxItem>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if composition === 'radio'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Label>Layout</ContextMenu.Label>
      <ContextMenu.RadioGroup bind:value={layout}>
        <ContextMenu.RadioItem value="grid" data-testid="grid">Grade</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="list" data-testid="list">Lista</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="columns" data-testid="columns">Colunas</ContextMenu.RadioItem>
      </ContextMenu.RadioGroup>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if composition === 'submenu'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Item>Editar</ContextMenu.Item>
      <ContextMenu.Item>Duplicar</ContextMenu.Item>
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger data-testid="sub">Compartilhar</ContextMenu.SubTrigger>
        <ContextMenu.SubContent>
          <ContextMenu.Item data-testid="por-email">Por e-mail</ContextMenu.Item>
          <ContextMenu.Item>Por link</ContextMenu.Item>
        </ContextMenu.SubContent>
      </ContextMenu.Sub>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if composition === 'complete'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <!--
        `Group` + `GroupHeading` é a dupla que dá NOME ao agrupamento: o heading
        vira o `aria-labelledby` do grupo, e o leitor de tela anuncia "Ações,
        grupo" em vez de um bloco anônimo. É por isso que aqui não se usa o
        `Label` solto — ele desenha igual e não amarra nada.
      -->
      <ContextMenuGroup>
        <ContextMenuGroupHeading>Ações</ContextMenuGroupHeading>
        <ContextMenu.Item>
          Editar
          <ContextMenu.Shortcut>Ctrl+E</ContextMenu.Shortcut>
        </ContextMenu.Item>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>Compartilhar</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>Por e-mail</ContextMenu.Item>
            <ContextMenu.Item>Por link</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      </ContextMenuGroup>
      <ContextMenu.Separator />
      <ContextMenuGroup>
        <ContextMenuGroupHeading>Visualização</ContextMenuGroupHeading>
        <ContextMenu.CheckboxItem bind:checked={mostrarGrid} data-testid="grade">
          Mostrar grade
        </ContextMenu.CheckboxItem>
      </ContextMenuGroup>
      <ContextMenu.Separator />
      <ContextMenuGroup>
        <ContextMenuGroupHeading>Layout</ContextMenuGroupHeading>
        <ContextMenu.RadioGroup bind:value={layout}>
          <ContextMenu.RadioItem value="grid" data-testid="grid">Grade</ContextMenu.RadioItem>
          <ContextMenu.RadioItem value="list">Lista</ContextMenu.RadioItem>
        </ContextMenu.RadioGroup>
      </ContextMenuGroup>
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive">
        Excluir
        <ContextMenu.Shortcut>Delete</ContextMenu.Shortcut>
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/if}
