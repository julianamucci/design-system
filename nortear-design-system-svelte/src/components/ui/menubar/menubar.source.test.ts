import { describe, expect, it } from 'vitest';
import { menubarSource } from './menubar.source';

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
    const saida = menubarSource('', { args: { defaultValue: 'file' } });
    expect(saida).toContain('let menuAberto = $state("file");');
    expect(saida).toContain('<Menubar bind:value={menuAberto}>');
  });

  it('só escreve loop quando o valor difere do padrão', () => {
    expect(menubarSource('', { args: { loop: true } })).not.toContain('loop');
    expect(menubarSource('', { args: { loop: false } })).toContain('loop={false}');
  });

  it('a ênfase de perigo chega a cada item da demonstração padrão', () => {
    expect(menubarSource()).not.toContain('variant=');
    const saida = menubarSource('', { args: { variant: 'destructive' } });
    expect(saida.match(/<MenubarItem variant="destructive">/g)).toHaveLength(11);
  });

  it('a ficha de perigo separa a ação irreversível das demais', () => {
    const saida = menubarSource('', { args: { demonstration: 'destructive' } });
    expect(saida).toContain('<MenubarSeparator />');
    expect(saida).toContain('<MenubarItem variant="destructive">Descartar alterações</MenubarItem>');
  });

  it('os atalhos aparecem dentro do item, e não em coluna separada', () => {
    const saida = menubarSource('', { args: { demonstration: 'shortcuts' } });
    expect(saida).toContain('<MenubarShortcut>Ctrl+Z</MenubarShortcut>');
    expect(saida.match(/<MenubarShortcut>/g)).toHaveLength(3);
  });

  it('o submenu aninha o próprio painel dentro do item', () => {
    const saida = menubarSource('', { args: { demonstration: 'submenu' } });
    expect(saida).toContain('<MenubarSubTrigger>Exportar</MenubarSubTrigger>');
    expect(saida).toContain('<MenubarSubContent>');
  });

  it('os alternadores vinculam um estado por linha, sob um cabeçalho que nomeia o grupo', () => {
    const saida = menubarSource('', { args: { demonstration: 'checkbox' } });
    expect(saida).toContain('let regua = $state(true);');
    expect(saida).toContain('<MenubarCheckboxItem bind:checked={regua}>Régua</MenubarCheckboxItem>');
    expect(saida).toContain('<MenubarGroupHeading>Mostrar na tela</MenubarGroupHeading>');
  });

  it('o estado misto é escrito por prop própria, ao lado do marcado e do vazio', () => {
    const saida = menubarSource('', { args: { demonstration: 'indeterminate' } });
    expect(saida).toContain('<MenubarCheckboxItem indeterminate>Colunas</MenubarCheckboxItem>');
    expect(saida).toContain('<MenubarCheckboxItem checked>Régua</MenubarCheckboxItem>');
    expect(saida).toContain('<MenubarCheckboxItem>Grade</MenubarCheckboxItem>');
  });

  it('a escolha única guarda o valor no grupo, e não em cada opção', () => {
    const saida = menubarSource('', { args: { demonstration: 'radio' } });
    expect(saida).toContain('let tema = $state("light");');
    expect(saida).toContain('<MenubarRadioGroup bind:value={tema}>');
    expect(saida.match(/<MenubarRadioItem value="/g)).toHaveLength(3);
  });

  it('o item bloqueado usa a prop, sem sumir da lista', () => {
    const saida = menubarSource('', { args: { demonstration: 'itemDisabled' } });
    expect(saida).toContain('<MenubarItem disabled>Enviar para revisão</MenubarItem>');
  });

  it('a barra de editor junta as quatro categorias com grupos, atalhos e alternadores', () => {
    const saida = menubarSource('', { args: { demonstration: 'editor' } });
    expect(saida.match(/<MenubarMenu value="/g)).toHaveLength(4);
    expect(saida).toContain('<MenubarGroupHeading>Documento</MenubarGroupHeading>');
    expect(saida).toContain('let grade = $state(false);');
  });

  it('nenhuma composição importa peça que não usa', () => {
    // O bloco de import é copiado inteiro: um nome a mais quebra a compilação de
    // quem cola o snippet só depois, no primeiro build.
    const saida = menubarSource('', { args: { demonstration: 'itemDisabled' } });
    expect(saida).not.toContain('MenubarShortcut');
    expect(saida).not.toContain('MenubarSeparator');
  });
});
