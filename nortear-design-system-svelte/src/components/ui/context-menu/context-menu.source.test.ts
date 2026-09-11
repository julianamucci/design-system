import { describe, expect, it } from 'vitest';
import {
  contextMenuWithShortcutsSource,
  contextMenuWithRadioGroupSource,
  contextMenuWithCheckboxSource,
  contextMenuWithSubmenuSource,
  contextMenuCompleteSource,
  contextMenuItemDisabledSource,
  contextMenuItemDestructiveSource,
  contextMenuItemInsetSource,
  contextMenuCheckboxIndeterminateSource,
  contextMenuDarkPaletteSource,
  contextMenuSource,
  contextMenuEntriesSource,
} from './context-menu.source';
import { contextMenuEntriesState, type ContextMenuDocsEntry } from './context-menu.fixtures';

describe('contextMenuSource', () => {
  it('sem args, entrega a área do gesto e o menu do vanilla', () => {
    expect(contextMenuSource()).toBe(
      `<script lang="ts">
  import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
  } from "@/components/ui/context-menu";
</script>

<ContextMenu>
  <ContextMenuTrigger
    class="nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-border-default nds-border-dashed nds-text-body nds-text-muted-foreground nds-cursor-default"
    data-align="center"
    data-justify="center"
  >
    Clique com o botão direito aqui
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      Editar
      <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Excluir
      <ContextMenuShortcut>Delete</ContextMenuShortcut>
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

  it('sem a ação destrutiva, some o item — a divisória tem control próprio', () => {
    const output = contextMenuSource('', { args: { showDestructive: false } });
    expect(output).not.toContain('variant="destructive"');
    expect(output).toContain('<ContextMenuSeparator />');
  });

  it('sem a divisória, some a marcação e o import dela', () => {
    const output = contextMenuSource('', { args: { showSeparator: false } });
    expect(output).not.toContain('ContextMenuSeparator');
    expect(output).toContain('variant="destructive"');
  });

  it('sem atalhos, nenhum item os escreve e o import não sobra', () => {
    const output = contextMenuSource('', { args: { showShortcuts: false } });
    expect(output).not.toContain('ContextMenuShortcut');
    expect(output).toContain('<ContextMenuItem>Editar</ContextMenuItem>');
  });

  it('a área não tem altura cravada — ela nasce do espaçamento', () => {
    const output = contextMenuSource();
    expect(output).toContain('nds-border-default nds-border-dashed');
    expect(output).not.toContain('style=');
    expect(output).not.toContain('height');
  });
});

describe('transforms das stories de estado', () => {
  it('o item desabilitado escreve a prop no item, e o destrutivo pode acumular', () => {
    const output = contextMenuItemDisabledSource();
    expect(output).toContain('<ContextMenuItem disabled>Duplicar</ContextMenuItem>');
    expect(output).toContain('<ContextMenuItem variant="destructive" disabled>Excluir</ContextMenuItem>');
    // Como no vanilla: sem atalho no primeiro item e sem grupo anônimo.
    expect(output).toContain('<ContextMenuItem>Editar</ContextMenuItem>');
    expect(output).not.toContain('ContextMenuGroup');
  });

  it('o recuo aparece no rótulo e nos itens que o pedem', () => {
    const output = contextMenuItemInsetSource();
    expect(output).toContain('<ContextMenuLabel inset>Arquivo</ContextMenuLabel>');
    expect(output).toContain('<ContextMenuItem inset>Duplicar</ContextMenuItem>');
    // O item vizinho continua sem recuo: é a comparação que a story ensina.
    expect(output).toContain('<ContextMenuItem>Editar</ContextMenuItem>');
  });

  it('o item destrutivo se declara por prop', () => {
    const output = contextMenuItemDestructiveSource();
    expect(output).toContain('<ContextMenuItem variant="destructive">');
    expect(output).toContain('Excluir permanentemente');
  });

  it('a marcação mista separa os três estados', () => {
    const output = contextMenuCheckboxIndeterminateSource();
    expect(output).toContain('<ContextMenuCheckboxItem indeterminate>Colunas</ContextMenuCheckboxItem>');
    expect(output).toContain('<ContextMenuCheckboxItem checked>Régua</ContextMenuCheckboxItem>');
    expect(output).toContain('<ContextMenuCheckboxItem>Grade</ContextMenuCheckboxItem>');
  });

  it('a paleta escura não muda uma linha do markup', () => {
    const output = contextMenuDarkPaletteSource();
    // A troca de tema é global; nada de classe de tema no menu.
    expect(output).not.toContain('dark');
    expect(output).toContain('<ContextMenuItem variant="destructive">Excluir</ContextMenuItem>');
  });
});

describe('transforms das stories de composição', () => {
  it('cada atalho mora dentro do seu item', () => {
    const output = contextMenuWithShortcutsSource();
    expect(output.match(/<ContextMenuShortcut>/g)).toHaveLength(3);
    expect(output).toContain(`<ContextMenuItem>
      Desfazer
      <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
    </ContextMenuItem>`);
  });

  it('a marcação leva o estado por vínculo de duas vias', () => {
    const output = contextMenuWithCheckboxSource();
    expect(output).toContain('let showGrid = $state(false);');
    expect(output).toContain('<ContextMenuCheckboxItem bind:checked={showRulers}>');
  });

  it('a escolha única guarda o valor no grupo, não no item', () => {
    const output = contextMenuWithRadioGroupSource();
    expect(output).toContain('<ContextMenuRadioGroup bind:value={layout}>');
    expect(output.match(/<ContextMenuRadioItem value="/g)).toHaveLength(3);
  });

  it('todo rótulo mora dentro do grupo que ele nomeia', () => {
    // Fora do grupo o rótulo não nomeia nada — é a regra que o menu das cinco
    // stacks segue. O rótulo vem logo depois da abertura de um grupo.
    for (const output of [
      contextMenuWithCheckboxSource(),
      contextMenuWithRadioGroupSource(),
      contextMenuItemInsetSource(),
      contextMenuCheckboxIndeterminateSource(),
      contextMenuCompleteSource(),
    ]) {
      const labels = output.match(/<ContextMenu(?:Label|GroupHeading)[ >]/g) ?? [];
      const inGroup =
        output.match(
          /<ContextMenu(?:Radio)?Group[^>]*>\n\s*<ContextMenu(?:Label|GroupHeading)[ >]/g,
        ) ?? [];
      expect(labels.length).toBeGreaterThan(0);
      expect(inGroup).toHaveLength(labels.length);
    }
  });

  it('o submenu tem gatilho e conteúdo próprios', () => {
    const output = contextMenuWithSubmenuSource();
    expect(output).toContain('<ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>');
    expect(output).toContain('<ContextMenuSubContent>');
  });

  it('o menu completo nomeia cada grupo pelo rótulo', () => {
    const output = contextMenuCompleteSource();
    // Dois pelo nome das outras stacks e um pelo alias da lib, como na story —
    // as duas peças desenham o mesmo rótulo.
    expect(output.match(/<ContextMenuLabel>/g)).toHaveLength(2);
    expect(output.match(/<ContextMenuGroupHeading>/g)).toHaveLength(1);
    expect(output.match(/<ContextMenuSeparator \/>/g)).toHaveLength(3);
    // Marcação e escolha única convivendo é justamente o que a story mostra.
    expect(output).toContain('<ContextMenuCheckboxItem bind:checked={showGrid}>');
    expect(output).toContain('<ContextMenuRadioGroup bind:value={layout}>');
  });
});

describe('código dos cards de Variantes da docs page', () => {
  // A mesma lista monta a prévia e o código: o que o teste afirma é que o código
  // fala o idioma dos rótulos que recebe, peça por peça.
  const english: ContextMenuDocsEntry[] = [
    { type: 'item', label: 'Edit', value: 'edit' },
    { type: 'separator' },
    { type: 'item', label: 'Delete', value: 'delete', variant: 'destructive' },
  ];

  it('o card destrutivo, na íntegra: rótulos traduzidos e sem atalho', () => {
    expect(contextMenuEntriesSource({ triggerLabel: 'Right-click here', entries: english })).toBe(
      `<script lang="ts">
  import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
  } from "@/components/ui/context-menu";
</script>

<ContextMenu>
  <ContextMenuTrigger
    class="nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-border-default nds-border-dashed nds-text-body nds-text-muted-foreground nds-cursor-default"
    data-align="center"
    data-justify="center"
  >
    Right-click here
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Edit</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
    );
  });

  it('nenhum literal em português sobra quando os rótulos chegam em outro idioma', () => {
    const output = contextMenuEntriesSource({ triggerLabel: 'Right-click here', entries: english });
    for (const literal of ['Editar', 'Excluir', 'Clique com o botão direito']) {
      expect(output).not.toContain(literal);
    }
  });

  const checkbox: ContextMenuDocsEntry[] = [
    {
      type: 'group',
      label: 'View',
      items: [
        { type: 'checkbox', value: 'show-grid', label: 'Show grid', checked: false },
        { type: 'checkbox', value: 'show-rulers', label: 'Show rulers', checked: true },
      ],
    },
  ];

  it('a marcação declara o estado da lista: grade desmarcada, réguas marcadas', () => {
    expect(contextMenuEntriesState(checkbox)).toEqual({
      checked: { 'show-grid': false, 'show-rulers': true },
      radio: {},
    });
    const output = contextMenuEntriesSource({ triggerLabel: 'x', entries: checkbox });
    expect(output).toContain('let showGrid = $state(false);');
    expect(output).toContain('let showRulers = $state(true);');
    expect(output).toContain(`      <ContextMenuCheckboxItem bind:checked={showGrid}>
        Show grid
      </ContextMenuCheckboxItem>`);
  });

  it('o rótulo mora dentro do grupo que ele nomeia, com recuo quando pedido', () => {
    const output = contextMenuEntriesSource({
      triggerLabel: 'x',
      entries: [
        {
          type: 'group',
          label: 'Actions',
          inset: true,
          items: [{ type: 'item', label: 'Edit', value: 'edit', inset: true }],
        },
      ],
    });
    expect(output).toContain(`    <ContextMenuGroup>
      <ContextMenuLabel inset>Actions</ContextMenuLabel>
      <ContextMenuItem inset>Edit</ContextMenuItem>
    </ContextMenuGroup>`);
  });

  it('a escolha única guarda na variável do grupo o valor da opção marcada', () => {
    const entries: ContextMenuDocsEntry[] = [
      {
        type: 'radio-group',
        label: 'Layout',
        name: 'layout',
        value: 'layout-grid',
        items: [
          { value: 'layout-grid', label: 'Grid' },
          { value: 'layout-list', label: 'List' },
        ],
      },
    ];
    expect(contextMenuEntriesState(entries).radio).toEqual({ layout: 'layout-grid' });
    const output = contextMenuEntriesSource({ triggerLabel: 'x', entries });
    expect(output).toContain("let layout = $state('layout-grid');");
    expect(output).toContain(`    <ContextMenuRadioGroup bind:value={layout}>
      <ContextMenuLabel>Layout</ContextMenuLabel>
      <ContextMenuRadioItem value="layout-grid">Grid</ContextMenuRadioItem>
      <ContextMenuRadioItem value="layout-list">List</ContextMenuRadioItem>
    </ContextMenuRadioGroup>`);
    expect(output).not.toContain('ContextMenuGroup,');
  });

  it('o submenu recua os itens dentro do conteúdo dele, e o atalho entra no import', () => {
    const output = contextMenuEntriesSource({
      triggerLabel: 'x',
      entries: [
        { type: 'item', label: 'Edit', value: 'edit', shortcut: 'Ctrl+E' },
        {
          type: 'submenu',
          label: 'Share',
          items: [{ type: 'item', label: 'By email', value: 'share-email' }],
        },
      ],
    });
    expect(output).toContain(`    <ContextMenuSub>
      <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>By email</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>`);
    expect(output).toContain('    ContextMenuShortcut,');
    expect(output).toContain('<ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>');
  });

  it('sem argumento, escreve a composição completa — o rótulo da escolha única pelo nome das outras stacks', () => {
    // É a forma que a varredura transversal chama. A única diferença para
    // `contextMenuCompleteSource` é o terceiro rótulo: a lista não tem como
    // pedir o alias `ContextMenuGroupHeading`, e escreve `ContextMenuLabel`.
    const expected = contextMenuCompleteSource()
      .replace('    ContextMenuGroupHeading,\n', '')
      .replace(
        '<ContextMenuGroupHeading>Layout</ContextMenuGroupHeading>',
        '<ContextMenuLabel>Layout</ContextMenuLabel>',
      );
    expect(contextMenuEntriesSource()).toBe(expected);
  });
});
