import { describe, expect, it } from 'vitest';
import {
  contextMenuCompletoSource,
  contextMenuWithChoiceUnicaSource,
  contextMenuWithMarkupSource,
  contextMenuWithSubmenuSource,
  contextMenuItemDisabledSource,
  contextMenuItemDestructiveSource,
  contextMenuItemRecuadoSource,
  contextMenuCheckboxIndeterminateSource,
  contextMenuWithShortcutSource,
  contextMenuDarkPaletteSource,
  contextMenuSource,
  contextMenuJsx,
  type ContextMenuActionEntry,
} from './context-menu.source';

const ALL = [
  contextMenuSource,
  contextMenuWithMarkupSource,
  contextMenuWithChoiceUnicaSource,
  contextMenuWithSubmenuSource,
  contextMenuWithShortcutSource,
  contextMenuDarkPaletteSource,
  contextMenuItemDisabledSource,
  contextMenuItemDestructiveSource,
  contextMenuItemRecuadoSource,
  contextMenuCheckboxIndeterminateSource,
  contextMenuCompletoSource,
];

describe('contextMenuSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(contextMenuSource()).toContain('} from "@/components/ui/context-menu";');
  });

  it('escreve a área de clique direito no lugar do andaime da story', () => {
    // O `<AreaGatilho>` do módulo de fixtures não existe para quem copia: o que
    // ela embrulha é o gatilho com o vocabulário de classe da área.
    const saida = contextMenuSource();
    expect(saida).toContain('<ContextMenuTrigger');
    expect(saida).not.toContain('AreaGatilho');
    expect(saida).not.toContain('data-testid');
  });

  it('a moldura tracejada precisa das DUAS classes de borda', () => {
    // `nds-border-dashed` só troca o estilo; sozinha, herda largura inicial e a
    // cor do texto.
    const saida = contextMenuSource();
    expect(saida).toContain('nds-border-default');
    expect(saida).toContain('nds-border-dashed');
  });

  it('o quadro nasce do padding, nunca de altura fixa', () => {
    // WCAG 1.4.4: com `height` cravado o quadro não cresce quando a pessoa
    // aumenta a fonte do navegador.
    for (const fn of ALL) {
      expect(fn()).toContain('nds-p-8');
      expect(fn()).not.toMatch(/\bheight\b/);
    }
  });

  it('o rótulo da área vem dos args quando o control o alimenta', () => {
    const saida = contextMenuSource(undefined, { args: { triggerLabel: 'Clique aqui' } });
    expect(saida).toContain('Clique aqui');
  });

  it('cai no rótulo padrão quando o control entrega um espião', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const saida = contextMenuSource(undefined, { args: { triggerLabel: spy } });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).toContain('Clique com o botão direito aqui');
  });

  it('o atalho fica dentro do item e não sai da árvore de acessibilidade', () => {
    // "Excluir, Delete" é o nome útil; escondido, o atalho só existe para quem vê.
    const saida = contextMenuSource();
    expect(saida).toContain('<ContextMenuShortcut>Delete</ContextMenuShortcut>');
    expect(saida).not.toContain('aria-hidden');
  });

  it('a ação destrutiva se declara pela variante, e não pela cor', () => {
    expect(contextMenuSource()).toContain('<ContextMenuItem variant="destructive">');
  });

  it('segue os controls do Playground, e a importação acompanha o que sobrou', () => {
    // Sem atalho, sem divisor e sem o destrutivo, o snippet não pode importar
    // peça que não usa — o lint de quem copia acusaria import morto.
    const saida = contextMenuSource(undefined, {
      args: { showShortcuts: false, showSeparator: false, showDestructive: false },
    });
    expect(saida).not.toContain('ContextMenuShortcut');
    expect(saida).not.toContain('ContextMenuSeparator');
    expect(saida).not.toContain('Excluir');
    expect(saida).toContain('<ContextMenuItem>Editar</ContextMenuItem>');
    expect(saida).toContain('<ContextMenuItem>Duplicar</ContextMenuItem>');
  });

  it('sem os controls, publica o menu canônico inteiro', () => {
    const saida = contextMenuSource();
    expect(saida).toContain('<ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>');
    expect(saida).toContain('<ContextMenuSeparator />');
    // O Playground não embrulha as ações num grupo sem rótulo: é o menu do vanilla.
    expect(saida).not.toContain('ContextMenuGroup');
  });
});

