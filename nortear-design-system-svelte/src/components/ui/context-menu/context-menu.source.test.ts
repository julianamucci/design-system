import { describe, expect, it } from 'vitest';
import {
  contextMenuComAtalhosSource,
  contextMenuComEscolhaUnicaSource,
  contextMenuComMarcacaoSource,
  contextMenuComSubmenuSource,
  contextMenuCompletoSource,
  contextMenuItemDesabilitadoSource,
  contextMenuItemDestrutivoSource,
  contextMenuItemRecuadoSource,
  contextMenuMarcacaoMistaSource,
  contextMenuPaletaEscuraSource,
  contextMenuSource,
} from './context-menu.source';

describe('contextMenuSource', () => {
  it('sem args, entrega a área do gesto e o menu completo', () => {
    expect(contextMenuSource()).toBe(
      `<script lang="ts">
  import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
  } from "@/components/ui/context-menu";
</script>

<ContextMenu>
  <ContextMenuTrigger
    class="nds-cluster nds-w-full nds-max-w-xs nds-p-8 nds-rounded-md nds-border-default nds-border-dashed nds-text-body nds-text-muted-foreground nds-cursor-default"
    data-align="center"
    data-justify="center"
  >
    Clique com o botão direito aqui
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuItem>
        Editar
        <ContextMenuShortcut>⌘E</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem>Duplicar</ContextMenuItem>
    </ContextMenuGroup>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Excluir
      <ContextMenuShortcut>⌫</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
    );
  });

  it('acompanha o control do rótulo da área', () => {
    expect(contextMenuSource('', { args: { triggerLabel: 'Clique aqui' } })).toContain(
      '\n    Clique aqui\n  </ContextMenuTrigger>',
    );
  });

  it('sem a ação destrutiva, some também o divisor e o import dele', () => {
    const saida = contextMenuSource('', { args: { showDestructive: false } });
    expect(saida).not.toContain('variant="destructive"');
    expect(saida).not.toContain('ContextMenuSeparator');
  });

  it('sem atalhos, nenhum item os escreve e o import não sobra', () => {
    const saida = contextMenuSource('', { args: { showShortcuts: false } });
    expect(saida).not.toContain('ContextMenuShortcut');
    expect(saida).toContain('<ContextMenuItem>Editar</ContextMenuItem>');
  });

  it('a área não tem altura cravada — ela nasce do espaçamento', () => {
    const saida = contextMenuSource();
    expect(saida).toContain('nds-border-default nds-border-dashed');
    expect(saida).not.toContain('style=');
    expect(saida).not.toContain('height');
  });
});

describe('transforms das stories de estado', () => {
  it('o item desabilitado escreve a prop no item, e o destrutivo pode acumular', () => {
    const saida = contextMenuItemDesabilitadoSource();
    expect(saida).toContain('<ContextMenuItem disabled>Duplicar</ContextMenuItem>');
    expect(saida).toContain('<ContextMenuItem variant="destructive" disabled>Excluir</ContextMenuItem>');
  });

  it('o recuo aparece no rótulo e nos itens que o pedem', () => {
    const saida = contextMenuItemRecuadoSource();
    expect(saida).toContain('<ContextMenuLabel inset>Arquivo</ContextMenuLabel>');
    expect(saida).toContain('<ContextMenuItem inset>Duplicar</ContextMenuItem>');
    // O item vizinho continua sem recuo: é a comparação que a story ensina.
    expect(saida).toContain('<ContextMenuItem>Editar</ContextMenuItem>');
  });

  it('o item destrutivo se declara por prop', () => {
    const saida = contextMenuItemDestrutivoSource();
    expect(saida).toContain('<ContextMenuItem variant="destructive">');
    expect(saida).toContain('Excluir permanentemente');
  });

  it('a marcação mista separa os três estados', () => {
    const saida = contextMenuMarcacaoMistaSource();
    expect(saida).toContain('<ContextMenuCheckboxItem indeterminate>Colunas</ContextMenuCheckboxItem>');
    expect(saida).toContain('<ContextMenuCheckboxItem checked>Régua</ContextMenuCheckboxItem>');
    expect(saida).toContain('<ContextMenuCheckboxItem>Grade</ContextMenuCheckboxItem>');
  });

  it('a paleta escura não muda uma linha do markup', () => {
    const saida = contextMenuPaletaEscuraSource();
    // A troca de tema é global; nada de classe de tema no menu.
    expect(saida).not.toContain('dark');
    expect(saida).toContain('<ContextMenuItem variant="destructive">Excluir</ContextMenuItem>');
  });
});

describe('transforms das stories de composição', () => {
  it('cada atalho mora dentro do seu item', () => {
    const saida = contextMenuComAtalhosSource();
    expect(saida.match(/<ContextMenuShortcut>/g)).toHaveLength(3);
    expect(saida).toContain(`<ContextMenuItem>
      Desfazer
      <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
    </ContextMenuItem>`);
  });

  it('a marcação leva o estado por vínculo de duas vias', () => {
    const saida = contextMenuComMarcacaoSource();
    expect(saida).toContain('let mostrarGrade = $state(false);');
    expect(saida).toContain('<ContextMenuCheckboxItem bind:checked={mostrarReguas}>');
  });

  it('a escolha única guarda o valor no grupo, não no item', () => {
    const saida = contextMenuComEscolhaUnicaSource();
    expect(saida).toContain('<ContextMenuRadioGroup bind:value={layout}>');
    expect(saida.match(/<ContextMenuRadioItem value="/g)).toHaveLength(3);
  });

  it('o submenu tem gatilho e conteúdo próprios', () => {
    const saida = contextMenuComSubmenuSource();
    expect(saida).toContain('<ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>');
    expect(saida).toContain('<ContextMenuSubContent>');
  });

  it('o menu completo nomeia cada grupo pelo cabeçalho', () => {
    const saida = contextMenuCompletoSource();
    expect(saida.match(/<ContextMenuGroupHeading>/g)).toHaveLength(3);
    expect(saida.match(/<ContextMenuSeparator \/>/g)).toHaveLength(3);
    // Marcação e escolha única convivendo é justamente o que a story mostra.
    expect(saida).toContain('<ContextMenuCheckboxItem bind:checked={mostrarGrade}>');
    expect(saida).toContain('<ContextMenuRadioGroup bind:value={layout}>');
  });
});
