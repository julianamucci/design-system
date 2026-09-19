import { describe, expect, it } from 'vitest';
import {
  contextMenuCompletoSource,
  contextMenuWithRadioGroupSource,
  contextMenuWithMarkupSource,
  contextMenuWithSubmenuSource,
  contextMenuItemDisabledSource,
  contextMenuItemDestructiveSource,
  contextMenuItemRecuadoSource,
  contextMenuCheckboxIndeterminateSource,
  contextMenuWithShortcutSource,
  contextMenuDarkPaletteSource,
  contextMenuSource,
  contextMenuSnippet,
  type ContextMenuActionEntry,
} from './context-menu.source';

const ALL = [
  contextMenuSource,
  contextMenuWithMarkupSource,
  contextMenuWithRadioGroupSource,
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
    const output = contextMenuSource();
    expect(output).toContain('<ContextMenuTrigger');
    expect(output).not.toContain('AreaGatilho');
    expect(output).not.toContain('data-testid');
  });

  it('a moldura tracejada precisa das DUAS classes de borda', () => {
    // `nds-border-dashed` só troca o estilo; sozinha, herda largura inicial e a
    // cor do texto.
    const output = contextMenuSource();
    expect(output).toContain('nds-border-default');
    expect(output).toContain('nds-border-dashed');
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
    const output = contextMenuSource(undefined, { args: { triggerLabel: 'Clique aqui' } });
    expect(output).toContain('Clique aqui');
  });

  it('cai no rótulo padrão quando o control entrega um espião', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const output = contextMenuSource(undefined, { args: { triggerLabel: spy } });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).toContain('Clique com o botão direito aqui');
  });

  it('o atalho fica dentro do item e não sai da árvore de acessibilidade', () => {
    // "Excluir, Delete" é o nome útil; escondido, o atalho só existe para quem vê.
    const output = contextMenuSource();
    expect(output).toContain('<ContextMenuShortcut>Delete</ContextMenuShortcut>');
    expect(output).not.toContain('aria-hidden');
  });

  it('a ação destrutiva se declara pela variante, e não pela cor', () => {
    expect(contextMenuSource()).toContain('<ContextMenuItem variant="destructive">');
  });

  it('segue os controls do Playground, e a importação acompanha o que sobrou', () => {
    // Sem atalho, sem divisor e sem o destrutivo, o snippet não pode importar
    // peça que não usa — o lint de quem copia acusaria import morto.
    const output = contextMenuSource(undefined, {
      args: { showShortcuts: false, showSeparator: false, showDestructive: false },
    });
    expect(output).not.toContain('ContextMenuShortcut');
    expect(output).not.toContain('ContextMenuSeparator');
    expect(output).not.toContain('Excluir');
    expect(output).toContain('<ContextMenuItem>Editar</ContextMenuItem>');
    expect(output).toContain('<ContextMenuItem>Duplicar</ContextMenuItem>');
  });

  it('sem os controls, publica o menu canônico inteiro', () => {
    const output = contextMenuSource();
    expect(output).toContain('<ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>');
    expect(output).toContain('<ContextMenuSeparator />');
    // O Playground não embrulha as ações num grupo sem rótulo: é o menu do vanilla.
    expect(output).not.toContain('ContextMenuGroup');
  });
});

