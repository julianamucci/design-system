import { describe, expect, it } from 'vitest';
import {
  contextMenuSnippet,
  contextMenuSource,
  contextMenuSourceCom,
} from './context-menu.source';

describe('contextMenuSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = contextMenuSnippet();
    expect(código).toContain(
      "import { createContextMenu } from '@/components/ui/context-menu';",
    );
    expect(código).toContain('createContextMenu({');
    expect(código).toContain("document.querySelector('#app')?.append(menu);");
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('nds-dropdown-menu-item');
  });

  it('omite o tipo padrão e as opções que a fábrica já assume', () => {
    const código = contextMenuSnippet();
    // `item` é o padrão de `type`: escrevê-lo em toda entrada seria ensinar a
    // repetir o default.
    expect(código).not.toContain("type: 'item'");
    expect(código).not.toContain('inset');
    expect(código).not.toContain('disabled');
    expect(código).not.toContain('radioValue');
  });

  it('monta a área com DOM curto, sem a sonda de teste', () => {
    const código = contextMenuSnippet();
    expect(código).toContain("const area = document.createElement('div');");
    expect(código).toContain('trigger: area');
    expect(código).not.toContain('criarAreaDeClique');
    expect(código).not.toContain('abrirPorGesto');
    expect(código).not.toContain('menuAberto');
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
    const código = contextMenuSnippet({
      radioValue: 'grid',
      items: [
        { type: 'label', label: 'Visualização', inset: true },
        { type: 'checkbox', label: 'Colunas', value: 'colunas', indeterminate: true },
        { type: 'radio', label: 'Grade', value: 'grid' },
        { label: 'Duplicar', value: 'off', disabled: true },
      ],
    });
    expect(código).toContain("radioValue: 'grid'");
    expect(código).toContain("type: 'label'");
    expect(código).toContain("type: 'checkbox'");
    expect(código).toContain("type: 'radio'");
    expect(código).toContain('indeterminate: true');
    expect(código).toContain('inset: true');
    expect(código).toContain('disabled: true');
  });

  it('recua o submenu dentro da entrada que o abre', () => {
    const código = contextMenuSnippet({
      items: [
        {
          type: 'submenu',
          label: 'Compartilhar',
          value: 'sub',
          items: [{ label: 'Por e-mail', value: 'por-email' }],
        },
      ],
    });
    expect(código).toContain('      items: [');
    expect(código).toContain("        { label: 'Por e-mail', value: 'por-email' },");
  });

  it('nunca imprime a função que os args trazem no lugar do corpo do callback', () => {
    const código = contextMenuSnippet({
      onOpenChange: (() => undefined) as unknown as string,
    });
    expect(código).not.toContain('onOpenChange');
  });
});

describe('contextMenuSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = contextMenuSource('<div data-slot="context-menu">', {});
    const comArgs = contextMenuSource('<div data-slot="context-menu">', {
      args: { triggerLabel: 'Área do documento', showDestructive: false },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain("area.textContent = 'Área do documento';");
    expect(comArgs).not.toContain('destructive');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(
      contextMenuSource('<div data-slot="context-menu" style="display: contents">', {}),
    ).not.toContain('display: contents');
  });
});

describe('contextMenuSourceCom', () => {
  it('sobrepõe os args da story com as entradas fixas', () => {
    const transform = contextMenuSourceCom({
      items: [{ type: 'checkbox', label: 'Mostrar grade', value: 'grade', checked: false }],
    });
    const código = transform('', { args: { triggerLabel: 'Área do documento' } });
    expect(código).toContain("area.textContent = 'Área do documento';");
    expect(código).toContain('checked: false');
    expect(código).not.toContain("label: 'Editar'");
  });
});
