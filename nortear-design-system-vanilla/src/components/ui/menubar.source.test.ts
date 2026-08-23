import { describe, expect, it } from 'vitest';
import { menubarSnippet, menubarSource, menubarSourceWith } from './menubar.source';

describe('menubarSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML da barra', () => {
    const código = menubarSnippet();
    expect(código).toContain("import { createMenubar } from '@/components/ui/menubar';");
    expect(código).toContain('createMenubar([');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="menubar"');
  });

  it('passa os menus no primeiro argumento, que é posicional', () => {
    const código = menubarSnippet();
    expect(código).toContain("label: 'Arquivo'");
    expect(código).toContain("{ label: 'Novo', shortcut: '⌘N', onClick: () => novo() },");
    expect(código).toContain("document.querySelector('#app')?.append(barra);");
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = menubarSnippet({ loop: true, side: 'bottom', align: 'start' });
    expect(código).not.toContain('loop');
    expect(código).not.toContain('side');
    expect(código).not.toContain('align');
    expect(código).not.toContain('defaultOpen');
    // Sem opção nenhuma o segundo argumento nem existe.
    expect(código).toContain('createMenubar([\n');
    expect(código).not.toContain('], {');
  });

  it('mostra as opções quando a story as usa', () => {
    const código = menubarSnippet({ loop: false, side: 'top', align: 'end', defaultOpen: 0 });
    expect(código).toContain('loop: false');
    expect(código).toContain("side: 'top'");
    expect(código).toContain("align: 'end'");
    expect(código).toContain('defaultOpen: 0');
  });

  it('traduz o control booleano de abertura para o índice que a fábrica recebe', () => {
    expect(menubarSnippet({ defaultOpen: true })).toContain('defaultOpen: 0');
    expect(menubarSnippet({ defaultOpen: false })).not.toContain('defaultOpen');
  });

  it('escreve a variante de perigo e o separador do menu', () => {
    const código = menubarSnippet({
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
    expect(código).toContain("{ type: 'separator' }");
    expect(código).toContain("variant: 'destructive'");
    // `default` é o que a fábrica assume: repeti-lo não ensinaria nada.
    expect(código).not.toContain("variant: 'default'");
  });

  it('não mostra marcado junto com misto — o misto vale sobre ele', () => {
    const código = menubarSnippet({
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
    expect(código).toContain("{ type: 'checkbox', label: 'Colunas', indeterminate: true }");
    expect(código).toContain("{ type: 'checkbox', label: 'Régua', checked: true }");
    expect(código).toContain("{ type: 'checkbox', label: 'Grade' }");
  });

  it('aninha o submenu e as opções da escolha única', () => {
    const código = menubarSnippet({
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
    expect(código).toContain("type: 'submenu'");
    expect(código).toContain('items: [');
    expect(código).toContain("{ label: 'PDF' },");
    expect(código).toContain('options: [');
    expect(código).toContain("{ value: 'dark', label: 'Escuro' },");
  });

  it('mostra a limpeza só onde ela é o assunto', () => {
    expect(menubarSnippet()).not.toContain('destroy');
    expect(menubarSnippet({ destroy: true })).toContain('barra.destroy();');
  });

  it('não vaza o andaime das stories', () => {
    const código = menubarSnippet({ defaultOpen: 0 });
    expect(código).not.toContain('embrulhar');
    expect(código).not.toContain('esperarPainel');
    expect(código).not.toContain('gatilhosDe');
    expect(código).not.toContain('MENUS');
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
    const código = transform('', { args: { defaultOpen: false, side: 'top' } });
    expect(código).toContain("label: 'Exibir'");
    expect(código).toContain('defaultOpen: 0');
    // O que o control ainda cobre continua passando.
    expect(código).toContain("side: 'top'");
    expect(código).not.toContain("label: 'Arquivo'");
  });
});
