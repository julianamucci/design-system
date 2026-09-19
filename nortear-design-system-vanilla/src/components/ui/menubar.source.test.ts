import { describe, expect, it } from 'vitest';
import {
  menubarControlledSource,
  menubarSnippet,
  menubarSource,
  menubarSourceWith,
} from './menubar.source';

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
    expect(code).toContain("{ label: 'Novo', shortcut: 'Ctrl+N', onClick: () => novo() },");
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
    const defaults = menubarSource('<div data-slot="menubar">', {});
    const isOpen = menubarSource('<div data-slot="menubar">', {
      args: { defaultOpen: true, side: 'top' },
    });
    expect(defaults).not.toBe(isOpen);
    expect(isOpen).toContain('defaultOpen: 0');
    expect(isOpen).toContain("side: 'top'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(menubarSource('<div data-slot="menubar" aria-orientation="horizontal">', {})).not.toContain(
      'aria-orientation',
    );
  });
});

/**
 * O snippet da story `ControlledOpen`, que este arquivo não cobria.
 *
 * A varredura transversal (`source-snippets.test.ts`) o chamava e conferia que
 * ele é honesto — importa o que usa, não vaza andaime —, mas nada cobrava o que
 * ele existe para ENSINAR: que a fábrica tem só a METADE de volta do par
 * controlado, e que o exemplo não pode inventar a prop que falta.
 */
describe('menubarControlledSource', () => {
  it('ensina o par que EXISTE: `defaultOpen` na construção e `onOpenChange` de volta', () => {
    const code = menubarControlledSource();
    expect(code).toContain("import { createMenubar } from '@/components/ui/menubar';");
    expect(code).toContain('onOpenChange:');
    expect(code).toContain('defaultOpen: indice');
    // A barra é REFEITA, que é o que "comandar" quer dizer aqui — e a anterior
    // precisa morrer, senão cada troca deixa uma barra viva com os ouvintes
    // dela presos ao documento.
    expect(code).toContain('barra.destroy();');
  });

  it('e NÃO inventa a prop de ida que a fábrica não tem', () => {
    // As outras stacks expõem uma ligação reativa (`open` + retorno). Aqui a
    // ida não existe: ensinar `open`/`setOpen` numa barra seria API que o
    // design system não publica.
    const code = menubarControlledSource();
    expect(code).not.toContain('barra.open(');
    expect(code).not.toContain('barra.setOpen(');
    expect(code).not.toContain('barra.toggle(');
    // E não volta a espiar o DOM: o caminho de volta é o callback.
    expect(code).not.toContain('MutationObserver');
    expect(code).not.toContain('aria-expanded');
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
