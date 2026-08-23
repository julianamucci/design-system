import { describe, expect, it } from 'vitest';
import { menubarSnippet, menubarSource, menubarSourceWith } from './menubar.source';

describe('menubarSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML da barra', () => {
    const code = menubarSnippet();
    expect(code).toContain("import { createMenubar } from '@/components/ui/menubar';");
    expect(code).toContain('createMenubar([');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="menubar"');
  });

  it('passa os menus no primeiro argumento, que é posicional', () => {
    const code = menubarSnippet();
    expect(code).toContain("label: 'Arquivo'");
    expect(code).toContain("{ label: 'Novo', shortcut: '⌘N', onClick: () => novo() },");
    expect(code).toContain("document.querySelector('#app')?.append(barra);");
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = menubarSnippet({ loop: true, side: 'bottom', align: 'start' });
    expect(code).not.toContain('loop');
    expect(code).not.toContain('side');
    expect(code).not.toContain('align');
    expect(code).not.toContain('defaultOpen');
    // Sem opção nenhuma o segundo argumento nem existe.
    expect(code).toContain('createMenubar([\n');
    expect(code).not.toContain('], {');
  });

  it('mostra as opções quando a story as usa', () => {
    const code = menubarSnippet({ loop: false, side: 'top', align: 'end', defaultOpen: 0 });
    expect(code).toContain('loop: false');
    expect(code).toContain("side: 'top'");
    expect(code).toContain("align: 'end'");
    expect(code).toContain('defaultOpen: 0');
  });

  it('traduz o control booleano de abertura para o índice que a fábrica recebe', () => {
    expect(menubarSnippet({ defaultOpen: true })).toContain('defaultOpen: 0');
    expect(menubarSnippet({ defaultOpen: false })).not.toContain('defaultOpen');
  });

  it('escreve a variante de perigo e o separador do menu', () => {
    const code = menubarSnippet({
      menus: [
        {
          label: 'Arquivo',
          items: [
            { label: 'Salvar' },
            { type: 'separator' },
            { label: 'Descartar alterações', variant: 'destructive' },
          ],
        },
      ],
    });
    expect(code).toContain("{ type: 'separator' }");
    expect(code).toContain("variant: 'destructive'");
    // `default` é o que a fábrica assume: repeti-lo não ensinaria nada.
    expect(code).not.toContain("variant: 'default'");
  });

  it('não mostra marcado junto com misto — o misto vale sobre ele', () => {
    const code = menubarSnippet({
      menus: [
        {
          label: 'Exibir',
          items: [
            { type: 'checkbox', label: 'Colunas', indeterminate: true, checked: true },
            { type: 'checkbox', label: 'Régua', checked: true },
            { type: 'checkbox', label: 'Grade' },
          ],
        },
      ],
    });
    expect(code).toContain("{ type: 'checkbox', label: 'Colunas', indeterminate: true }");
    expect(code).toContain("{ type: 'checkbox', label: 'Régua', checked: true }");
    expect(code).toContain("{ type: 'checkbox', label: 'Grade' }");
  });

  it('aninha o submenu e as opções da escolha única', () => {
    const code = menubarSnippet({
      menus: [
        {
          label: 'Arquivo',
          items: [
            { type: 'submenu', label: 'Exportar', items: [{ label: 'PDF' }, { label: 'CSV' }] },
            {
              type: 'radio-group',
              value: 'light',
              options: [
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Escuro' },
              ],
            },
          ],
        },
      ],
    });
    expect(code).toContain("type: 'submenu'");
    expect(code).toContain('items: [');
    expect(code).toContain("{ label: 'PDF' },");
    expect(code).toContain('options: [');
    expect(code).toContain("{ value: 'dark', label: 'Escuro' },");
  });

  it('mostra a limpeza só onde ela é o assunto', () => {
    expect(menubarSnippet()).not.toContain('destroy');
    expect(menubarSnippet({ destroy: true })).toContain('barra.destroy();');
  });

  it('não vaza o andaime das stories', () => {
    const code = menubarSnippet({ defaultOpen: 0 });
    expect(code).not.toContain('embrulhar');
    expect(code).not.toContain('esperarPainel');
    expect(code).not.toContain('gatilhosDe');
    expect(code).not.toContain('MENUS');
  });
});

describe('menubarSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = menubarSource('<div data-slot="menubar">', {});
    const isOpen = menubarSource('<div data-slot="menubar">', {
      args: { defaultOpen: true, side: 'top' },
    });
    expect(padrão).not.toBe(isOpen);
    expect(isOpen).toContain('defaultOpen: 0');
    expect(isOpen).toContain("side: 'top'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(menubarSource('<div data-slot="menubar" aria-orientation="horizontal">', {})).not.toContain(
      'aria-orientation',
    );
  });
});

describe('menubarSourceCom', () => {
  it('sobrepõe os args da story com a estrutura fixa', () => {
    const transform = menubarSourceWith({
      menus: [{ label: 'Exibir', items: [{ type: 'checkbox', label: 'Régua', checked: true }] }],
      defaultOpen: 0,
    });
    const code = transform('', { args: { defaultOpen: false, side: 'top' } });
    expect(code).toContain("label: 'Exibir'");
    expect(code).toContain('defaultOpen: 0');
    // O que o control ainda cobre continua passando.
    expect(code).toContain("side: 'top'");
    expect(code).not.toContain("label: 'Arquivo'");
  });
});
