<script lang="ts">
  /**
   * Barra CONTROLADA por estado de fora.
   *
   * Componente próprio, e não mais um ramo do `MenubarStory`: aqui o que a
   * story demonstra não é uma composição de menu, é a LIGAÇÃO — um botão que
   * não é gatilho abrindo o menu, e o menu devolvendo a mudança ao estado.
   * Enfiar isso no `demonstration` misturaria dois assuntos no mesmo arquivo.
   */
  import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from './index';

  const ITEMS = ['Novo', 'Abrir'];

  // O estado vive AQUI, fora da barra — é esse o assunto da story. Nesta lib a
  // abertura é o `value` da RAIZ (vinculável), e string vazia é barra fechada.
  let openMenu = $state('');
</script>

<div style="contain: layout">
  <div class="nds-stack" data-spacing="sm">
    <div class="nds-cluster" data-align="center">
      <button
        type="button"
        class="nds-button nds-button-outline nds-button-sm"
        data-testid="external-open"
        onclick={() => (openMenu = 'file')}
      >
        Abrir Arquivo
      </button>
      <span data-testid="external-state">{openMenu === 'file' ? 'aberto' : 'fechado'}</span>
    </div>

    <Menubar bind:value={openMenu}>
      <MenubarMenu value="file">
        <MenubarTrigger>Arquivo</MenubarTrigger>
        <MenubarContent>
          {#each ITEMS as item (item)}
            <MenubarItem>{item}</MenubarItem>
          {/each}
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <MenubarTrigger>Editar</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Desfazer</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  </div>
</div>
