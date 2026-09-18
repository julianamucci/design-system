import { describe, expect, it } from 'vitest';
import { menubarEntriesSource, menubarSource } from './menubar.source';

describe('menubarSource', () => {
  it('sem args, entrega a barra canônica com as quatro categorias clássicas', () => {
    expect(menubarSource()).toBe(
      `<script lang="ts">
  import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
  } from "@/components/ui/menubar";
</script>

<Menubar>
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Abrir</MenubarItem>
      <MenubarItem>Salvar</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer</MenubarItem>
      <MenubarItem>Refazer</MenubarItem>
      <MenubarItem>Copiar</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="view">
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Aproximar</MenubarItem>
      <MenubarItem>Afastar</MenubarItem>
      <MenubarItem>Tela cheia</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="help">
    <MenubarTrigger>Ajuda</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Documentação</MenubarItem>
      <MenubarItem>Atalhos de teclado</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
    );
  });

  it('o menu aberto ao montar declara o estado de fora, por bind:value', () => {
    const output = menubarSource('', { args: { defaultValue: 'file' } });
    expect(output).toContain('let menuAberto = $state("file");');
    expect(output).toContain('<Menubar bind:value={menuAberto}>');
  });

  it('só escreve loop quando o valor difere do padrão', () => {
    expect(menubarSource('', { args: { loop: true } })).not.toContain('loop');
    expect(menubarSource('', { args: { loop: false } })).toContain('loop={false}');
  });

  it('a ênfase de perigo chega a cada item da demonstração padrão', () => {
    expect(menubarSource()).not.toContain('variant=');
    const output = menubarSource('', { args: { variant: 'destructive' } });
    expect(output.match(/<MenubarItem variant="destructive">/g)).toHaveLength(11);
  });

  it('a ficha de perigo separa a ação irreversível das demais', () => {
    const output = menubarSource('', { args: { demonstration: 'destructive' } });
    expect(output).toContain('<MenubarSeparator />');
    expect(output).toContain('<MenubarItem variant="destructive">Descartar alterações</MenubarItem>');
  });

  it('os atalhos aparecem dentro do item, e não em coluna separada', () => {
    const output = menubarSource('', { args: { demonstration: 'shortcuts' } });
    expect(output).toContain('<MenubarShortcut>Ctrl+Z</MenubarShortcut>');
    expect(output.match(/<MenubarShortcut>/g)).toHaveLength(3);
  });

  it('o submenu aninha o próprio painel dentro do item', () => {
    const output = menubarSource('', { args: { demonstration: 'submenu' } });
    expect(output).toContain('<MenubarSubTrigger>Exportar</MenubarSubTrigger>');
    expect(output).toContain('<MenubarSubContent>');
  });

  it('os alternadores vinculam um estado por linha, sob um cabeçalho que nomeia o grupo', () => {
    const output = menubarSource('', { args: { demonstration: 'checkbox' } });
    expect(output).toContain('let regua = $state(true);');
    expect(output).toContain('<MenubarCheckboxItem bind:checked={regua}>Régua</MenubarCheckboxItem>');
    expect(output).toContain('<MenubarGroupHeading>Mostrar na tela</MenubarGroupHeading>');
  });

  it('o estado misto é escrito por prop própria, ao lado do marcado e do vazio', () => {
    const output = menubarSource('', { args: { demonstration: 'indeterminate' } });
    expect(output).toContain('<MenubarCheckboxItem indeterminate>Colunas</MenubarCheckboxItem>');
    expect(output).toContain('<MenubarCheckboxItem checked>Régua</MenubarCheckboxItem>');
    expect(output).toContain('<MenubarCheckboxItem>Grade</MenubarCheckboxItem>');
  });

  it('a escolha única guarda o valor no grupo, e não em cada opção', () => {
    const output = menubarSource('', { args: { demonstration: 'radio' } });
    expect(output).toContain('let tema = $state("light");');
    expect(output).toContain('<MenubarRadioGroup bind:value={tema}>');
    expect(output.match(/<MenubarRadioItem value="/g)).toHaveLength(3);
  });

  it('o item bloqueado usa a prop, sem sumir da lista', () => {
    const output = menubarSource('', { args: { demonstration: 'itemDisabled' } });
    expect(output).toContain('<MenubarItem disabled>Enviar para revisão</MenubarItem>');
  });

  it('a barra de editor junta as quatro categorias com grupos, atalhos e alternadores', () => {
    const output = menubarSource('', { args: { demonstration: 'editor' } });
    expect(output.match(/<MenubarMenu value="/g)).toHaveLength(4);
    expect(output).toContain('<MenubarGroupHeading>Documento</MenubarGroupHeading>');
    expect(output).toContain('let grade = $state(false);');
  });

  it('nenhuma composição importa peça que não usa', () => {
    // O bloco de import é copiado inteiro: um nome a mais quebra a compilação de
    // quem cola o snippet só depois, no primeiro build.
    const output = menubarSource('', { args: { demonstration: 'itemDisabled' } });
    expect(output).not.toContain('MenubarShortcut');
    expect(output).not.toContain('MenubarSeparator');
  });
});

describe('menubarEntriesSource — o código dos cards de Variantes', () => {
  it('um MenubarMenu por gatilho, com os rótulos que recebeu', () => {
    const output = menubarEntriesSource({
      menus: [
        {
          value: 'file',
          triggerLabel: 'File',
          entries: [
            { type: 'item', label: 'New', value: 'new', shortcut: 'Ctrl+N' },
            { type: 'item', label: 'Save', value: 'save', shortcut: 'Ctrl+S' },
          ],
        },
        {
          value: 'help',
          triggerLabel: 'Help',
          entries: [{ type: 'item', label: 'About', value: 'about' }],
        },
      ],
    });
    expect(output.match(/<MenubarMenu value="/g)).toHaveLength(2);
    expect(output).toContain('<MenubarTrigger>File</MenubarTrigger>');
    expect(output).toContain('<MenubarShortcut>Ctrl+S</MenubarShortcut>');
    expect(output).toContain('<MenubarItem>About</MenubarItem>');
    expect(output).not.toMatch(/Arquivo|Novo|Salvar/);
    // Nada liga estado: nem declaração, nem peça de marcação no import.
    expect(output).not.toContain('$state');
    expect(output).not.toContain('MenubarCheckboxItem');
  });

  it('a variante destrutiva e a divisória saem da lista, não de um literal ao lado', () => {
    const output = menubarEntriesSource({
      menus: [
        {
          value: 'file',
          triggerLabel: 'File',
          entries: [
            { type: 'item', label: 'Save', value: 'save' },
            { type: 'separator' },
            { type: 'item', label: 'Delete file', value: 'delete-file', variant: 'destructive' },
          ],
        },
      ],
    });
    expect(output).toContain('<MenubarSeparator />');
    expect(output).toContain('<MenubarItem variant="destructive">Delete file</MenubarItem>');
  });

  it('a marcação declara a variável que liga, com o estado da lista', () => {
    const output = menubarEntriesSource({
      menus: [
        {
          value: 'view',
          triggerLabel: 'View',
          entries: [
            {
              type: 'group',
              label: 'Panels',
              items: [
                { type: 'checkbox', label: 'Sidebar', value: 'sidebar', checked: true },
                { type: 'checkbox', label: 'Grid', value: 'grid', checked: false },
              ],
            },
          ],
        },
      ],
    });
    expect(output).toContain('let sidebar = $state(true);');
    expect(output).toContain('let grid = $state(false);');
    expect(output).toContain('<MenubarGroupHeading>Panels</MenubarGroupHeading>');
    expect(output).toContain('<MenubarCheckboxItem bind:checked={grid}>');
  });
});
