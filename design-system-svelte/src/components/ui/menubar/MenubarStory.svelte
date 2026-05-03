<script lang="ts">
  import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarLabel,
    MenubarSeparator,
    MenubarShortcut,
    MenubarCheckboxItem,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
    MenubarGroup,
  } from './index';

  type Variant = 'default' | 'destructive';
  type Demonstration =
    | 'default'
    | 'shortcuts'
    | 'submenu'
    | 'checkbox'
    | 'radio'
    | 'itemDisabled'
    | 'editor';

  interface Props {
    defaultValue?: string;
    loop?: boolean;
    variant?: Variant;
    demonstration?: Demonstration;
  }

  let {
    defaultValue = undefined,
    loop = true,
    variant = 'default',
    demonstration = 'default',
  }: Props = $props();

  // estado para variantes interativas
  let showStatusBar = $state(true);
  let showActivityBar = $state(false);
  let showFullscreen = $state(false);
  let zoom = $state('100');
</script>

<div style="contain: layout">
  {#key `${defaultValue}-${loop}-${variant}-${demonstration}`}
    <Menubar {defaultValue} {loop}>
      {#if demonstration === 'shortcuts'}
        <MenubarMenu value="edit">
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Desfazer
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Refazer
              <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              Recortar
              <MenubarShortcut>⌘X</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Copiar
              <MenubarShortcut>⌘C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Colar
              <MenubarShortcut>⌘V</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'submenu'}
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo arquivo</MenubarItem>
            <MenubarItem>Abrir...</MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Exportar como</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>PDF</MenubarItem>
                <MenubarItem>CSV</MenubarItem>
                <MenubarItem>JSON</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Excluir arquivo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'checkbox'}
        <MenubarMenu value="view">
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarLabel>Visualização</MenubarLabel>
            <MenubarSeparator />
            <MenubarCheckboxItem
              checked={showStatusBar}
              onCheckedChange={(v) => (showStatusBar = v)}
            >
              Status bar
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              checked={showActivityBar}
              onCheckedChange={(v) => (showActivityBar = v)}
            >
              Activity bar
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              checked={showFullscreen}
              onCheckedChange={(v) => (showFullscreen = v)}
            >
              Tela cheia
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'radio'}
        <MenubarMenu value="tools">
          <MenubarTrigger>Ferramentas</MenubarTrigger>
          <MenubarContent>
            <MenubarLabel>Zoom</MenubarLabel>
            <MenubarSeparator />
            <MenubarRadioGroup bind:value={zoom}>
              <MenubarRadioItem value="50">50%</MenubarRadioItem>
              <MenubarRadioItem value="100">100%</MenubarRadioItem>
              <MenubarRadioItem value="150">150%</MenubarRadioItem>
              <MenubarRadioItem value="200">200%</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'itemDisabled'}
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo arquivo</MenubarItem>
            <MenubarItem disabled>Salvar (indisponível)</MenubarItem>
            <MenubarItem>Abrir...</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      {:else if demonstration === 'editor'}
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Novo
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Abrir...
              <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Exportar</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>PDF</MenubarItem>
                <MenubarItem>CSV</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem variant="destructive">
              Excluir
              <MenubarShortcut>⌫</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="edit">
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Desfazer
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Refazer
              <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              Copiar
              <MenubarShortcut>⌘C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Colar
              <MenubarShortcut>⌘V</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="view">
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem
              checked={showStatusBar}
              onCheckedChange={(v) => (showStatusBar = v)}
            >
              Status bar
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              checked={showActivityBar}
              onCheckedChange={(v) => (showActivityBar = v)}
            >
              Activity bar
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="tools">
          <MenubarTrigger>Ferramentas</MenubarTrigger>
          <MenubarContent>
            <MenubarLabel>Zoom</MenubarLabel>
            <MenubarSeparator />
            <MenubarRadioGroup bind:value={zoom}>
              <MenubarRadioItem value="50">50%</MenubarRadioItem>
              <MenubarRadioItem value="100">100%</MenubarRadioItem>
              <MenubarRadioItem value="150">150%</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      {:else}
        <!-- default: 4 menus File/Edit/View/Tools -->
        <MenubarMenu value="file">
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Novo
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Abrir...
              <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            {#if variant === 'destructive'}
              <MenubarItem variant="destructive">
                Excluir arquivo
                <MenubarShortcut>⌫</MenubarShortcut>
              </MenubarItem>
            {:else}
              <MenubarItem>Salvar como...</MenubarItem>
            {/if}
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="edit">
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Desfazer</MenubarItem>
            <MenubarItem>Refazer</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Copiar</MenubarItem>
            <MenubarItem>Colar</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="view">
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Zoom in</MenubarItem>
            <MenubarItem>Zoom out</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="tools">
          <MenubarTrigger>Ferramentas</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Configurações</MenubarItem>
            <MenubarItem>Extensões</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      {/if}
    </Menubar>
  {/key}
</div>
