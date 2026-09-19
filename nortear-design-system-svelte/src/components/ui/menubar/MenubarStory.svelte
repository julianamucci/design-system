<script lang="ts">
  import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarGroup,
    MenubarLabel,
    MenubarSeparator,
    MenubarShortcut,
    MenubarCheckboxItem,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
    MenubarGroupHeading,
    createMenuCloseWatch,
    type MenuCloseReason,
  } from './index';
  import { Button } from '@/components/ui/button';
  // O menu aberto inicial é lido UMA vez, na montagem: o `{#key}` abaixo já
  // remonta quando o arg muda, e sem o `untrack` o compilador avisa que a
  // referência captura só o valor inicial (`state_referenced_locally`).
  import { untrack } from 'svelte';

  type Variant = 'default' | 'destructive';
  type Demonstration =
    | 'default'
    | 'shortcuts'
    | 'submenu'
    | 'checkbox'
    | 'indeterminate'
    | 'radio'
    | 'itemDisabled'
    | 'destructive'
    | 'editor'
    | 'long';

  interface Props {
    defaultValue?: string;
    loop?: boolean;
    variant?: Variant;
    demonstration?: Demonstration;
    /** Espião de escolha de item — a story o passa para a aba Actions. */
    onSelect?: (label: string) => void;
    /**
     * Botões vizinhos da barra, que dão DESTINO ao Tab que sai dela. `'both'`
     * põe um antes e outro depois; `'before'` só o de antes — o gatilho vira a
     * ÚLTIMA parada da página, o caso em que a lib não fechava.
     */
    neighbors?: 'both' | 'before';
    /**
     * Espião do MOTIVO do fechamento, na palavra do design system.
     *
     * A lib não publica motivo — o `onValueChange` da raiz avisa QUE o menu
     * trocou ou fechou, nunca por quê —, então quem traduz gesto em palavra é o
     * `menu-close-reason.ts`, ao lado das peças e compartilhado pelos três
     * membros da família. É o mesmo caminho que a docs page usa para alimentar
     * o `reason` do `menubar_close`.
     */
    onCloseReason?: (reason: MenuCloseReason) => void;
  }

  let {
    // O arg da story chama-se `defaultValue` por paridade com as outras
    // stacks; nesta lib o menu aberto é o `value`, e é para ele que vai.
    defaultValue = undefined,
    loop = true,
    variant = 'default',
    demonstration = 'default',
    onSelect = () => {},
    neighbors = undefined,
    onCloseReason = undefined,
  }: Props = $props();

  // O menu aberto agora, para o observador do gesto saber se um clique no
  // gatilho é "abrir" ou "dispensar o que já estava aberto".
  let openMenu = $state(untrack(() => defaultValue) ?? '');

  const closeWatch = createMenuCloseWatch({
    subContentSelector: '[data-slot="menubar-sub-content"]',
    isOpen: () => openMenu !== '',
  });

  // Quem diz abertura e fechamento é o `onValueChange` da RAIZ, e não o de cada
  // menu: é o único aviso que passa por todo caminho — inclusive a passagem ao
  // menu VIZINHO, que é um valor trocando direto por outro e é o gesto que só a
  // barra tem. Mesma fiação da docs page desta stack.
  function handleValueChange(next: string) {
    if (next === openMenu) return;
    if (openMenu) {
      if (next) closeWatch.markSiblingOpen();
      onCloseReason?.(closeWatch.takeReason());
    }
    openMenu = next;
    closeWatch.reset();
  }

  /** A escolha de um item de AÇÃO é a decisão que fecha o menu — motivo `api`. */
  function chooseItem(label: string) {
    return () => {
      closeWatch.markItemPress();
      onSelect(label);
    };
  }

  // Os itens do menu LONGO da story de rolagem (D17). São SESSENTA, o mesmo
  // número da medição que fixou a decisão — com 24 o painel media 704px e a
  // altura disponível publicada pela lib era exatamente 704, então ele CABIA e
  // a asserção de rolagem passava por acaso. A lista é gerada, e não escrita à
  // mão: o que importa é passar da altura da janela, não um número no markup.
  const LONG_ITEMS = Array.from({ length: 60 }, (_, i) => `Ação ${i + 1}`);

  // Os mesmos dados das outras quatro stacks: a story é o que o Chromatic
  // fotografa, e um exemplo diferente por stack protegeria coisas diferentes.
  const MENUS = [
    { value: 'file', label: 'Arquivo', items: ['Novo', 'Abrir', 'Salvar'] },
    { value: 'edit', label: 'Editar', items: ['Desfazer', 'Refazer', 'Copiar'] },
    { value: 'view', label: 'Exibir', items: ['Aproximar', 'Afastar', 'Tela cheia'] },
    { value: 'help', label: 'Ajuda', items: ['Documentação', 'Atalhos de teclado'] },
  ];

  const SHORTCUTS = [
    { label: 'Desfazer', atalho: 'Ctrl+Z' },
    { label: 'Refazer', atalho: 'Ctrl+Shift+Z' },
    { label: 'Copiar', atalho: 'Ctrl+C' },
  ];

  const EXPORTACOES = ['PDF', 'CSV', 'PNG'];

  const ITEMS_WITH_BLOCK = [
    { label: 'Novo', disabled: false },
    { label: 'Salvar', disabled: false },
    { label: 'Enviar para revisão', disabled: true },
  ];

  const THEMES = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Escuro' },
    { value: 'system', label: 'Do sistema' },
  ];

  let regua = $state(true);
  let barLateral = $state(false);
  let grid = $state(false);
  let theme = $state('light');