describe('composições', () => {
  it('a marcação é controlada de fora', () => {
    const saida = contextMenuWithMarkupSource();
    expect(saida).toContain('checked={grade}');
    expect(saida).toContain('onCheckedChange={(valor) => setGrade(valor)}');
    // O misto tem snippet próprio; este ensina os dois estados de uso corrente.
    expect(saida).not.toContain('indeterminate');
  });

  it('o misto é prop do item, ao lado dos dois outros estados', () => {
    // O assunto é o contraste: marcado, desmarcado e misto no mesmo menu.
    const saida = contextMenuCheckboxIndeterminateSource();
    expect(saida).toContain('<ContextMenuCheckboxItem checked={false} indeterminate>');
    expect(saida).toContain('<ContextMenuCheckboxItem checked>Régua</ContextMenuCheckboxItem>');
    expect(saida).toContain('<ContextMenuCheckboxItem checked={false}>Grade</ContextMenuCheckboxItem>');
  });

  it('a escolha única guarda o valor no grupo, e cada opção declara o seu', () => {
    // Layout Grade/Lista/Colunas, o conteúdo do vanilla — não o Zoom de antes.
    const saida = contextMenuWithChoiceUnicaSource();
    expect(saida).toContain('<ContextMenuRadioGroup value={layout} onValueChange={(valor) => setLayout(valor)}>');
    expect(saida).toContain('<ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>');
    expect(saida).toContain('<ContextMenuRadioItem value="columns">Colunas</ContextMenuRadioItem>');
    expect(saida).not.toContain('Zoom');
  });

  it('o rótulo nomeia o PRÓPRIO grupo de escolha única, sem grupo em volta', () => {
    // `Group > Label + RadioGroup` fazia dois `role="group"` aninhados, o de
    // dentro sem nome. O rótulo vai dentro do `ContextMenuRadioGroup`, que é
    // quem ele nomeia — e o `ContextMenuGroup` sai até da importação.
    const saida = contextMenuWithChoiceUnicaSource();
    // A abertura do grupo ocupa a linha inteira — o `=>` do callback impede
    // casar a tag por `[^>]*` —, e o rótulo é a PRIMEIRA coisa dentro dele.
    expect(saida).toMatch(/<ContextMenuRadioGroup [^\n]*\n\s*<ContextMenuLabel>Layout<\/ContextMenuLabel>/);
    expect(saida).not.toContain('ContextMenuGroup');
  });

  it('o submenu traz as três peças juntas', () => {
    const saida = contextMenuWithSubmenuSource();
    for (const part of ['<ContextMenuSub>', '<ContextMenuSubTrigger>', '<ContextMenuSubContent>']) {
      expect(saida).toContain(part);
    }
  });

  it('os atalhos publicados são os TRÊS que a story desenha', () => {
    // A story mostra Editar/Ctrl+E, Desfazer/Ctrl+Z e Excluir/Delete, sem
    // grupo. O snippet do `meta` publicava "Duplicar" sem atalho — o painel
    // ensinava um menu que o preview não tem.
    const saida = contextMenuWithShortcutSource();
    expect(saida).toContain('<ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>');
    expect(saida).toContain('<ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>');
    expect(saida).toContain('<ContextMenuShortcut>Delete</ContextMenuShortcut>');
    expect(saida.match(/<ContextMenuShortcut>/g)).toHaveLength(3);
    expect(saida).not.toContain('Duplicar');
    expect(saida).not.toContain('<ContextMenuGroup>');
  });

  it('o menu completo faz marcação e escolha única conviverem', () => {
    const saida = contextMenuCompletoSource();
    expect(saida).toContain('<ContextMenuCheckboxItem');
    expect(saida).toContain('<ContextMenuRadioGroup');
    // Três divisores: um por bloco, como a story afirma.
    expect(saida.match(/<ContextMenuSeparator \/>/g)).toHaveLength(3);
  });

  it('no menu completo, o bloco de escolha única também é UM grupo só', () => {
    const saida = contextMenuCompletoSource();
    // A abertura do grupo ocupa a linha inteira — o `=>` do callback impede
    // casar a tag por `[^>]*` —, e o rótulo é a PRIMEIRA coisa dentro dele.
    expect(saida).toMatch(/<ContextMenuRadioGroup [^\n]*\n\s*<ContextMenuLabel>Layout<\/ContextMenuLabel>/);
    expect(saida).not.toMatch(/<ContextMenuGroup>\s*<ContextMenuLabel>Layout/);
  });
});

