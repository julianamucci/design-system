<script lang="ts">
  import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarGroup,
    MenubarGroupHeading,
    MenubarLabel,
    MenubarSeparator,
    MenubarShortcut,
    MenubarCheckboxItem,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
  } from './index';

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
    | 'editor';

  interface Props {
    defaultValue?: string;
    loop?: boolean;
    variant?: Variant;
    demonstration?: Demonstration;
    /** Espião de escolha de item — a story o passa para a aba Actions. */
    onSelect?: (label: string) => void;
  }

  let {
    // O arg da story chama-se `defaultValue` por paridade com as outras
    // stacks; nesta lib o menu aberto é o `value`, e é para ele que vai.
    defaultValue = undefined,
    loop = true,
    variant = 'default',
    demonstration = 'default',
    onSelect = () => {},
  }: Props = $props();

  // Os mesmos dados das outras quatro stacks: a story é o que o Chromatic
  // fotografa, e um exemplo diferente por stack protegeria coisas diferentes.
  const MENUS = [
    { value: 'file', label: 'Arquivo', items: ['Novo', 'Abrir', 'Salvar'] },
    { value: 'edit', label: 'Editar', items: ['Desfazer', 'Refazer', 'Copiar'] },
    { value: 'view', label: 'Exibir', items: ['Aproximar', 'Afastar', 'Tela cheia'] },
    { value: 'help', label: 'Ajuda', items: ['Documentação', 'Atalhos de teclado'] },
  ];

  const SHORTCUTS = [
    { label: 'Desfazer', atalho: '⌘Z' },
    { label: 'Refazer', atalho: '⇧⌘Z' },
    { label: 'Copiar', atalho: '⌘C' },
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

<div style="contain: layout">
  {#key `${defaultValue}-${loop}-${variant}-${demonstration}`}
    <Menubar value={defaultValue ?? ''} {loop}>
      {#if demonstration === 'shortcuts'}
        <MenubarMenu value="edit">
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
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
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Exportar</MenubarSubTrigger>
              <MenubarSubContent>
                {#each EXPORTACOES as e (e)}
                  <MenubarItem>{e}</MenubarItem>
                {/each}
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'checkbox'}
        <MenubarMenu value="view">
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <!--
              `Group` + `GroupHeading`: nesta lib o cabeçalho vira o
              `aria-labelledby` do grupo, então o par é o que dá nome ao
              conjunto de alternadores para quem usa leitor de tela.
            -->
            <MenubarGroup>
              <MenubarGroupHeading>Mostrar na tela</MenubarGroupHeading>
              <MenubarCheckboxItem bind:checked={regua}>Régua</MenubarCheckboxItem>
              <MenubarCheckboxItem bind:checked={barLateral}>Barra lateral</MenubarCheckboxItem>
              <MenubarCheckboxItem bind:checked={grid}>Grade</MenubarCheckboxItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'indeterminate'}
        <MenubarMenu value="view">
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
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
          <MenubarTrigger>Aparência</MenubarTrigger>
          <MenubarContent>
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
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            {#each ITEMS_WITH_BLOCK as i (i.label)}
              <MenubarItem disabled={i.disabled} onSelect={() => onSelect(i.label)}>
                {i.label}
              </MenubarItem>
            {/each}
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'editor'}
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarGroupHeading>Documento</MenubarGroupHeading>
              <MenubarItem>Novo <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
              <MenubarItem>Abrir <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Descartar alterações</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="edit">
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
            <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="view">
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarGroupHeading>Mostrar na tela</MenubarGroupHeading>
              <MenubarCheckboxItem bind:checked={regua}>Régua</MenubarCheckboxItem>
              <MenubarCheckboxItem bind:checked={grid}>Grade</MenubarCheckboxItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="help">
          <MenubarTrigger>Ajuda</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Documentação</MenubarItem>
            <MenubarItem>Atalhos de teclado</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'destructive'}
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Salvar</MenubarItem>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Descartar alterações</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      {:else}
        <!-- default: as quatro categorias clássicas -->
        {#each MENUS as m (m.value)}
          <MenubarMenu value={m.value}>
            <MenubarTrigger>{m.label}</MenubarTrigger>
            <MenubarContent>
              {#each m.items as item (item)}
                <MenubarItem {variant}>{item}</MenubarItem>
              {/each}
            </MenubarContent>
          </MenubarMenu>
        {/each}
      {/if}
    </Menubar>
  {/key}
</div>