describe('composições', () => {
  it('a marcação é controlada de fora', () => {
    const output = contextMenuWithMarkupSource();
    expect(output).toContain('checked={grade}');
    expect(output).toContain('onCheckedChange={(valor) => setGrade(valor)}');
    // O misto tem snippet próprio; este ensina os dois estados de uso corrente.
    expect(output).not.toContain('indeterminate');
  });

  it('o misto é prop do item, ao lado dos dois outros estados', () => {
    // O assunto é o contraste: marcado, desmarcado e misto no mesmo menu.
    const output = contextMenuCheckboxIndeterminateSource();
    expect(output).toContain('<ContextMenuCheckboxItem checked={false} indeterminate>');
    expect(output).toContain('<ContextMenuCheckboxItem checked>Régua</ContextMenuCheckboxItem>');
    expect(output).toContain('<ContextMenuCheckboxItem checked={false}>Grade</ContextMenuCheckboxItem>');
  });

  it('a escolha única guarda o valor no grupo, e cada opção declara o seu', () => {
    // Layout Grade/Lista/Colunas, o conteúdo do vanilla — não o Zoom de antes.
    const output = contextMenuWithRadioGroupSource();
    expect(output).toContain('<ContextMenuRadioGroup value={layout} onValueChange={(valor) => setLayout(valor)}>');
    expect(output).toContain('<ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>');
    expect(output).toContain('<ContextMenuRadioItem value="columns">Colunas</ContextMenuRadioItem>');
    expect(output).not.toContain('Zoom');
  });

  it('o rótulo nomeia o PRÓPRIO grupo de escolha única, sem grupo em volta', () => {
    // `Group > Label + RadioGroup` fazia dois `role="group"` aninhados, o de
    // dentro sem nome. O rótulo vai dentro do `ContextMenuRadioGroup`, que é
    // quem ele nomeia — e o `ContextMenuGroup` sai até da importação.
    const output = contextMenuWithRadioGroupSource();
    // A abertura do grupo ocupa a linha inteira — o `=>` do callback impede
    // casar a tag por `[^>]*` —, e o rótulo é a PRIMEIRA coisa dentro dele.
    expect(output).toMatch(/<ContextMenuRadioGroup [^\n]*\n\s*<ContextMenuLabel>Layout<\/ContextMenuLabel>/);
    expect(output).not.toContain('ContextMenuGroup');
  });

  it('o submenu traz as três peças juntas', () => {
    const output = contextMenuWithSubmenuSource();
    for (const part of ['<ContextMenuSub>', '<ContextMenuSubTrigger>', '<ContextMenuSubContent>']) {
      expect(output).toContain(part);
    }
  });

  it('os atalhos publicados são os TRÊS que a story desenha', () => {
    // A story mostra Editar/Ctrl+E, Desfazer/Ctrl+Z e Excluir/Delete, sem
    // grupo. O snippet do `meta` publicava "Duplicar" sem atalho — o painel
    // ensinava um menu que o preview não tem.
    const output = contextMenuWithShortcutSource();
    expect(output).toContain('<ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>');
    expect(output).toContain('<ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>');
    expect(output).toContain('<ContextMenuShortcut>Delete</ContextMenuShortcut>');
    expect(output.match(/<ContextMenuShortcut>/g)).toHaveLength(3);
    expect(output).not.toContain('Duplicar');
    expect(output).not.toContain('<ContextMenuGroup>');
  });

  it('o menu completo faz marcação e escolha única conviverem', () => {
    const output = contextMenuCompletoSource();
    expect(output).toContain('<ContextMenuCheckboxItem');
    expect(output).toContain('<ContextMenuRadioGroup');
    // Três divisores: um por bloco, como a story afirma.
    expect(output.match(/<ContextMenuSeparator \/>/g)).toHaveLength(3);
  });

  it('no menu completo, o bloco de escolha única também é UM grupo só', () => {
    const output = contextMenuCompletoSource();
    // A abertura do grupo ocupa a linha inteira — o `=>` do callback impede
    // casar a tag por `[^>]*` —, e o rótulo é a PRIMEIRA coisa dentro dele.
    expect(output).toMatch(/<ContextMenuRadioGroup [^\n]*\n\s*<ContextMenuLabel>Layout<\/ContextMenuLabel>/);
    expect(output).not.toMatch(/<ContextMenuGroup>\s*<ContextMenuLabel>Layout/);
  });
});