describe('contextMenuJsx — o menu como dado', () => {
  const edit: ContextMenuActionEntry = { kind: 'item', label: 'Edit', value: 'edit' };

  it('imprime os rótulos exatamente como chegam, no idioma de quem lê', () => {
    // O defeito era o código em português ao lado da prévia em inglês.
    const saida = contextMenuJsx('Right-click here', [
      { ...edit, shortcut: 'Ctrl+E' },
      { kind: 'separator' },
      { kind: 'item', label: 'Delete', value: 'delete', destructive: true },
    ]);
    expect(saida).toContain('<ContextMenuTrigger>Right-click here</ContextMenuTrigger>');
    expect(saida).toContain('      Edit\n      <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>');
    expect(saida).toContain('<ContextMenuItem variant="destructive">Delete</ContextMenuItem>');
    expect(saida).not.toMatch(/Editar|Excluir|Clique/);
    // Item de ação não tem `value`: o id estável é do evento, não do snippet.
    expect(saida).not.toContain('value=');
  });

  it('a escolha única sai como UM grupo nomeado pelo rótulo, com o estado antes', () => {
    const saida = contextMenuJsx('Area', [
      {
        kind: 'radio-group',
        label: 'Layout',
        value: 'layout',
        selected: 'grid',
        options: [
          { label: 'Grid', value: 'grid' },
          { label: 'List', value: 'list' },
        ],
      },
    ]);
    expect(saida.startsWith('const [layout, setLayout] = useState("grid");\n\n<ContextMenu>')).toBe(true);
    expect(saida).toContain(
      '    <ContextMenuRadioGroup value={layout} onValueChange={setLayout}>\n'
        + '      <ContextMenuLabel>Layout</ContextMenuLabel>\n'
        + '      <ContextMenuRadioItem value="grid">Grid</ContextMenuRadioItem>',
    );
    expect(saida).not.toContain('ContextMenuGroup');
  });

  it('a marcação dentro de grupo ganha um estado por item, nomeado pelo id', () => {
    const saida = contextMenuJsx('Area', [
      {
        kind: 'group',
        label: 'View',
        items: [
          { kind: 'checkbox', label: 'Show grid', value: 'show-grid', checked: false },
          { kind: 'checkbox', label: 'Show rulers', value: 'show-rulers', checked: true },
        ],
      },
    ]);
    expect(saida).toContain('const [showGrid, setShowGrid] = useState(false);');
    expect(saida).toContain('const [showRulers, setShowRulers] = useState(true);');
    expect(saida).toContain('<ContextMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>');
    expect(saida).toMatch(/<ContextMenuGroup>\s*<ContextMenuLabel>View<\/ContextMenuLabel>/);
  });

  it('o submenu recua os itens dentro do painel filho', () => {
    const saida = contextMenuJsx('Area', [
      { kind: 'submenu', label: 'Share', items: [{ kind: 'item', label: 'By email', value: 'share-email' }] },
    ]);
    expect(saida).toContain(
      '      <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>\n'
        + '      <ContextMenuSubContent>\n'
        + '        <ContextMenuItem>By email</ContextMenuItem>',
    );
  });

  it('rótulo com chave ou sinal de tag vai como string, sem quebrar o JSX', () => {
    const saida = contextMenuJsx('Area', [{ kind: 'item', label: 'A <b> {x}', value: 'x' }]);
    expect(saida).toContain('<ContextMenuItem>{"A <b> {x}"}</ContextMenuItem>');
  });
});

describe('estados do item', () => {
  it('desabilitado é prop do ITEM, e vale também para o destrutivo', () => {
    const saida = contextMenuItemDisabledSource();
    expect(saida).toContain('<ContextMenuItem disabled>Duplicar</ContextMenuItem>');
    expect(saida).toContain('<ContextMenuItem variant="destructive" disabled>');
    // A story não tem atalho em item nenhum; o snippet também não.
    expect(saida).not.toContain('<ContextMenuShortcut>');
  });

  it('a paleta escura não é prop do menu, e o item desabilitado está lá', () => {
    // Quem troca a paleta é o tema: o markup do escuro é o mesmo do claro, e
    // não existe classe de tema para copiar. O que a story do escuro mostra —
    // e o snippet do `meta` não mostrava — é o item desabilitado sem atalho.
    const saida = contextMenuDarkPaletteSource();
    expect(saida).toContain('<ContextMenuItem disabled>Duplicar</ContextMenuItem>');
    expect(saida).toContain('<ContextMenuItem variant="destructive">Excluir</ContextMenuItem>');
    expect(saida).not.toContain('<ContextMenuShortcut>');
    expect(saida).not.toMatch(/\bdark\b/);
  });

  it('o destrutivo publica o rótulo POR EXTENSO, que é o que o preview mostra', () => {
    // O snippet do `meta` publica "Excluir"; a story escreve "Excluir
    // permanentemente" porque uma ação sem volta se diz por inteiro. Sem
    // transform própria o painel Code ensinava o item curto.
    const saida = contextMenuItemDestructiveSource();
    expect(saida).toContain('<ContextMenuItem variant="destructive">');
    expect(saida).toContain('Excluir permanentemente');
    expect(saida).toContain('<ContextMenuShortcut>Delete</ContextMenuShortcut>');
  });

  it('o recuo vale para o item e para o rótulo do grupo', () => {
    const saida = contextMenuItemRecuadoSource();
    expect(saida).toContain('<ContextMenuLabel inset>Arquivo</ContextMenuLabel>');
    expect(saida).toContain('<ContextMenuItem inset>Duplicar</ContextMenuItem>');
  });
});
