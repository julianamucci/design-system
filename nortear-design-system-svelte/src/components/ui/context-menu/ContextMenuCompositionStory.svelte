<script lang="ts">
  import * as ContextMenu from '@/components/ui/context-menu';
  // Os nomes longos entram por import nomeado, e não pelo namespace: são a API
  // pública que o `index.ts` publica, e é por ela que quem consome o pacote
  // escreve. Chamando só `ContextMenu.Sub`, o nome longo ficaria exportado sem
  // ninguém renderizando — o sinal de peça especificada e não entregue.
  import {
    ContextMenuGroup,
    ContextMenuGroupHeading,
    ContextMenuLabel,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
  } from '@/components/ui/context-menu';
  import { AREA_CLICK_DIREITO } from '@shared/testing/context-menu-area';

  type Composition = 'checkbox' | 'radio' | 'submenu' | 'shortcut' | 'complete';

  let {
    composition = 'shortcut' as Composition,
  }: { composition?: Composition } = $props();

  // Estado de partida de cada menu = o do vanilla: na marcação solta a grade
  // nasce desmarcada e as réguas marcadas; no menu completo a grade nasce
  // marcada. Cada story monta a sua instância, então os valores não vazam de
  // uma para a outra.
  let showGrid = $state(false);
  let showRulers = $state(true);
  let completeShowGrid = $state(true);
  let layout = $state('grid');
  let completeLayout = $state('grid');
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
      <ContextMenu.Item data-testid="edit">
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
      <!-- O rótulo mora DENTRO do grupo e vira o nome dele. -->
      <ContextMenu.Group data-testid="group">
        <ContextMenu.Label>Visualização</ContextMenu.Label>
        <ContextMenu.CheckboxItem bind:checked={showGrid} data-testid="grid">
          Mostrar grade
        </ContextMenu.CheckboxItem>
        <ContextMenu.CheckboxItem bind:checked={showRulers} data-testid="rulers">
          Mostrar réguas
        </ContextMenu.CheckboxItem>
      </ContextMenu.Group>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if composition === 'radio'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <!-- O grupo de rádio já é um grupo: o rótulo o nomeia direto. -->
      <ContextMenu.RadioGroup bind:value={layout} data-testid="group">
        <ContextMenu.Label>Layout</ContextMenu.Label>
        <ContextMenu.RadioItem value="grid" data-testid="layout-grid">Grade</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="list" data-testid="layout-list">Lista</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="columns" data-testid="layout-columns">Colunas</ContextMenu.RadioItem>
      </ContextMenu.RadioGroup>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if composition === 'submenu'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <ContextMenu.Item>Editar</ContextMenu.Item>
      <ContextMenu.Item>Duplicar</ContextMenu.Item>
      <ContextMenuSub>
        <ContextMenuSubTrigger data-testid="sub">Compartilhar</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenu.Item data-testid="share-email">Por e-mail</ContextMenu.Item>
          <ContextMenu.Item>Por link</ContextMenu.Item>
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenu.Content>
  </ContextMenu.Root>

{:else if composition === 'complete'}
  <ContextMenu.Root>
    {@render area()}
    <ContextMenu.Content>
      <!--
        Cada bloco é nomeado pelo rótulo que mora dentro dele: a lib escreve o
        `id` do rótulo no `aria-labelledby` do grupo, e o leitor de tela anuncia
        "Ações, grupo" em vez de um bloco anônimo. O rótulo é o mesmo `Label`
        das outras stacks, com o mesmo `data-slot`.

        O terceiro grupo usa `GroupHeading`, o nome da lib que esta stack
        também publica: ele delega ao `Label`, e a play conta TRÊS rótulos com
        o mesmo `data-slot` — é o que prova que as duas peças não divergem.
      -->
      <ContextMenuGroup>
        <ContextMenuLabel>Ações</ContextMenuLabel>
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
        <ContextMenuLabel>Visualização</ContextMenuLabel>
        <ContextMenu.CheckboxItem bind:checked={completeShowGrid} data-testid="grid">
          Mostrar grade
        </ContextMenu.CheckboxItem>
      </ContextMenuGroup>
      <ContextMenu.Separator />
      <ContextMenu.RadioGroup bind:value={completeLayout}>
        <ContextMenuGroupHeading>Layout</ContextMenuGroupHeading>
        <ContextMenu.RadioItem value="grid" data-testid="layout-grid">Grade</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="list">Lista</ContextMenu.RadioItem>
      </ContextMenu.RadioGroup>
      <ContextMenu.Separator />
      <ContextMenu.Item variant="destructive">
        Excluir
        <ContextMenu.Shortcut>Delete</ContextMenu.Shortcut>
      </ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/if}