describe('contextMenuSnippet — o menu como dado', () => {
  const edit: ContextMenuActionEntry = { kind: 'item', label: 'Edit', value: 'edit' };

  it('imprime os rótulos exatamente como chegam, no idioma de quem lê', () => {
    // O defeito era o código em português ao lado da prévia em inglês.
    const output = contextMenuSnippet({
      triggerLabel: 'Right-click here',
      entries: [
        { ...edit, shortcut: 'Ctrl+E' },
        { kind: 'separator' },
        { kind: 'item', label: 'Delete', value: 'delete', destructive: true },
      ],
    });
    expect(output).toContain('<ContextMenuTrigger>Right-click here</ContextMenuTrigger>');
    expect(output).toContain('      Edit\n      <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>');
    expect(output).toContain('<ContextMenuItem variant="destructive">Delete</ContextMenuItem>');
    expect(output).not.toMatch(/Editar|Excluir|Clique/);
    // Item de ação não tem `value`: o id estável é do evento, não do snippet.
    expect(output).not.toContain('value=');
  });

  it('a escolha única sai como UM grupo nomeado pelo rótulo, com o estado antes', () => {
    const output = contextMenuSnippet({
      triggerLabel: 'Area',
      entries: [
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
      ],
    });
    // O estado mora num componente, antes do menu que ele alimenta.
    expect(output).toContain(
      'function ContextMenuWithState() {\n'
        + '  const [layout, setLayout] = useState("grid");\n\n'
        + '  return (\n'
        + '    <ContextMenu>',
    );
    expect(output).toContain(
      '        <ContextMenuRadioGroup value={layout} onValueChange={setLayout}>\n'
        + '          <ContextMenuLabel>Layout</ContextMenuLabel>\n'
        + '          <ContextMenuRadioItem value="grid">Grid</ContextMenuRadioItem>',
    );
    expect(output).not.toContain('ContextMenuGroup');
  });

  it('o trecho se cola: importa as peças que usa, e o useState só quando há estado', () => {
    // Até 2026-09-10 o card de Variantes imprimia o menu sem import nenhum, e o
    // estado como `const` solto antes de JSX solto — nada disso compila colado.
    const withState = contextMenuSnippet({
      entries: [
        {
          kind: 'group',
          label: 'View',
          items: [{ kind: 'checkbox', label: 'Show grid', value: 'show-grid', checked: false }],
        },
      ],
    });
    expect(withState.startsWith(
      'import {\n'
        + '  ContextMenu,\n'
        + '  ContextMenuCheckboxItem,\n'
        + '  ContextMenuContent,\n'
        + '  ContextMenuGroup,\n'
        + '  ContextMenuLabel,\n'
        + '  ContextMenuTrigger,\n'
        + '} from "@/components/ui/context-menu";\n'
        + 'import { useState } from "react";\n\n'
        + 'function ContextMenuWithState() {',
    )).toBe(true);

    const withoutState = contextMenuSnippet({ entries: [edit, { kind: 'separator' }] });
    expect(withoutState).toContain('  ContextMenuSeparator,\n');
    expect(withoutState).not.toContain('ContextMenuShortcut');
    expect(withoutState).not.toContain('useState');
    expect(withoutState).toMatch(/} from "@\/components\/ui\/context-menu";\n\n<ContextMenu>/);
  });

  it('sem entradas, publica o menu canônico do meta', () => {
    const output = contextMenuSnippet();
    expect(output).toContain('<ContextMenuTrigger>Clique com o botão direito aqui</ContextMenuTrigger>');
    expect(output).toContain('<ContextMenuItem variant="destructive">');
    expect(output).toContain('<ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>');
  });

  it('a marcação dentro de grupo ganha um estado por item, nomeado pelo id', () => {
    const output = contextMenuSnippet({
      triggerLabel: 'Area',
      entries: [
        {
          kind: 'group',
          label: 'View',
          items: [
            { kind: 'checkbox', label: 'Show grid', value: 'show-grid', checked: false },
            { kind: 'checkbox', label: 'Show rulers', value: 'show-rulers', checked: true },
          ],
        },
      ],
    });
    expect(output).toContain('const [showGrid, setShowGrid] = useState(false);');
    expect(output).toContain('const [showRulers, setShowRulers] = useState(true);');
    expect(output).toContain('<ContextMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>');
    expect(output).toMatch(/<ContextMenuGroup>\s*<ContextMenuLabel>View<\/ContextMenuLabel>/);
  });

  it('o submenu recua os itens dentro do painel filho', () => {
    const output = contextMenuSnippet({
      triggerLabel: 'Area',
      entries: [
        { kind: 'submenu', label: 'Share', items: [{ kind: 'item', label: 'By email', value: 'share-email' }] },
      ],
    });
    expect(output).toContain(
      '      <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>\n'
        + '      <ContextMenuSubContent>\n'
        + '        <ContextMenuItem>By email</ContextMenuItem>',
    );
  });

  it('rótulo com chave ou sinal de tag vai como string, sem quebrar o JSX', () => {
    const output = contextMenuSnippet({
      triggerLabel: 'Area',
      entries: [{ kind: 'item', label: 'A <b> {x}', value: 'x' }],
    });
    expect(output).toContain('<ContextMenuItem>{"A <b> {x}"}</ContextMenuItem>');
  });
});

describe('estados do item', () => {
  it('desabilitado é prop do ITEM, e vale também para o destrutivo', () => {
    const output = contextMenuItemDisabledSource();
    expect(output).toContain('<ContextMenuItem disabled>Duplicar</ContextMenuItem>');
    expect(output).toContain('<ContextMenuItem variant="destructive" disabled>');
    // A story não tem atalho em item nenhum; o snippet também não.
    expect(output).not.toContain('<ContextMenuShortcut>');
  });

  it('a paleta escura não é prop do menu, e o item desabilitado está lá', () => {
    // Quem troca a paleta é o tema: o markup do escuro é o mesmo do claro, e
    // não existe classe de tema para copiar. O que a story do escuro mostra —
    // e o snippet do `meta` não mostrava — é o item desabilitado sem atalho.
    const output = contextMenuDarkPaletteSource();
    expect(output).toContain('<ContextMenuItem disabled>Duplicar</ContextMenuItem>');
    expect(output).toContain('<ContextMenuItem variant="destructive">Excluir</ContextMenuItem>');
    expect(output).not.toContain('<ContextMenuShortcut>');
    expect(output).not.toMatch(/\bdark\b/);
  });

  it('o destrutivo publica o rótulo POR EXTENSO, que é o que o preview mostra', () => {
    // O snippet do `meta` publica "Excluir"; a story escreve "Excluir
    // permanentemente" porque uma ação sem volta se diz por inteiro. Sem
    // transform própria o painel Code ensinava o item curto.
    const output = contextMenuItemDestructiveSource();
    expect(output).toContain('<ContextMenuItem variant="destructive">');
    expect(output).toContain('Excluir permanentemente');
    expect(output).toContain('<ContextMenuShortcut>Delete</ContextMenuShortcut>');
  });

  it('o recuo vale para o item e para o rótulo do grupo', () => {
    const output = contextMenuItemRecuadoSource();
    expect(output).toContain('<ContextMenuLabel inset>Arquivo</ContextMenuLabel>');
    expect(output).toContain('<ContextMenuItem inset>Duplicar</ContextMenuItem>');
  });
});