</script>

<div class={neighbors ? 'nds-cluster' : undefined} data-spacing={neighbors ? 'md' : undefined} style="contain: layout">
  {#if neighbors}<Button variant="ghost">Antes</Button>{/if}
  {#key `${defaultValue}-${loop}-${variant}-${demonstration}`}
    <Menubar value={defaultValue ?? ''} {loop} onValueChange={handleValueChange}>
      {#if demonstration === 'shortcuts'}
        <MenubarMenu value="edit">
          <MenubarTrigger {...closeWatch.trigger}>Editar</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            {#each SHORTCUTS as a (a.label)}
              <MenubarItem>
                {a.label}
                <MenubarShortcut>{a.atalho}</MenubarShortcut>
              </MenubarItem>
            {/each}
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'submenu'}
        <MenubarMenu value="file">
          <MenubarTrigger {...closeWatch.trigger}>Arquivo</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            <MenubarItem>Novo</MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Exportar</MenubarSubTrigger>
              <MenubarSubContent {...closeWatch.subContent}>
                {#each EXPORTACOES as e (e)}
                  <MenubarItem>{e}</MenubarItem>
                {/each}
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'checkbox'}
        <MenubarMenu value="view">
          <MenubarTrigger {...closeWatch.trigger}>Exibir</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            <!--
              `Group` + `Label`: dentro de um grupo o rótulo vira o cabeçalho
              da lib, e o `id` dele entra no `aria-labelledby` do grupo — é o par
              que dá nome ao conjunto de alternadores para quem usa leitor de tela.
            -->
            <MenubarGroup>
              <MenubarLabel>Mostrar na tela</MenubarLabel>
              <MenubarCheckboxItem bind:checked={regua}>Régua</MenubarCheckboxItem>
              <MenubarCheckboxItem bind:checked={barLateral}>Barra lateral</MenubarCheckboxItem>
              <MenubarCheckboxItem bind:checked={grid}>Grade</MenubarCheckboxItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'indeterminate'}
        <MenubarMenu value="view">
          <MenubarTrigger {...closeWatch.trigger}>Exibir</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            <MenubarLabel>Mostrar na tela</MenubarLabel>
            <!--
              Os três estados lado a lado: sem o vizinho marcado a asserção do
              traço não teria com o que comparar o tique.
            -->
            <MenubarCheckboxItem indeterminate>Colunas</MenubarCheckboxItem>
            <MenubarCheckboxItem checked>Régua</MenubarCheckboxItem>
            <MenubarCheckboxItem>Grade</MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'radio'}
        <MenubarMenu value="theme">
          <MenubarTrigger {...closeWatch.trigger}>Aparência</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            <!--
              O rótulo do grupo de rádio usa `GroupHeading`, o nome da lib que
              esta stack também publica: ele delega ao `Label`, e a play confere
              que sai com o MESMO `data-slot` (`menubar-label`) — é o que prova
              que as duas peças não divergem. Mesma forma do ContextMenu e do
              DropdownMenu desta stack.
            -->
            <MenubarRadioGroup bind:value={theme}>
              <MenubarGroupHeading>Tema</MenubarGroupHeading>
              {#each THEMES as t (t.value)}
                <MenubarRadioItem value={t.value}>{t.label}</MenubarRadioItem>
              {/each}
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'itemDisabled'}
        <MenubarMenu value="file">
          <MenubarTrigger {...closeWatch.trigger}>Arquivo</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            {#each ITEMS_WITH_BLOCK as i (i.label)}
              <MenubarItem disabled={i.disabled} onSelect={chooseItem(i.label)}>
                {i.label}
              </MenubarItem>
            {/each}
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'editor'}
        <MenubarMenu value="file">
          <MenubarTrigger {...closeWatch.trigger}>Arquivo</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            <MenubarGroup>
              <MenubarLabel>Documento</MenubarLabel>
              <MenubarItem onSelect={chooseItem('Novo')}>Novo <MenubarShortcut>Ctrl+N</MenubarShortcut></MenubarItem>
              <MenubarItem onSelect={chooseItem('Abrir')}>Abrir <MenubarShortcut>Ctrl+O</MenubarShortcut></MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarItem variant="destructive" onSelect={chooseItem('Descartar alterações')}>Descartar alterações</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="edit">
          <MenubarTrigger {...closeWatch.trigger}>Editar</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            <MenubarItem onSelect={chooseItem('Desfazer')}>Desfazer <MenubarShortcut>Ctrl+Z</MenubarShortcut></MenubarItem>
            <MenubarItem onSelect={chooseItem('Refazer')}>Refazer <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut></MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="view">
          <MenubarTrigger {...closeWatch.trigger}>Exibir</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            <MenubarGroup>
              <MenubarLabel>Mostrar na tela</MenubarLabel>
              <MenubarCheckboxItem bind:checked={regua}>Régua</MenubarCheckboxItem>
              <MenubarCheckboxItem bind:checked={grid}>Grade</MenubarCheckboxItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="help">
          <MenubarTrigger {...closeWatch.trigger}>Ajuda</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            <MenubarItem onSelect={chooseItem('Documentação')}>Documentação</MenubarItem>
            <MenubarItem onSelect={chooseItem('Atalhos de teclado')}>Atalhos de teclado</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'destructive'}
        <MenubarMenu value="file">
          <MenubarTrigger {...closeWatch.trigger}>Arquivo</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            <MenubarItem>Salvar</MenubarItem>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Descartar alterações</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'long'}
        <!--
          Menu mais alto que a janela — o assunto da D17.

          O painel recorta na viewport e ROLA: o `max-height` de
          `.nds-dropdown-menu-content` cai em `24rem` quando a lib não publica
          altura disponível, e o `overflow-y: auto` da mesma folha faz o resto.
          Até 2026-09-18 a cadeia de `var()` não tinha degrau `--bits-*` nem
          literal no fim: ela era INVÁLIDA nesta stack, `max-height` computava
          `none`, e o painel destes itens saía inteiro por baixo da janela.
        -->
        <MenubarMenu value="file">
          <MenubarTrigger {...closeWatch.trigger}>Arquivo</MenubarTrigger>
          <MenubarContent {...closeWatch.content}>
            {#each LONG_ITEMS as item (item)}
              <MenubarItem onSelect={chooseItem(item)}>{item}</MenubarItem>
            {/each}
          </MenubarContent>
        </MenubarMenu>
      {:else}
        <!-- default: as quatro categorias clássicas -->
        {#each MENUS as m (m.value)}
          <MenubarMenu value={m.value}>
            <MenubarTrigger {...closeWatch.trigger}>{m.label}</MenubarTrigger>
            <MenubarContent {...closeWatch.content}>
              {#each m.items as item (item)}
                <MenubarItem {variant} onSelect={chooseItem(item)}>{item}</MenubarItem>
              {/each}
            </MenubarContent>
          </MenubarMenu>
        {/each}
      {/if}
    </Menubar>
  {/key}
  {#if neighbors === 'both'}<Button variant="ghost">Depois</Button>{/if}
</div>
