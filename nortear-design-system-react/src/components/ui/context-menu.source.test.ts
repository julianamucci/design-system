import { describe, expect, it } from 'vitest';
import {
  contextMenuCompletoSource,
  contextMenuWithChoiceUnicaSource,
  contextMenuWithMarkupSource,
  contextMenuWithSubmenuSource,
  contextMenuItemDisabledSource,
  contextMenuItemRecuadoSource,
  contextMenuSource,
} from './context-menu.source';

const ALL = [
  contextMenuSource,
  contextMenuWithMarkupSource,
  contextMenuWithChoiceUnicaSource,
  contextMenuWithSubmenuSource,
  contextMenuItemDisabledSource,
  contextMenuItemRecuadoSource,
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
});

describe('composições', () => {
  it('a marcação é controlada de fora, e é de dois estados', () => {
    const saida = contextMenuWithMarkupSource();
    expect(saida).toContain('checked={grade}');
    expect(saida).toContain('onCheckedChange={(valor) => setGrade(valor)}');
    // Não existe terceiro valor neste primitivo — nada de estado misto.
    expect(saida).not.toContain('indeterminate');
  });

  it('a escolha única guarda o valor no grupo, e cada opção declara o seu', () => {
    const saida = contextMenuWithChoiceUnicaSource();
    expect(saida).toContain('<ContextMenuRadioGroup value={zoom} onValueChange={(valor) => setZoom(valor)}>');
    expect(saida).toContain('<ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>');
  });

  it('o submenu traz as três peças juntas', () => {
    const saida = contextMenuWithSubmenuSource();
    for (const part of ['<ContextMenuSub>', '<ContextMenuSubTrigger>', '<ContextMenuSubContent>']) {
      expect(saida).toContain(part);
    }
  });

  it('o menu completo faz marcação e escolha única conviverem', () => {
    const saida = contextMenuCompletoSource();
    expect(saida).toContain('<ContextMenuCheckboxItem');
    expect(saida).toContain('<ContextMenuRadioGroup');
    // Três divisores: um por bloco, como a story afirma.
    expect(saida.match(/<ContextMenuSeparator \/>/g)).toHaveLength(3);
  });
});

describe('estados do item', () => {
  it('desabilitado é prop do ITEM, e vale também para o destrutivo', () => {
    const saida = contextMenuItemDisabledSource();
    expect(saida).toContain('<ContextMenuItem disabled>Duplicar</ContextMenuItem>');
    expect(saida).toContain('<ContextMenuItem variant="destructive" disabled>');
  });

  it('o recuo vale para o item e para o rótulo do grupo', () => {
    const saida = contextMenuItemRecuadoSource();
    expect(saida).toContain('<ContextMenuLabel inset>Arquivo</ContextMenuLabel>');
    expect(saida).toContain('<ContextMenuItem inset>Duplicar</ContextMenuItem>');
  });
});
