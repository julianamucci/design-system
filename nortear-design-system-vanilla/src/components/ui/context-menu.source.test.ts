import { describe, expect, it } from 'vitest';
import {
  contextMenuSnippet,
  contextMenuSource,
  contextMenuSourceWith,
} from './context-menu.source';

describe('contextMenuSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = contextMenuSnippet();
    expect(code).toContain(
      "import { createContextMenu } from '@/components/ui/context-menu';",
    );
    expect(code).toContain('createContextMenu({');
    expect(code).toContain("document.querySelector('#app')?.append(menu);");
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('nds-dropdown-menu-item');
  });

  it('omite o tipo padrão e as opções que a fábrica já assume', () => {
    const code = contextMenuSnippet();
    // `item` é o padrão de `type`: escrevê-lo em toda entrada seria ensinar a
    // repetir o default.
    expect(code).not.toContain("type: 'item'");
    expect(code).not.toContain('inset');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('radioValue');
  });

  it('monta a área com DOM curto, sem a sonda de teste', () => {
    const code = contextMenuSnippet();
    expect(code).toContain("const area = document.createElement('div');");
    expect(code).toContain('trigger: area');
    expect(code).not.toContain('criarAreaDeClique');
    expect(code).not.toContain('abrirPorGesto');
    expect(code).not.toContain('menuAberto');
  });

  it('acompanha os controls do menu canônico', () => {
    const completo = contextMenuSnippet();
    expect(completo).toContain("shortcut: '⌘E'");
    expect(completo).toContain("{ type: 'separator' },");
    expect(completo).toContain("variant: 'destructive'");

    const enxuto = contextMenuSnippet({
      showShortcuts: false,
      showSeparator: false,
      showDestructive: false,
    });
    expect(enxuto).not.toContain('shortcut');
    expect(enxuto).not.toContain('separator');
    expect(enxuto).not.toContain('destructive');
  });

  it('mostra as peças que a story exercita', () => {
    const code = contextMenuSnippet({
      radioValue: 'grid',
      items: [
        { type: 'label', label: 'Visualização', inset: true },
        { type: 'checkbox', label: 'Colunas', value: 'colunas', indeterminate: true },
        { type: 'radio', label: 'Grade', value: 'grid' },
        { label: 'Duplicar', value: 'off', disabled: true },
      ],
    });
    expect(code).toContain("radioValue: 'grid'");
    expect(code).toContain("type: 'label'");
    expect(code).toContain("type: 'checkbox'");
    expect(code).toContain("type: 'radio'");
    expect(code).toContain('indeterminate: true');
    expect(code).toContain('inset: true');
    expect(code).toContain('disabled: true');
  });

  it('recua o submenu dentro da entrada que o abre', () => {
    const code = contextMenuSnippet({
      items: [
        {
          type: 'submenu',
          label: 'Compartilhar',
          value: 'sub',
          items: [{ label: 'Por e-mail', value: 'por-email' }],
        },
      ],
    });
    expect(code).toContain('      items: [');
    expect(code).toContain("        { label: 'Por e-mail', value: 'por-email' },");
  });

  it('nunca imprime a função que os args trazem no lugar do corpo do callback', () => {
    const code = contextMenuSnippet({
      onOpenChange: (() => undefined) as unknown as string,
    });
    expect(code).not.toContain('onOpenChange');
  });
});

describe('contextMenuSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = contextMenuSource('<div data-slot="context-menu">', {});
    const withArgs = contextMenuSource('<div data-slot="context-menu">', {
      args: { triggerLabel: 'Área do documento', showDestructive: false },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("area.textContent = 'Área do documento';");
    expect(withArgs).not.toContain('destructive');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(
      contextMenuSource('<div data-slot="context-menu" style="display: contents">', {}),
    ).not.toContain('display: contents');
  });
});

describe('contextMenuSourceCom', () => {
  it('sobrepõe os args da story com as entradas fixas', () => {
    const transform = contextMenuSourceWith({
      items: [{ type: 'checkbox', label: 'Mostrar grade', value: 'grade', checked: false }],
    });
    const code = transform('', { args: { triggerLabel: 'Área do documento' } });
    expect(code).toContain("area.textContent = 'Área do documento';");
    expect(code).toContain('checked: false');
    expect(code).not.toContain("label: 'Editar'");
  });
});
